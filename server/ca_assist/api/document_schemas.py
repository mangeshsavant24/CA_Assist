from pydantic import BaseModel
from typing import Optional, List
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
    """Extracted financial data from document"""
    gross_salary: Optional[float] = None
    tds_deducted: Optional[float] = None
    pf: Optional[float] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    document_type: str = "unknown"
    is_relevant_for_regime: bool = False
    relevance_reason: Optional[str] = None


class DocumentUploadResponse(BaseModel):
    """Complete response from document upload"""
    document: UserDocumentResponse
    ingest_result: DocumentIngestResult
    extracted_data: Optional[ExtractedDataResponse] = None
    document_type: Optional[str] = None
    error: Optional[str] = None  # Error message if extraction failed

