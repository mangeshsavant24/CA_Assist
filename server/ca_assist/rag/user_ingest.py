"""
rag/user_ingest.py
─────────────────────────────────────────────────────────────────
Per-user document ingestion into isolated ChromaDB collections.

Collection naming contract
  Universal knowledge : "universal_knowledge"
  Per-user documents  : "user_{user_id}_documents"

These conventions are shared with rag/rag_engine.py — do not change
them without updating both files.
"""
from __future__ import annotations

import logging
import os
from typing import Any

import chromadb
from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from rag.embedder import get_embedder

logger = logging.getLogger(__name__)

# ── Paths ──────────────────────────────────────────────────────────
CHROMA_DATA_DIR = os.getenv("CHROMA_PATH", "./chroma_data")

# ── Chunking config ────────────────────────────────────────────────
CHUNK_SIZE = 600
CHUNK_OVERLAP = 80
SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", "。", ".", " ", ""],
)


# ═══════════════════════════════════════════════════════════════════
# Public helpers (shared with rag_engine.py)
# ═══════════════════════════════════════════════════════════════════

def get_user_collection_name(user_id: str | int) -> str:
    """Return the ChromaDB collection name for a specific user."""
    return f"user_{user_id}_documents"


def get_chroma_client() -> chromadb.PersistentClient:
    """
    Return a ChromaDB PersistentClient so collections survive restarts.
    The path is read from CHROMA_PATH env var (default: ./chroma_data).
    """
    os.makedirs(CHROMA_DATA_DIR, exist_ok=True)
    return chromadb.PersistentClient(path=CHROMA_DATA_DIR)


def collection_exists(client: chromadb.PersistentClient, name: str) -> bool:
    """Return True if a named collection currently exists in ChromaDB."""
    try:
        existing = [c.name for c in client.list_collections()]
        return name in existing
    except Exception:
        return False


# ═══════════════════════════════════════════════════════════════════
# PART 2 — Ingest a single user document into the user's collection
# ═══════════════════════════════════════════════════════════════════

def ingest_user_document(
    file_path: str,
    filename: str,
    user_id: str | int,
    document_id: str | int = "",
    document_type: str = "unknown",
    extracted_text: str = "",
) -> dict[str, Any]:
    """
    Ingest a user's document into their isolated ChromaDB collection.

    Parameters
    ----------
    file_path       : Absolute or relative path to the saved file
                      (used only for fallback text extraction if
                      extracted_text is empty).
    filename        : Original filename shown in the UI.
    user_id         : The authenticated user's UUID / integer ID.
    document_id     : Database ID of the UserDocument record (for
                      cross-referencing metadata).
    document_type   : Result of document_agent classification
                      (e.g. "salary_slip", "invoice").
    extracted_text  : Pre-extracted text from document_agent.
                      Pass this to avoid a second OCR run.

    Returns
    -------
    dict with keys: chunks_added, collection, document_id, error
    """
    try:
        # ── 1. Obtain text ─────────────────────────────────────────
        text = extracted_text.strip() if extracted_text else ""

        # Fallback: if caller didn't supply extracted_text, extract now
        if not text and file_path and os.path.exists(file_path):
            try:
                from agents.document_agent import extract_text_from_file
                text = extract_text_from_file(file_path)
            except Exception as exc:
                logger.warning("Fallback text extraction failed: %s", exc)

        if not text:
            return {
                "chunks_added": 0,
                "collection": get_user_collection_name(user_id),
                "document_id": document_id,
                "error": "No text content could be extracted from the document.",
            }

        # ── 2. Split into chunks ───────────────────────────────────
        raw_doc = Document(page_content=text, metadata={"source": filename})
        chunks = SPLITTER.split_documents([raw_doc])
        total = len(chunks)

        # ── 3. Attach per-chunk metadata ───────────────────────────
        for i, chunk in enumerate(chunks):
            chunk.metadata.update(
                {
                    "user_id": str(user_id),
                    "document_id": str(document_id),
                    "filename": filename,
                    "document_type": document_type,
                    "source": "user_upload",
                    "chunk_index": i,
                    "total_chunks": total,
                }
            )

        # ── 4. Store in user's isolated collection ─────────────────
        collection_name = get_user_collection_name(user_id)
        embedder = get_embedder()

        vectorstore = Chroma(
            collection_name=collection_name,
            embedding_function=embedder,
            persist_directory=CHROMA_DATA_DIR,
        )
        vectorstore.add_documents(chunks)

        logger.info(
            "Ingested %d chunks into collection '%s' for user %s (doc_id=%s)",
            total,
            collection_name,
            user_id,
            document_id,
        )
        return {
            "chunks_added": total,
            "collection": collection_name,
            "document_id": document_id,
            "error": None,
        }

    except Exception as exc:
        logger.error("ingest_user_document failed: %s", exc, exc_info=True)
        return {
            "chunks_added": 0,
            "collection": get_user_collection_name(user_id),
            "document_id": document_id,
            "error": str(exc),
        }


# ═══════════════════════════════════════════════════════════════════
# Deletion helper — removes all chunks for a given document_id
# ═══════════════════════════════════════════════════════════════════

def delete_user_document_chunks(user_id: str | int, document_id: str | int) -> int:
    """
    Delete all ChromaDB chunks that belong to a specific document.
    Returns the number of chunks removed.
    """
    try:
        collection_name = get_user_collection_name(user_id)
        client = get_chroma_client()

        if not collection_exists(client, collection_name):
            return 0

        collection = client.get_collection(collection_name)
        results = collection.get(where={"document_id": str(document_id)})
        ids = results.get("ids", [])

        if ids:
            collection.delete(ids=ids)
            logger.info(
                "Deleted %d chunks for document_id=%s from collection '%s'",
                len(ids),
                document_id,
                collection_name,
            )
        return len(ids)

    except Exception as exc:
        logger.error("delete_user_document_chunks failed: %s", exc, exc_info=True)
        return 0


# ═══════════════════════════════════════════════════════════════════
# Convenience: get user document list from ChromaDB (not DB)
# ═══════════════════════════════════════════════════════════════════

def get_user_documents(user_id: str | int, k: int = 5) -> list[dict]:
    """
    Retrieve up to k unique filenames ingested for a user.
    Returns a list of metadata dicts, one per unique document.
    """
    try:
        collection_name = get_user_collection_name(user_id)
        client = get_chroma_client()

        if not collection_exists(client, collection_name):
            return []

        collection = client.get_collection(collection_name)
        results = collection.get(
            where={"user_id": str(user_id)},
            limit=k * 10,  # over-fetch so we can de-dup by filename
        )
        metadatas = results.get("metadatas", [])

        # De-duplicate by filename
        seen: set[str] = set()
        unique = []
        for meta in metadatas:
            fname = meta.get("filename", "")
            if fname and fname not in seen:
                seen.add(fname)
                unique.append(meta)
                if len(unique) >= k:
                    break

        return unique

    except Exception as exc:
        logger.error("get_user_documents failed: %s", exc, exc_info=True)
        return []
