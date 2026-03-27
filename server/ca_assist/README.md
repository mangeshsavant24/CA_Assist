# CA-Assist

AI-powered virtual CA assistant.

## Features
- Old vs New Regime tax calculation (deterministic)
- Intelligent Document Processing (Form 16/Invoices)
- RAG using local embeddings and ChromaDB

## Setup Steps

1. Clone repo, create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment:
   Copy `.env.example` to `.env` and configure accordingly (`LLM_PROVIDER=ollama` or `openai`).

## Using RAG

1. Create a directory `knowledge_base/` and add PDF documents (e.g. IT Act, CBIC Circulars).
2. Run ingestion:
   ```bash
   python -m rag.ingest
   ```

## Running the API

Start FastAPI:
```bash
uvicorn api.main:app --reload
```
View docs at `http://127.0.0.1:8000/docs`.

## Testing

Run tests with `pytest`:
```bash
pytest
```
