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

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from agents.orchestrator import Orchestrator
from api.dependencies import get_current_user
from api.schemas import CitedResponse, Citation, Intent
from models import User
from rag.rag_engine import build_rag_prompt, query_rag

logger = logging.getLogger(__name__)

router = APIRouter()


class QueryRequest(BaseModel):
    query: str


# ─────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────

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
    Main chat query endpoint.

    Accepts { "query": "..." }
    Returns  { "answer": "...", "citations": [...] }
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

    # ── Step 2: Build the enriched prompt ────────────────────────
    enriched_prompt = build_rag_prompt(question, rag_result)

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
            query=enriched_prompt,   # ← RAG context + question bundled
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
