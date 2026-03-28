from pydantic import BaseModel
from typing import Any, Dict, Optional
from datetime import datetime


class DocumentUploadRequest(BaseModel):
    """Request model for document upload"""
    # File is handled separately by FastAPI UploadFile
    description: Optional[str] = None


class UserDocumentResponse(BaseModel):
    """Response model for a user's document"""
    id: str
    original_filename: str
    file_path: str
    file_size: int
    description: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentIngestResult(BaseModel):
    """Result of ingesting a document into ChromaDB"""
    success: bool
    chunks_added: int
    error: Optional[str] = None


class ExtractedDataResponse(BaseModel):
    """
    Structured extraction result from document_agent.process_document().

    Legacy fields (always present, backward-compatible with frontend):
      gross_salary, tds_deducted, pf, pan, gstin,
      document_type, is_relevant_for_regime, relevance_reason

    New fields (richer metadata for next-phase UI enhancements):
      confidence, detected_by, llm_enhancement,
      is_relevant_for_forex, is_relevant_for_fund,
      basic_pay, hra, net_pay, pay_period,
      extracted_text_preview
    """
    # ── Legacy / backward-compatible fields ──────────────────────
    gross_salary: Optional[float] = None
    tds_deducted: Optional[float] = None
    pf: Optional[float] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    document_type: str = "unknown"
    is_relevant_for_regime: bool = False
    relevance_reason: Optional[str] = None

    # ── Extraction quality metadata ───────────────────────────────
    confidence: float = 0.0
    detected_by: str = "heuristic"        # "heuristic" | "llm"
    llm_enhancement: str = "unavailable"  # "applied" | "skipped" | "unavailable" | "failed"

    # ── Additional relevance flags ────────────────────────────────
    is_relevant_for_forex: bool = False
    is_relevant_for_fund: bool = False

    # ── Extended salary/payroll fields ────────────────────────────
    basic_pay: Optional[float] = None
    hra: Optional[float] = None
    net_pay: Optional[float] = None
    pay_period: Optional[str] = None      # e.g. "March 2025"

    # ── Preview of extracted raw text (first 500 chars) ──────────
    extracted_text_preview: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    """Complete response from POST /document/upload"""
    document: UserDocumentResponse
    ingest_result: DocumentIngestResult
    extracted_data: Optional[ExtractedDataResponse] = None
    document_type: Optional[str] = None
    error: Optional[str] = None   # Non-null only if extraction fully failed
