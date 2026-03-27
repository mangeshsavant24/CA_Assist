# Document Flow & Data Management Analysis

## Executive Summary

The CA-Assist system currently has a **RAG (Retrieval-Augmented Generation) pipeline** for knowledge base document processing and a **temporary file upload handler** for user documents. However, there is **NO persistent document tracking system** - documents are processed but not stored in a relational database with metadata.

---

## 1. DOCUMENT INGESTION PROCESS (rag/ingest.py)

### Current Flow:
```
PDF Files in /knowledge_base/
    ↓
PyPDFDirectoryLoader (LangChain)
    ↓
RecursiveCharacterTextSplitter
    ↓
Metadata Extraction & Enrichment
    ↓
HuggingFace Embeddings
    ↓
Chroma VectorDB
```

### Implementation Details:

#### Source Loading (`PyPDFDirectoryLoader`)
- Loads all PDFs from `./knowledge_base/` directory
- Returns LangChain Document objects with:
  - `page_content`: Text from each page
  - `metadata.source`: File path
  
#### Chunking Strategy (`RecursiveCharacterTextSplitter`)
```python
chunk_size=800        # Characters per chunk
chunk_overlap=100     # Overlap between chunks (12.5% overlap)
```
- Splits documents recursively by: paragraph → sentence → character
- Maintains context continuity across chunks

#### Metadata Enrichment
Each chunk receives metadata:
```python
{
    "source": "path/to/file.pdf",
    "page": <page_number>,
    "section": "Section 123", # If detected via regex
    "circular_id": "45",      # If detected via regex
    "act": "Income Tax Act",  # Default value
    "chunk_type": "section|circular|standard",
    "year": 2024              # Default year
}
```

**Section Detection Patterns:**
- Regex: `Section\s+(\d+[A-Z]?)` (e.g., "Section 89A")
- Regex: `Circular\s+No\.\s*(\d+)` (e.g., "Circular No. 12")

#### Storage in ChromaDB
```python
Chroma.from_documents(
    documents=chunks,
    embedding=embedder,
    persist_directory="./chroma_db/"
)
vectorstore.persist()
```

**ChromaDB Structure:**
- Location: `./chroma_db/`
- SQLite backing: `./chroma_db/chroma.sqlite3`
- Collections: Auto-created with embedding vectors
- No explicit collection names - uses default

#### Output:
```
Summary printed:
- Total chunks: <count>
- Unique sections: <count>
- Unique sources: <count>
```

---

## 2. DOCUMENT RETRIEVAL PROCESS (rag/retriever.py)

### Retrieval Flow:
```
User Query
    ↓
HuggingFace Embeddings (same model as ingestion)
    ↓
ChromaDB Vector Search (cosine similarity)
    ↓
Top 5 Results (k=5)
    ↓
Returned as LangChain Documents with Metadata
```

### Implementation:

#### Vectorstore Initialization
```python
def get_retriever(persist_dir: str = "./chroma_db/"):
    embedder = get_embedder()
    vectorstore = Chroma(
        persist_directory=persist_dir,
        embedding_function=embedder
    )
    return vectorstore.as_retriever(search_kwargs={"k": 5})
```

#### Query Execution
```python
def fetch_relevant_docs(query: str, filter_kwargs: dict = None):
    retriever.invoke(query)  # Returns Document list
```

**Retrieval Parameters:**
- `k=5`: Returns top 5 most similar chunks
- `filter_kwargs`: Optional metadata filtering (currently not used)
- Search type: Semantic similarity (cosine distance on embeddings)

#### Limitations:
- No filtering by metadata (could be enhanced for section/year/file filtering)
- Always returns 5 results (not configurable per query)
- No relevance score thresholding
- No query expansion or reranking

---

## 3. EMBEDDINGS CONFIGURATION (rag/embedder.py)

### Model Configuration:
```python
HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)
```

### Model Specifications:
| Property | Value |
|----------|-------|
| Model | `sentence-transformers/all-MiniLM-L6-v2` |
| Embedding Dimension | 384 dimensions |
| Framework | SentenceTransformers (PyTorch-based) |
| Training Data | MS MARCO, STS datasets |
| Performance | Fast, lightweight (22M parameters) |
| Use Case | Semantic text matching, retrieval |

### Characteristics:
- **Fast**: ~0.1s for single query encoding
- **Lightweight**: No GPU required (but supports CUDA)
- **Good for Retrieval**: Trained on search/ranking tasks
- **Multilingual**: Not specifically, but works reasonably with non-English
- **Reusable**: Same embeddings model used for both ingestion and retrieval

---

## 4. DOCUMENT UPLOAD ENDPOINT (api/routes/document.py)

### Current Implementation:
```
POST /document/upload (file.pdf)
         ↓
Save to ./temp_uploads/<filename>
         ↓
DocumentAgent.handle(file_path)
    ├─ PDF: Extract text with PyPDF2
    └─ Image: OCR with pytesseract
         ↓
LLM Parsing (Extract structured fields)
         ↓
AdvisoryAgent.handle(extracted_data)
         ↓
Return Result + Delete Temp File
```

### Endpoint Details:

#### Input:
- `POST /document/upload`
- Multipart form-data: single file upload
- Supported: PDF, JPG, JPEG, PNG

#### Processing:

**Step 1: Temporary Storage**
```python
temp_dir = "./temp_uploads"
temp_path = os.path.join(temp_dir, file.filename)
shutil.copyfileobj(file.file, buffer)
```

**Step 2: DocumentAgent Extraction**
Uses `PyPDF2` or `pytesseract` to extract text:
```python
if ext == 'pdf':
    reader = PyPDF2.PdfReader(f)
    for page in reader.pages:
        text += page.extract_text()
elif ext in ['jpg', 'jpeg', 'png']:
    img = Image.open(file_path)
    text = pytesseract.image_to_string(img)
```

**Step 3: LLM-based Field Extraction**
```python
system_prompt = """Extract: gross_salary, tds_deducted, pf, pan, gstin
Return ONLY JSON with these keys, numbers as floats, null if missing"""

messages = [
    SystemMessage(content=system_prompt),
    HumanMessage(content=text)
]
parsed = llm.invoke(messages)  # LLM extraction
```

**Extracted Fields:**
```json
{
    "gross_salary": <float>,
    "tds_deducted": <float>,
    "pf": <float>,
    "pan": <string>,
    "gstin": <string>
}
```

**Step 4: Advisory Generation**
```python
advisory_agent = AdvisoryAgent()
advisory = advisory_agent.handle(
    query="Analyze the attached document and provide tax advice.",
    context_data=extracted_data
)
```

#### Output:
```json
{
    "extracted_data": { ... },
    "advisory": "..."
}
```

#### Cleanup:
```python
if os.path.exists(temp_path):
    os.remove(temp_path)  # Delete after processing
```

### Critical Limitations:
1. **No persistence**: File deleted after processing
2. **No tracking**: No record of uploads, extractions, or decisions
3. **No versioning**: If extraction fails, no history to retry
4. **No LLM interaction history**: Advisory not tied to extracted data
5. **No user association**: No way to track which user uploaded what

---

## 5. DATABASE & PERSISTENCE PATTERNS

### Current Storage Locations:

#### A. ChromaDB (Vector Store)
```
./chroma_db/
├── chroma.sqlite3          # Underlying SQLite with embeddings
└── <collection_id>/        # Collection data
    └── [metadata, vectors, documents]
```

**Data Stored:**
- Document chunks (text)
- Embedding vectors (384-dim)
- Metadata (source, section, act, year, etc.)
- Collection state

**Query Method:** Vector similarity search
**Persistence:** Permanent (survives application restart)

#### B. Knowledge Base (File System)
```
./knowledge_base/
├── README.md              # Auto-generated if missing
└── *.pdf                  # User-provided PDFs
```

**Data Stored:** Raw PDF files
**Management:** Manual (users drop files here)
**Persistence:** File-based

#### C. Temp Uploads (File System)
```
./temp_uploads/
└── <filename>             # Temporary during processing
```

**Data Stored:** Uploaded user documents
**Lifetime:** Only while processing (auto-deleted)
**Persistence:** NONE (temporary)

### Missing: Relational Database
Currently uses only:
- ✅ ChromaDB (vector/document storage)
- ✅ File system (knowledge base PDFs)
- ❌ SQLite for user data (NO SQLAlchemy/ORM models for documents)
- ❌ Tracking of uploads, extractions, or decisions

**Note:** The auth system memory suggests SQLAlchemy + SQLite models should be added, but these haven't been implemented yet.

---

## 6. DATA FLOW SUMMARY

### Knowledge Base Ingestion (Batch):
```
PDF Files
  → PyPDFDirectoryLoader
  → RecursiveCharacterTextSplitter (chunk_size=800, overlap=100)
  → Metadata Extraction (regex-based section/circular detection)
  → HuggingFace Embeddings (sentence-transformers/all-MiniLM-L6-v2)
  → ChromaDB (./chroma_db/, SQLite-backed)
  → Persistent Vector Store
```

### User Document Upload (On-demand):
```
User File Upload
  → Temp Storage (./temp_uploads/)
  → DocumentAgent (PyPDF2/OCR extraction)
  → LLM Parsing (structured field extraction)
  → AdvisoryAgent (tax advice generation)
  → Response to Client
  → Delete Temp File
```

### Query Resolution:
```
User Query
  → HuggingFace Embeddings (same model as ingestion)
  → ChromaDB Vector Search (top 5, no filtering)
  → Retrieved Chunks with Metadata
  → To Agent/LLM Pipeline
  → Cited Response to Client
```

---

## 7. MISSING DOCUMENT TRACKING SYSTEM

### What's Missing:
1. **Document Metadata Store**
   - No database table for uploaded documents
   - No tracking of file names, upload times, file sizes
   - No association with user accounts

2. **Processing History**
   - No record of extractions or results
   - Can't retrieve past analyses
   - No versioning of extracted data

3. **Audit Trail**
   - No logging of who uploaded what
   - No timestamp of processing
   - No record of advisory decisions

4. **Search/Discovery**
   - Can't list user's uploaded documents
   - Can't filter by upload date, type, or status
   - Can't search historical extractions

### Recommended Database Schema (Not Yet Implemented):
```python
class UploadedDocument(Base):
    __tablename__ = "uploaded_documents"
    
    id: UUID
    user_id: UUID (FK to User)
    original_filename: str
    file_size: int
    file_type: str  # 'pdf' | 'jpg' | 'png'
    uploaded_at: DateTime
    processed_at: DateTime
    extraction_status: str  # 'processing' | 'completed' | 'failed'
    extracted_data: JSON  # {gross_salary, tds_deducted, pf, pan, gstin}
    advisory: str
    error_message: Optional[str]
    chroma_document_ids: List[str]  # Links to ChromaDB chunks if added

class ExtractionHistory(Base):
    __tablename__ = "extraction_history"
    
    id: UUID
    document_id: UUID (FK)
    extracted_fields: JSON
    confidence_scores: JSON
    created_at: DateTime
```

---

## 8. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                    DOCUMENT MANAGEMENT                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  BATCH INGESTION                USER UPLOADS                 │
│  ═════════════════              ═════════════               │
│                                                              │
│  PDF Files                       POST /document/upload      │
│    │                               │                        │
│    ├─ PyPDFDirectoryLoader         ├─ Temp Storage         │
│    │   (Load all PDFs)             │   (./temp_uploads)     │
│    │                               │                        │
│    ├─ Chunking                     ├─ DocumentAgent        │
│    │   (800 chars, 100 overlap)    │   (PDF/OCR extract)   │
│    │                               │                        │
│    ├─ Metadata Extraction          ├─ LLM Parsing          │
│    │   (Section, Circular)         │   (JSON extraction)   │
│    │                               │                        │
│    ├─ Embeddings                   ├─ AdvisoryAgent        │
│    │   (all-MiniLM-L6-v2)         │   (Tax advice)         │
│    │                               │                        │
│    └─ ChromaDB Storage             └─ Delete + Return      │
│        (./chroma_db/)                  (No persistence)     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                    QUERY RESOLUTION                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User Query                                                  │
│    │                                                        │
│    ├─ Embeddings (all-MiniLM-L6-v2)                        │
│    │                                                        │
│    ├─ ChromaDB Vector Search                               │
│    │   (Top 5, no filtering)                               │
│    │                                                        │
│    ├─ Retrieved Chunks + Metadata                          │
│    │   {text, source, section, act, year, ...}            │
│    │                                                        │
│    └─ Agent Pipeline (with citations)                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. KEY FINDINGS

### Strengths ✅
1. **Solid RAG Pipeline**: Proper chunking, embedding, and retrieval
2. **Metadata Enrichment**: Extracts sections and circulars automatically
3. **Multi-format Support**: Handles PDFs and images (OCR)
4. **LLM Integration**: Uses LLM for field extraction and advice generation
5. **Lightweight Embeddings**: all-MiniLM-L6-v2 is fast and effective
6. **Persistent Knowledge Base**: ChromaDB persists across restarts

### Weaknesses ❌
1. **No Document Persistence**: Uploaded files deleted immediately
2. **No User Association**: No tracking of who uploaded what
3. **No History**: Can't retrieve past analyses or extractions
4. **No Filtering**: ChromaDB retrieval doesn't use metadata filters
5. **No Versioning**: If extraction fails, can't retry
6. **Hardcoded Parameters**: Chunk size, k=5, year=2024 all hardcoded
7. **No Audit Trail**: No logging of decisions or changes
8. **LLM Parsing Fragile**: JSON extraction with string parsing can fail

### Security Considerations ⚠️
1. **No Authentication**: Document routes not protected (yet)
2. **No File Validation**: Accepts any file in /knowledge_base/
3. **Temp Cleanup**: Relies on try/finally; could leave files if crashed
4. **No Rate Limiting**: Unlimited upload requests possible
5. **LLM Injection**: Direct text to LLM without sanitization

---

## 10. CONFIGURATION & PARAMETERS

| Component | Parameter | Current Value | Location |
|-----------|-----------|----------------|----------|
| **Chunking** | Chunk Size | 800 chars | ingest.py:L24 |
| **Chunking** | Overlap | 100 chars | ingest.py:L24 |
| **Retrieval** | Top K | 5 docs | retriever.py:L10 |
| **Embeddings** | Model | sentence-transformers/all-MiniLM-L6-v2 | embedder.py:L3 |
| **Storage** | KB Directory | ./knowledge_base/ | ingest.py:L7 |
| **Storage** | Chroma DB | ./chroma_db/ | ingest.py:L7, retriever.py:L7 |
| **Upload** | Temp Directory | ./temp_uploads/ | document.py:L9 |
| **Metadata** | Default Year | 2024 | ingest.py:L40 |
| **Metadata** | Default Act | Income Tax Act | ingest.py:L33 |

---

## 11. NEXT STEPS IMPLICATIONS

To build a complete document management system, you would need:

1. **Add Document Tracking Model** (SQLAlchemy)
   - Store upload metadata in relational DB
   - Track extraction results and status

2. **Enhance Upload Endpoint**
   - Require authentication
   - Store document record before processing
   - Update record with extraction results
   - Return document ID for future reference

3. **Add Document Retrieval Endpoints**
   - GET /document/list (user's documents)
   - GET /document/{id} (retrieve past analysis)
   - DELETE /document/{id} (manage documents)

4. **Improve RAG Retrieval**
   - Use metadata filters in ChromaDB
   - Add source/section filtering
   - Implement relevance score thresholding

5. **Add Audit Logging**
   - Log all uploads, extractions, decisions
   - Track AI model versions used
   - Enable compliance/debugging
