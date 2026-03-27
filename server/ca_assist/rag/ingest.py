import os
import re
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from rag.embedder import get_embedder

def ingest_documents(kb_dir: str = "./knowledge_base/", persist_dir: str = "./chroma_db/"):
    if not os.path.exists(kb_dir):
        os.makedirs(kb_dir)
        with open(os.path.join(kb_dir, "README.md"), "w") as f:
            f.write("# Knowledge Base\nDrop PDF files here to be ingested by the RAG system.")
        print(f"Created knowledge base directory at {kb_dir}. Please drop PDFs there.")
        return
        
    loader = PyPDFDirectoryLoader(kb_dir)
    docs = loader.load()
    
    if not docs:
        print("No PDFs found in knowledge_base/")
        return
        
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    
    unique_sections = set()
    unique_sources = set()
    
    # Metadata extraction
    for chunk in chunks:
        text = chunk.page_content
        source_file = chunk.metadata.get("source", "unknown")
        unique_sources.add(source_file)
        
        # Detect section boundaries
        sec_match = re.search(r"Section\s+(\d+[A-Z]?)", text, re.IGNORECASE)
        circ_match = re.search(r"Circular\s+No\.\s*(\d+)", text, re.IGNORECASE)
        
        chunk_type = "standard"
        if sec_match:
            sec_val = sec_match.group(1)
            chunk.metadata["section"] = sec_val
            chunk.metadata["act"] = "Income Tax Act" # Default
            chunk_type = "section"
            unique_sections.add(sec_val)
        elif circ_match:
            circ_val = circ_match.group(1)
            chunk.metadata["circular_id"] = circ_val
            chunk_type = "circular"
            unique_sections.add(f"Circular {circ_val}")
            
        chunk.metadata["chunk_type"] = chunk_type
        # Add year default
        chunk.metadata["year"] = 2024
        
    embedder = get_embedder()
    vectorstore = Chroma.from_documents(documents=chunks, embedding=embedder, persist_directory=persist_dir)
    vectorstore.persist()
    
    print("Ingestion Summary:")
    print(f"- Total chunks: {len(chunks)}")
    print(f"- Unique sections: {len(unique_sections)}")
    print(f"- Unique sources: {len(unique_sources)}")

if __name__ == "__main__":
    ingest_documents()
