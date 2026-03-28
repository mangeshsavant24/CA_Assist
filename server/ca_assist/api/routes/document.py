from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from api.schemas import CitedResponse
from api.dependencies import get_current_user
from api.document_schemas import DocumentUploadResponse, UserDocumentResponse, ExtractedDataResponse
from models import User, UserDocument
from database import get_db
from agents.advisory_agent import AdvisoryAgent
from agents.document_agent import DocumentAgent
from rag.user_ingest import ingest_user_document
import os
import shutil
from datetime import datetime

router = APIRouter()

# Base directory for user documents
USER_DOCUMENTS_BASE = "./user_documents"


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a document for the current user.
    File is stored in user-specific folder and indexed in ChromaDB with user_id metadata.
    Extracts financial data and determines relevance for regime calculations.
    """
    try:
        # File type validation
        extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        allowed_extensions = {"pdf", "png", "jpg", "jpeg"}
        if extension not in allowed_extensions:
            return JSONResponse(
                status_code=400,
                content={
                    "success": False,
                    "message": "Only PDF, JPEG, and PNG files are supported.",
                    "extracted_text": None,
                    "chunks_added": 0,
                    "error": "Unsupported file type: .%s" % extension,
                },
            )

        # Create user-specific folder
        user_folder = os.path.join(USER_DOCUMENTS_BASE, str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        
        # Save file to user folder
        file_path = os.path.join(user_folder, file.filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Get file size
        file_size = os.path.getsize(file_path)

        # ── Step 1: Extract text + classify document (DocumentAgent) ──
        extraction_error = None
        doc_agent = DocumentAgent()
        try:
            extraction_result = doc_agent.handle(file_path)
            print(f"[DOCUMENT] Extraction result: {extraction_result}")
        except Exception as agent_exc:
            print(f"[DOCUMENT] DocumentAgent.handle failed: {agent_exc}")
            raise agent_exc

        document_type = extraction_result.get("document_type", "unknown")
        is_relevant = extraction_result.get("is_relevant_for_regime", False)
        is_relevant_forex = extraction_result.get("is_relevant_for_forex", False)
        is_relevant_fund = extraction_result.get("is_relevant_for_fund", False)
        extracted_text_preview = extraction_result.get("extracted_text_preview", "")
        confidence = extraction_result.get("confidence", 0.0)
        detected_by = extraction_result.get("detected_by", "heuristic")
        llm_enhancement = extraction_result.get("llm_enhancement", "unavailable")

        # ── Step 2: Create database record ────────────────────────────
        user_doc = UserDocument(
            user_id=current_user.id,
            filename=file.filename,
            original_filename=file.filename,
            file_path=os.path.relpath(file_path),
            file_size=file_size,
            file_type=file.filename.split('.')[-1] if '.' in file.filename else "unknown",
            document_type=document_type,
            description=None,
            extracted_fields=extraction_result,
            is_relevant_for_regime=is_relevant,
            is_relevant_for_forex=is_relevant_forex,
            is_relevant_for_fund=is_relevant_fund
        )
        db.add(user_doc)
        db.commit()
        db.refresh(user_doc)

        # ── Step 3: Ingest into ChromaDB ─────────────────────────────
        from agents.document_agent import extract_text_from_file
        full_text = extract_text_from_file(file_path)
        
        ingest_result = ingest_user_document(
            file_path=file_path,
            filename=file.filename,
            user_id=str(current_user.id),
            document_id=str(user_doc.id),
            document_type=document_type,
            extracted_text=full_text,
        )
        
        # Update chunks_added in DB
        chunks = ingest_result.get("chunks_added", 0)
        user_doc.chunks_added = chunks
        db.commit()

        # ── Step 4: UI Actions ─────────────────────────────────────────
        suggested_action = {
            "type": "chat",
            "label": "Ask AI about this document",
            "tooltip": "This document has been added to your knowledge base. Ask the chatbot questions about it."
        }
        
        if document_type in ["salary_slip", "form_16", "itr_document"]:
            suggested_action = {
                "type": "regime_calculator",
                "label": "Open in Regime Calculator",
                "tooltip": "Gross income, HRA, and 80C deductions will be pre-filled from your document"
            }
        elif document_type == "forex_document":
            suggested_action = {
                "type": "forex",
                "label": "Open in Forex Valuation",
                "tooltip": "Currency pair, amount, and exchange rate will be pre-filled"
            }
        elif document_type == "fund_document":
            suggested_action = {
                "type": "fund_accounting",
                "label": "Open in Fund Accounting",
                "tooltip": "Fund details and NAV will be pre-filled"
            }
            
        # ── Step 5: Advisory (optional, best-effort) ──────────────────
        if is_relevant:
            try:
                advisory_agent = AdvisoryAgent()
                advisory_agent.handle(
                    query="Analyze the attached document and provide tax advice.",
                    context_data=extraction_result,
                )
            except Exception as e:
                print(f"Advisory generation failed (non-fatal): {e}")

        # ── Final standardized JSON output ─────────────────────────────
        from fastapi.responses import JSONResponse

        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Document uploaded and processed successfully.",
                "document": {
                    "id": str(user_doc.id),
                    "original_filename": user_doc.original_filename,
                    "file_path": user_doc.file_path,
                    "file_size": user_doc.file_size,
                    "description": user_doc.description,
                    "uploaded_at": user_doc.uploaded_at.isoformat() if user_doc.uploaded_at else None,
                },
                "ingest_result": {
                    "success": ingest_result.get("error") is None,
                    "chunks_added": chunks,
                    "error": ingest_result.get("error"),
                },
                "extracted_data": {
                    **extraction_result,
                    "document_type": document_type,
                    "is_relevant_for_regime": is_relevant,
                    "is_relevant_for_forex": is_relevant_forex,
                    "is_relevant_for_fund": is_relevant_fund,
                    "confidence": float(confidence),
                    "detected_by": detected_by,
                    "llm_enhancement": llm_enhancement,
                },
                "document_type": document_type,
                "extracted_text": extracted_text_preview,
                "chunks_added": chunks,
                "error": None,
            },
        )
        
    except HTTPException:
        raise  # let FastAPI handle auth/custom errors normally
        
    except Exception as e:
        # ── Guaranteed JSON error response (with standardized schema) ──
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "message": "Document processing failed.",
                "extracted_text": None,
                "chunks_added": 0,
                "error": str(e),
                "document": None,
                "ingest_result": {
                    "success": False,
                    "chunks_added": 0,
                    "error": str(e),
                },
                "extracted_data": {
                    "document_type": "unknown",
                    "is_relevant_for_regime": False,
                    "is_relevant_for_forex": False,
                    "is_relevant_for_fund": False,
                },
            },
        )


@router.get("/list")
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all documents uploaded by the current user"""
    docs = db.query(UserDocument)\
             .filter(UserDocument.user_id == current_user.id)\
             .order_by(UserDocument.uploaded_at.desc())\
             .all()
    
    return {
        "documents": [
            {
                "id": str(d.id),
                "filename": d.original_filename or d.filename,
                "file_size_bytes": d.file_size or 0,
                "file_type": d.file_type,
                "document_type": d.document_type,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
                "is_relevant_for_regime": d.is_relevant_for_regime,
                "is_relevant_for_forex": d.is_relevant_for_forex,
                "extracted_fields": d.extracted_fields or {}
            }
            for d in docs
        ],
        "total": len(docs)
    }


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document belonging to the current user"""
    # Find document
    document = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Document not found or access denied"
        )
    
    # Remove file from disk (best effort — don't fail if file missing)
    if os.path.exists(document.file_path):
        try:
            os.remove(document.file_path)
        except Exception:
            pass  # Continue with DB deletion even if file removal fails
    
    # Remove from database
    db.delete(document)
    db.commit()
    
    return {"success": True, "message": "File deleted"}


@router.get("/download/{document_id}")
def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Download a document belonging to the current user"""
    # Find document
    document = db.query(UserDocument).filter(
        UserDocument.id == document_id,
        UserDocument.user_id == current_user.id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Document not found or access denied"
        )
    
    # Check if file exists
    if not os.path.exists(document.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found on disk"
        )
    
    # Return file as FileResponse
    return FileResponse(
        path=document.file_path,
        filename=document.original_filename,
        media_type="application/octet-stream"
    )
