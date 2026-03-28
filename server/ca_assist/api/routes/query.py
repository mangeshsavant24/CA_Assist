"""
api/routes/query.py
─────────────────────────────────────────────────────────────────
Chat query endpoint.

Flow per request:
  1. Authenticate user via JWT
  2. Run dual-collection RAG (universal + user's private docs)
  3. Classify intent (LLM — falls back gracefully if unavailable)
  4. Route to the appropriate agent with RAG context already attached
  5. Return CitedResponse (answer + citations)

The endpoint works even if:
  - The user has no personal documents (universal collection only)
  - The LLM is unavailable (returns RAG context as plain answer)
  - The universal collection is empty (returns LLM-only answer)
"""
import logging
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from agents.orchestrator import Orchestrator
from api.dependencies import get_current_user
from api.schemas import CitedResponse, Citation, Intent, QueryRequest, HistoryMessage
from models import User
from rag.rag_engine import build_rag_prompt, query_rag

logger = logging.getLogger(__name__)

router = APIRouter()


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────

def _format_history_context(history: list[HistoryMessage] | None) -> str:
    """Format conversation history into a string for the prompt context."""
    if not history:
        return ""
    
    context_lines = ["CONVERSATION HISTORY:"]
    for msg in history[-10:]:  # Only include last 10 messages to stay within token limits
        role = "User" if msg.role == "user" else "Assistant"
        context_lines.append(f"{role}: {msg.content}")
    
    context_lines.append("\n" + "="*60 + "\n")
    return "\n".join(context_lines)


def _rag_citations_to_schema(raw_citations: list[dict]) -> list[Citation]:
    """Convert RAG engine citation dicts into Pydantic Citation objects."""
    result: list[Citation] = []
    for cit in raw_citations:
        result.append(
            Citation(
                source=cit.get("source", ""),
                section=cit.get("section", ""),
                act=cit.get("act", ""),
                url=cit.get("url"),
            )
        )
    return result


def _fallback_response(question: str, rag_result: dict) -> CitedResponse:
    """
    Return when the LLM is completely unavailable.
    We surface the raw RAG context so the user at least gets the
    retrieved text and sees the citations.
    """
    context = rag_result.get("context", "")
    citations = _rag_citations_to_schema(rag_result.get("citations", []))

    if context:
        answer = (
            "⚠️ The AI assistant is currently unavailable (LLM offline). "
            "Here are the most relevant passages from the knowledge base:\n\n"
            + context[:2000]
        )
    else:
        answer = (
            "⚠️ The AI assistant is currently unavailable and no relevant "
            "documents were found. Please check the server configuration."
        )

    return CitedResponse(answer=answer, citations=citations)


# ─────────────────────────────────────────────────────────────────
# PART 5 — Query endpoint
# ─────────────────────────────────────────────────────────────────

@router.post("", response_model=CitedResponse)
def handle_query(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Main chat query endpoint with conversation history support.

    Accepts:
    {
        "query": "...",
        "history": [
            {"role": "user", "content": "..."},
            {"role": "assistant", "content": "..."},
            ...
        ]
    }
    
    Returns { "answer": "...", "citations": [...] }
    """
    question = request.query.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    user_id = str(current_user.id)

    # ── Step 1: Dual-collection RAG retrieval ─────────────────────
    rag_result = query_rag(
        question=question,
        user_id=user_id,
        n_universal=4,
        n_user=3,
    )

    logger.info(
        "RAG: user=%s  universal=%d  user_docs=%d",
        user_id,
        rag_result["universal_docs_found"],
        rag_result["user_docs_found"],
    )

    # ── Step 2: Build the enriched prompt with history context ────
    enriched_prompt = build_rag_prompt(question, rag_result)
    
    # Prepend conversation history if provided
    history_context = _format_history_context(request.history)
    if history_context:
        enriched_prompt = history_context + "\nNEW QUESTION:\n" + enriched_prompt

    # ── Step 3: Classify intent + route to agent ─────────────────
    try:
        orchestrator = Orchestrator()

        # Classify intent from the *original* question (not the enriched prompt)
        intent = orchestrator.classify_intent(question)

        # REGIME_COMPARE: redirect — the calculation endpoint handles it
        if intent == Intent.REGIME_COMPARE:
            return CitedResponse(
                answer=(
                    "Please use the **Regime Calculator** tab to compare tax regimes. "
                    "Upload your salary slip first for the most accurate comparison."
                ),
                citations=[],
            )

        # All other intents: route the ENRICHED prompt to the agent
        # Each agent will use this context instead of calling
        # fetch_relevant_docs() independently, giving them per-user context.
        result = orchestrator.route(
            intent=intent,
            query=enriched_prompt,   # ← RAG context + history + question bundled
            original_query=question,
        )

        # ── Merge RAG citations into agent citations ───────────────
        rag_citations = _rag_citations_to_schema(rag_result["citations"])

        if isinstance(result, CitedResponse):
            # De-duplicate: start with agent's own citations, append RAG ones not already present
            existing_sources = {c.source for c in result.citations}
            merged_citations = list(result.citations) + [
                c for c in rag_citations if c.source not in existing_sources
            ]
            return CitedResponse(answer=result.answer, citations=merged_citations)

        # Agent returned a plain dict (shouldn't normally happen)
        return CitedResponse(
            answer=result.get("answer", "No answer generated."),
            citations=rag_citations,
        )

    except RuntimeError as exc:
        # LLM completely unavailable — surface RAG context as-is
        logger.warning("LLM unavailable for query: %s", exc)
        return _fallback_response(question, rag_result)

    except Exception as exc:
        logger.error("Query handler error: %s", exc, exc_info=True)
        # Return a safe error response rather than a 500
        return CitedResponse(
            answer=(
                "An error occurred while processing your query. "
                "Please try again or rephrase your question."
            ),
            citations=[],
        )


# ─────────────────────────────────────────────────────────────────
# Streaming Query endpoint (SSE - Server-Sent Events)
# ─────────────────────────────────────────────────────────────────

def _stream_generator(request: QueryRequest, user_id: str):
    """
    Generator function for streaming query responses.
    Yields SSE formatted data chunks as tokens arrive from the LLM.
    """
    try:
        # ── Step 1: Dual-collection RAG retrieval ─────────────────────
        rag_result = query_rag(
            question=request.query.strip(),
            user_id=user_id,
            n_universal=4,
            n_user=3,
        )

        # ── Step 2: Build the enriched prompt with history context ────
        enriched_prompt = build_rag_prompt(request.query, rag_result)
        
        # Prepend conversation history if provided
        history_context = _format_history_context(request.history)
        if history_context:
            enriched_prompt = history_context + "\nNEW QUESTION:\n" + enriched_prompt

        # ── Step 3: Classify intent + route to agent ─────────────────
        orchestrator = Orchestrator()
        intent = orchestrator.classify_intent(request.query)

        # For now, don't stream regime compare
        if intent == Intent.REGIME_COMPARE:
            yield f'data: {json.dumps({"type": "chunk", "content": "Please use the Regime Calculator tab to compare tax regimes. Upload your salary slip first for the most accurate comparison."})}\n\n'
            yield f'data: {json.dumps({"type": "end", "citations": []})}\n\n'
            return

        # Get agent response
        result = orchestrator.route(
            intent=intent,
            query=enriched_prompt,
            original_query=request.query,
        )

        # Extract answer and citations
        if isinstance(result, CitedResponse):
            answer = result.answer
            citations = result.citations
        else:
            answer = result.get("answer", "No answer generated.")
            citations = _rag_citations_to_schema(rag_result.get("citations", []))

        # Stream the answer word-by-word for better UX
        # (tokens would be more granular but words are better for display)
        words = answer.split()
        for i, word in enumerate(words):
            content = word + (" " if i < len(words) - 1 else "")
            yield f'data: {json.dumps({"type": "chunk", "content": content})}\n\n'

        # Send citations at the end
        citation_list = [c.dict() if hasattr(c, 'dict') else c for c in citations]
        yield f'data: {json.dumps({"type": "end", "citations": citation_list})}\n\n'

    except Exception as exc:
        logger.error("Stream handler error: %s", exc, exc_info=True)
        error_msg = "An error occurred processing your query. Please try again."
        yield f'data: {json.dumps({"type": "chunk", "content": error_msg})}\n\n'
        yield f'data: {json.dumps({"type": "end", "citations": []})}\n\n'


@router.post("/stream")
def stream_query(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Streaming query endpoint using Server-Sent Events (SSE).
    
    Chunks arrive as: data: {"type":"chunk","content":"token"}\n\n
    Final message:    data: {"type":"end","citations":[...]}\n\n
    """
    user_id = str(current_user.id)
    return StreamingResponse(
        _stream_generator(request, user_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )
