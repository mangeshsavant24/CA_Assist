from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from sqlalchemy.orm import Session
from api.schemas import CitedResponse
from api.dependencies import get_current_user
from api.document_schemas import DocumentUploadResponse, UserDocumentResponse
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
        
        # Process document for advisory (existing logic)
        try:
            doc_agent = DocumentAgent()
            extracted_data = doc_agent.handle(file_path)
            
            advisory_agent = AdvisoryAgent()
            advisory = advisory_agent.handle(
                query="Analyze the attached document and provide tax advice.",
                context_data=extracted_data
            )
        except Exception as e:
            # Document processing is optional, don't fail the upload
            extracted_data = None
            advisory = None
        
        return DocumentUploadResponse(
            document=user_doc,
            ingest_result=ingest_result
        )
        
    except Exception as e:
        # Clean up file if something goes wrong
        if os.path.exists(file_path):
            os.remove(file_path)
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Remove file from disk
    if os.path.exists(document.file_path):
        os.remove(document.file_path)
    
    # Remove from database
    db.delete(document)
    db.commit()
    
    return {"message": "Document deleted successfully", "document_id": document_id}
