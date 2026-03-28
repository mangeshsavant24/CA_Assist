"""
rag/universal_ingest.py
─────────────────────────────────────────────────────────────────
One-time setup script: ingests universal legal knowledge into the
shared "universal_knowledge" ChromaDB collection.

Run manually:
    cd server/ca_assist
    python -m rag.universal_ingest

Or import and call programmatically:
    from rag.universal_ingest import ingest_universal_document

Universal documents (Income Tax Act, GST Act, CBDT circulars,
ICAI standards) are NEVER tied to a user — every query always
searches this collection, regardless of who is logged in.
"""
from __future__ import annotations

import logging
import os
import sys
from pathlib import Path
from typing import Any

from langchain_chroma import Chroma
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from rag.embedder import get_embedder
from rag.user_ingest import (
    CHROMA_DATA_DIR,
    CHUNK_OVERLAP,
    CHUNK_SIZE,
    collection_exists,
    get_chroma_client,
)

logger = logging.getLogger(__name__)

# ── Constants ──────────────────────────────────────────────────────
UNIVERSAL_COLLECTION = "universal_knowledge"
UNIVERSAL_DOCS_DIR = "./universal_docs"

# Re-use the same splitter config as user documents
SPLITTER = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=["\n\n", "\n", "。", ".", " ", ""],
)


# ═══════════════════════════════════════════════════════════════════
# PART 3 — Universal document ingest
# ═══════════════════════════════════════════════════════════════════

def ingest_universal_document(
    file_path: str,
    document_name: str,
    act_name: str,
    category: str,
    skip_if_exists: bool = True,
) -> dict[str, Any]:
    """
    Ingest a universal legal document into the shared knowledge collection.

    Parameters
    ----------
    file_path       : Path to the source PDF (or TXT/DOCX).
    document_name   : Human-readable unique name for this document,
                      e.g. "Income Tax Act 1961 - Sections 1-100".
                      Used as the skip-if-exists key.
    act_name        : Formal act name, e.g. "Income Tax Act, 1961".
    category        : One of "tax_law" | "gst_law" | "icai" | "cbdt" | "other".
    skip_if_exists  : If True and document_name already exists in the
                      collection, skip without re-ingesting.

    Returns
    -------
    dict with keys: chunks_added, collection, skipped, error
    """
    try:
        # ── Guard: check if already ingested ──────────────────────
        if skip_if_exists:
            client = get_chroma_client()
            if collection_exists(client, UNIVERSAL_COLLECTION):
                coll = client.get_collection(UNIVERSAL_COLLECTION)
                existing = coll.get(
                    where={"document_name": document_name},
                    limit=1,
                )
                if existing.get("ids"):
                    logger.info(
                        "Skipping '%s' — already ingested into universal collection.",
                        document_name,
                    )
                    return {
                        "chunks_added": 0,
                        "collection": UNIVERSAL_COLLECTION,
                        "skipped": True,
                        "error": None,
                    }

        # ── Extract text ───────────────────────────────────────────
        if not os.path.exists(file_path):
            return {
                "chunks_added": 0,
                "collection": UNIVERSAL_COLLECTION,
                "skipped": False,
                "error": f"File not found: {file_path}",
            }

        from agents.document_agent import extract_text_from_file
        text = extract_text_from_file(file_path)

        if not text.strip():
            return {
                "chunks_added": 0,
                "collection": UNIVERSAL_COLLECTION,
                "skipped": False,
                "error": f"No text extracted from {file_path}",
            }

        # ── Split ──────────────────────────────────────────────────
        raw_doc = Document(page_content=text, metadata={"source": file_path})
        chunks = SPLITTER.split_documents([raw_doc])
        total = len(chunks)

        # ── Metadata + section enrichment ─────────────────────────
        import re
        for i, chunk in enumerate(chunks):
            meta: dict = {
                "source": "universal",
                "document_name": document_name,
                "act_name": act_name,
                "category": category,
                "chunk_index": i,
                "total_chunks": total,
            }

            # Auto-detect section / circular numbers from content
            sec_m = re.search(r"Section\s+(\d+[A-Z]?)", chunk.page_content, re.IGNORECASE)
            circ_m = re.search(r"Circular\s+No\.?\s*(\d+)", chunk.page_content, re.IGNORECASE)
            if sec_m:
                meta["section"] = sec_m.group(1)
                meta["act"] = act_name
                meta["chunk_type"] = "section"
            elif circ_m:
                meta["circular_id"] = circ_m.group(1)
                meta["chunk_type"] = "circular"
            else:
                meta["chunk_type"] = "standard"

            chunk.metadata.update(meta)

        # ── Store in universal collection ──────────────────────────
        embedder = get_embedder()
        vectorstore = Chroma(
            collection_name=UNIVERSAL_COLLECTION,
            embedding_function=embedder,
            persist_directory=CHROMA_DATA_DIR,
        )
        vectorstore.add_documents(chunks)

        logger.info(
            "Ingested '%s' → %d chunks into '%s'",
            document_name,
            total,
            UNIVERSAL_COLLECTION,
        )
        return {
            "chunks_added": total,
            "collection": UNIVERSAL_COLLECTION,
            "skipped": False,
            "error": None,
        }

    except Exception as exc:
        logger.error("ingest_universal_document failed: %s", exc, exc_info=True)
        return {
            "chunks_added": 0,
            "collection": UNIVERSAL_COLLECTION,
            "skipped": False,
            "error": str(exc),
        }


# ═══════════════════════════════════════════════════════════════════
# Filename → metadata inference helper
# ═══════════════════════════════════════════════════════════════════

def _infer_metadata(filename: str) -> tuple[str, str, str]:
    """
    Guess act_name and category from a PDF filename.
    Returns (document_name, act_name, category).
    """
    name = Path(filename).stem.lower()

    if "income tax" in name or "ita" in name:
        act = "Income Tax Act, 1961"
        cat = "tax_law"
    elif "gst" in name:
        act = "Central Goods and Services Tax Act, 2017"
        cat = "gst_law"
    elif "cbdt" in name or "circular" in name:
        act = "CBDT Circular"
        cat = "cbdt"
    elif "icai" in name:
        act = "ICAI Standards"
        cat = "icai"
    elif "customs" in name:
        act = "Customs Act, 1962"
        cat = "tax_law"
    else:
        act = Path(filename).stem  # Use stem as act name fallback
        cat = "other"

    document_name = Path(filename).stem.replace("_", " ").replace("-", " ").title()
    return document_name, act, cat


# ═══════════════════════════════════════════════════════════════════
# CLI entry point — ingests all PDFs from ./universal_docs/
# ═══════════════════════════════════════════════════════════════════

def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(levelname)-8s  %(message)s",
        datefmt="%H:%M:%S",
    )

    docs_dir = Path(UNIVERSAL_DOCS_DIR)
    if not docs_dir.exists():
        docs_dir.mkdir(parents=True)
        print(f"Created {docs_dir}. Drop universal PDF documents there and re-run.")
        sys.exit(0)

    supported = {".pdf", ".txt", ".docx"}
    files = [f for f in docs_dir.iterdir() if f.suffix.lower() in supported]

    if not files:
        print(f"No supported documents found in {docs_dir}.")
        print("Supported formats: PDF, TXT, DOCX")
        sys.exit(0)

    print(f"Found {len(files)} document(s) to ingest.\n")

    total_chunks = 0
    skipped = 0
    errors = 0

    for fp in sorted(files):
        document_name, act_name, category = _infer_metadata(fp.name)
        print(f"  ▶ {fp.name}")
        print(f"    Act  : {act_name}")
        print(f"    Cat  : {category}")

        result = ingest_universal_document(
            file_path=str(fp),
            document_name=document_name,
            act_name=act_name,
            category=category,
            skip_if_exists=True,
        )

        if result["error"]:
            print(f"    ✗ ERROR: {result['error']}")
            errors += 1
        elif result["skipped"]:
            print(f"    ↩ SKIPPED (already ingested)")
            skipped += 1
        else:
            chunks = result["chunks_added"]
            print(f"    ✓ Ingested {chunks} chunks")
            total_chunks += chunks
        print()

    print("─" * 50)
    print(f"Done.  Ingested: {total_chunks} chunks  |  "
          f"Skipped: {skipped}  |  Errors: {errors}")
    print(f"Collection: '{UNIVERSAL_COLLECTION}'")


if __name__ == "__main__":
    main()
