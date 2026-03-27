from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import query, document, regime

app = FastAPI(title="CA-Assist API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(query.router, prefix="/query", tags=["Query"])
app.include_router(document.router, prefix="/document", tags=["Document"])
app.include_router(regime.router, prefix="/regime", tags=["Regime Compare"])

@app.get("/health")
def health_check():
    try:
        from rag.retriever import get_retriever
        retriever = get_retriever()
        count = retriever.vectorstore._collection.count() if retriever else 0
    except Exception:
        count = 0
        
    return {
        "status": "ok",
        "rag_chunks": count,
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
