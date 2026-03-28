"""
rag/rag_engine.py
─────────────────────────────────────────────────────────────────
Dual-collection RAG query engine.

Every query merges results from TWO sources:
  1. "universal_knowledge" — shared legal corpus (Income Tax Act,
     GST Act, CBDT circulars, ICAI standards).  Always searched.
  2. "user_{user_id}_documents" — private documents uploaded by
     this specific user.  Searched only if the collection exists.

User-specific docs are placed FIRST in the context so they receive
higher attention weight from the LLM (more specific → higher trust).
"""
from __future__ import annotations

import logging
from typing import Any, Sequence

from langchain_chroma import Chroma
from langchain_core.documents import Document

from rag.embedder import get_embedder
from rag.user_ingest import (
    CHROMA_DATA_DIR,
    collection_exists,
    get_chroma_client,
    get_user_collection_name,
)
from rag.universal_ingest import UNIVERSAL_COLLECTION

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════════════
# Internal helpers
# ═══════════════════════════════════════════════════════════════════

def _load_vectorstore(collection_name: str) -> Chroma:
    """Load an existing ChromaDB collection as a LangChain Chroma object."""
    return Chroma(
        collection_name=collection_name,
        embedding_function=get_embedder(),
        persist_directory=CHROMA_DATA_DIR,
    )


def _retrieve(vectorstore: Chroma, question: str, k: int) -> list[Document]:
    """Safely retrieve k documents; returns [] if the store is empty or fails."""
    try:
        retriever = vectorstore.as_retriever(search_kwargs={"k": k})
        return retriever.invoke(question)
    except Exception as exc:
        logger.debug("Retrieval failed for %s: %s", vectorstore._collection_name, exc)
        return []


def _build_citation(doc: Document) -> dict[str, Any]:
    """Build a citation dict from a document's metadata."""
    meta = doc.metadata
    source_type = meta.get("source", "unknown")

    if source_type == "universal":
        # Prefer act_name, fallback to document_name
        label = meta.get("act_name") or meta.get("document_name") or "Legal Reference"
        section = meta.get("section", "")
        circular = meta.get("circular_id", "")

        return {
            "source": f"{label}{', §' + section if section else ''}"
                      f"{', Circular ' + circular if circular else ''}",
            "type": "universal",
            "act": meta.get("act_name", ""),
            "section": section,
            "circular_id": circular,
            "category": meta.get("category", ""),
        }
    else:
        # User-uploaded document
        filename = meta.get("filename", "Your document")
        doc_type = meta.get("document_type", "")
        return {
            "source": f"Your document: {filename}",
            "type": "user_upload",
            "filename": filename,
            "document_type": doc_type,
            "act": "",
            "section": "",
        }


# ═══════════════════════════════════════════════════════════════════
# PART 4 — Public query function
# ═══════════════════════════════════════════════════════════════════

def query_rag(
    question: str,
    user_id: str | int,
    n_universal: int = 4,
    n_user: int = 3,
) -> dict[str, Any]:
    """
    Query both the universal knowledge base and the user's private
    document collection, returning merged context + citations.

    Parameters
    ----------
    question    : The user's natural-language question.
    user_id     : Authenticated user's ID (UUID string or int).
    n_universal : Number of chunks to retrieve from universal KB.
    n_user      : Number of chunks to retrieve from user's docs.

    Returns
    -------
    {
        "context"              : str   — merged context string for LLM prompt
        "citations"            : list  — citation dicts for each source chunk
        "user_docs_found"      : int   — chunks found from user's collection
        "universal_docs_found" : int   — chunks found from universal collection
        "has_user_docs"        : bool  — whether user has any personal docs
    }
    """
    user_docs: list[Document] = []
    universal_docs: list[Document] = []
    has_user_docs = False

    # ── 1. Query universal collection (always) ─────────────────────
    try:
        client = get_chroma_client()
        if collection_exists(client, UNIVERSAL_COLLECTION):
            vs_universal = _load_vectorstore(UNIVERSAL_COLLECTION)
            universal_docs = _retrieve(vs_universal, question, n_universal)
        else:
            logger.info(
                "Universal collection '%s' not found. "
                "Run 'python -m rag.universal_ingest' to populate it.",
                UNIVERSAL_COLLECTION,
            )
    except Exception as exc:
        logger.warning("Universal collection query failed: %s", exc)

    # ── 2. Query user's personal collection (if it exists) ─────────
    try:
        user_collection_name = get_user_collection_name(user_id)
        if collection_exists(client, user_collection_name):
            has_user_docs = True
            vs_user = _load_vectorstore(user_collection_name)
            user_docs = _retrieve(vs_user, question, n_user)
        else:
            logger.debug(
                "No personal collection for user %s yet — "
                "will use only universal knowledge.",
                user_id,
            )
    except Exception as exc:
        logger.warning("User collection query failed (user=%s): %s", user_id, exc)

    # ── 3. Merge: user docs first (more specific → higher attention) 
    all_docs: list[Document] = user_docs + universal_docs

    # ── 4. Build context string ────────────────────────────────────
    context_parts: list[str] = []
    for doc in all_docs:
        src = doc.metadata.get("source", "unknown")
        if src == "user_upload":
            header = f"[Your Document — {doc.metadata.get('filename', '')}]"
        else:
            header = (
                f"[{doc.metadata.get('act_name', doc.metadata.get('document_name', 'Legal Reference'))}]"
            )
        context_parts.append(f"{header}\n{doc.page_content}")

    context = "\n\n---\n\n".join(context_parts) if context_parts else ""

    # ── 5. Build citation list ─────────────────────────────────────
    # De-duplicate by source label
    citations: list[dict] = []
    seen_sources: set[str] = set()
    for doc in all_docs:
        cit = _build_citation(doc)
        label = cit["source"]
        if label not in seen_sources:
            seen_sources.add(label)
            citations.append(cit)

    return {
        "context": context,
        "citations": citations,
        "user_docs_found": len(user_docs),
        "universal_docs_found": len(universal_docs),
        "has_user_docs": has_user_docs,
    }


# ═══════════════════════════════════════════════════════════════════
# Convenience — build a complete LLM prompt from RAG results
# ═══════════════════════════════════════════════════════════════════

def build_rag_prompt(question: str, rag_result: dict[str, Any]) -> str:
    """
    Combine the RAG context with the user's question into a prompt
    suitable for any LLM (Ollama or OpenAI).

    The prompt instructs the LLM to:
      - Answer using ONLY the provided context where possible
      - Cite sources using the [Source Name] format
      - If context is empty, still attempt a helpful response with
        a disclaimer
    """
    context = rag_result.get("context", "").strip()
    user_docs_found = rag_result.get("user_docs_found", 0)

    if context:
        context_section = (
            f"RETRIEVED CONTEXT\n"
            f"─────────────────\n"
            f"{context}\n"
            f"─────────────────\n"
            f"(User documents: {user_docs_found} chunk(s) included above)\n"
        )
    else:
        context_section = (
            "RETRIEVED CONTEXT\n"
            "─────────────────\n"
            "No relevant documents found in the knowledge base.\n"
            "Answer from your general knowledge but add a disclaimer.\n"
            "─────────────────\n"
        )

    return (
        f"{context_section}\n"
        f"USER QUESTION\n"
        f"─────────────\n"
        f"{question}\n\n"
        f"INSTRUCTIONS\n"
        f"─────────────\n"
        f"- Answer based on the context above.\n"
        f"- Cite every claim using the format [Source Name] or [Section X, Act].\n"
        f"- Be concise and accurate.\n"
        f"- If the answer is about the user's personal documents, refer to them "
        f"as 'your uploaded document'."
    )
