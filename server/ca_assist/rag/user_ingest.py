from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from rag.embedder import get_embedder
from langchain_core.documents import Document
from typing import Optional, List, Dict, Any
import os
import pytesseract
from PIL import Image


def _extract_text_from_image(file_path: str) -> str:
    """
    Extract text from image using pytesseract OCR.
    """
    try:
        image = Image.open(file_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        print(f"Error extracting text from image {file_path}: {e}")
        return ""


def ingest_user_document(
    file_path: str,
    user_id: str,
    filename: str
) -> Dict[str, Any]:
    """
    Ingest a user's uploaded document into ChromaDB with user_id metadata.
    Handles both PDF files and images (JPG, PNG).
    
    Args:
        file_path: Path to the document file (PDF, JPG, PNG)
        user_id: UUID of the user who uploaded the document
        filename: Original filename of the document
        
    Returns:
        dict: {"success": bool, "chunks_added": int, "error": Optional[str]}
    """
    try:
        documents = []
        ext = file_path.lower().split('.')[-1]
        
        # Handle PDF files
        if ext == 'pdf':
            loader = PyPDFLoader(file_path)
            documents = loader.load()
        
        # Handle image files
        elif ext in ['jpg', 'jpeg', 'png']:
            text = _extract_text_from_image(file_path)
            if text:
                documents = [Document(page_content=text, metadata={"source": filename})]
            else:
                return {
                    "success": False,
                    "chunks_added": 0,
                    "error": f"Could not extract text from image {filename}. Ensure tesseract is installed on your system."
                }
        else:
            return {
                "success": False,
                "chunks_added": 0,
                "error": f"Unsupported file format: {ext}. Only PDF, JPG, and PNG are supported."
            }
        
        if not documents:
            return {"success": False, "chunks_added": 0, "error": "No content extracted from file"}
        
        # Split into chunks
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100,
            separators=["\n\n", "\n", " ", ""]
        )
        
        chunks = text_splitter.split_documents(documents)
        
        # Add user_id and filename to metadata of each chunk
        for chunk in chunks:
            chunk.metadata["user_id"] = user_id
            chunk.metadata["original_filename"] = filename
            chunk.metadata["document_type"] = "user_upload"
        
        # Store in ChromaDB
        embeddings = get_embedder()
        vector_store = Chroma(
            collection_name="documents",
            embedding_function=embeddings,
            persist_directory="./chroma_db"
        )
        
        # Add documents to vector store
        vector_store.add_documents(chunks)
        
        return {
            "success": True,
            "chunks_added": len(chunks),
            "error": None
        }
        
    except Exception as e:
        return {
            "success": False,
            "chunks_added": 0,
            "error": str(e)
        }


def get_user_documents(user_id: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve documents for a specific user from ChromaDB.
    
    Args:
        user_id: UUID of the user
        k: Maximum number of documents to retrieve
        
    Returns:
        list: Documents with user_id metadata matching
    """
    try:
        embeddings = get_embedder()
        vector_store = Chroma(
            collection_name="documents",
            embedding_function=embeddings,
            persist_directory="./chroma_db"
        )
        
        # Query with metadata filter for user_id
        # This retrieves documents where user_id metadata matches
        results = vector_store._collection.get(
            where={"user_id": user_id},
            limit=k
        )
        
        return results or []
        
    except Exception as e:
        print(f"Error retrieving user documents: {e}")
        return []
