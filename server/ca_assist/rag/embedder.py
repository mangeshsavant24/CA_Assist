"""
rag/embedder.py
─────────────────────────────────────────────────────────────────
Singleton embedder — loads the HuggingFace model exactly once per
process, regardless of how many collections use it.
"""
from __future__ import annotations
from langchain_huggingface import HuggingFaceEmbeddings

_embedder: HuggingFaceEmbeddings | None = None

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def get_embedder() -> HuggingFaceEmbeddings:
    """Return a process-level singleton embedder."""
    global _embedder
    if _embedder is None:
        _embedder = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    return _embedder
