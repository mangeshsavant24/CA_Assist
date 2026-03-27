from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse
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


@router.post("/upload", response_model=DocumentUploadResponse)
def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a document for the current user.
    File is stored in user-specific folder and indexed in ChromaDB with user_id metadata.
    Extracts financial data and determines relevance for regime calculations.
    """
    # Create user-specific folder
    user_folder = os.path.join(USER_DOCUMENTS_BASE, str(current_user.id))
    os.makedirs(user_folder, exist_ok=True)
    
    # Save file to user folder
    file_path = os.path.join(user_folder, file.filename)
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Ingest into ChromaDB with user_id metadata
        ingest_result = ingest_user_document(
            file_path=file_path,
            user_id=str(current_user.id),
            filename=file.filename
        )
        
        # Create database record
        user_doc = UserDocument(
            user_id=current_user.id,
            original_filename=file.filename,
            file_path=os.path.relpath(file_path),
            file_size=file_size,
            description=None  # Can be added via optional form field if needed
        )
        
        db.add(user_doc)
        db.commit()
        db.refresh(user_doc)
        
        # Extract financial data and classify document
        extracted_data = None
        document_type = None
        extraction_error = None
        
        try:
            doc_agent = DocumentAgent()
            extraction_result = doc_agent.handle(file_path)
            
            # Extract metadata
            document_type = extraction_result.get("document_type", "unknown")
            is_relevant = extraction_result.get("is_relevant_for_regime", False)
            relevance_reason = extraction_result.get("relevance_reason")
            
            # Create response object with all extracted fields
            extracted_data = ExtractedDataResponse(
                gross_salary=extraction_result.get("gross_salary"),
                tds_deducted=extraction_result.get("tds_deducted"),
                pf=extraction_result.get("pf"),
                pan=extraction_result.get("pan"),
                gstin=extraction_result.get("gstin"),
                document_type=document_type,
                is_relevant_for_regime=is_relevant,
                relevance_reason=relevance_reason
            )
            
            # Get advisory only for relevant documents
            if is_relevant:
                try:
                    advisory_agent = AdvisoryAgent()
                    advisory = advisory_agent.handle(
                        query="Analyze the attached document and provide tax advice.",
                        context_data=extraction_result
                    )
                except Exception as e:
                    # Advisory is optional, don't fail the upload
                    print(f"Advisory generation failed: {e}")
                    
        except Exception as e:
            # Document processing is optional, don't fail the upload
            extraction_error = f"Extraction failed: {str(e)}"
            print(f"Document extraction error: {e}")
            # Still return partial response
            extracted_data = ExtractedDataResponse(
                document_type="unknown",
                is_relevant_for_regime=False,
                relevance_reason=extraction_error
            )
        
        return DocumentUploadResponse(
            document=user_doc,
            ingest_result=ingest_result,
            extracted_data=extracted_data,
            document_type=document_type,
            error=extraction_error
        )
        
    except Exception as e:
        # Clean up file if something goes wrong
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/list", response_model=list[UserDocumentResponse])
def list_user_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all documents uploaded by the current user"""
    documents = db.query(UserDocument).filter(
        UserDocument.user_id == current_user.id
    ).order_by(UserDocument.uploaded_at.desc()).all()
    
    return documents


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
