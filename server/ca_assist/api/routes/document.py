from fastapi import APIRouter, UploadFile, File
from api.schemas import CitedResponse
from agents.advisory_agent import AdvisoryAgent
from agents.document_agent import DocumentAgent
import os
import shutil

router = APIRouter()

@router.post("/upload")
def upload_document(file: UploadFile = File(...)):
    temp_dir = "./temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        doc_agent = DocumentAgent()
        extracted_data = doc_agent.handle(temp_path)
        
        advisory_agent = AdvisoryAgent()
        advisory = advisory_agent.handle(
            query="Analyze the attached document and provide tax advice.", 
            context_data=extracted_data
        )
        
        return {
            "extracted_data": extracted_data,
            "advisory": advisory
        }
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)
