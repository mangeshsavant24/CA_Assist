from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from api.routes import query, document, regime, capital_budget, fund, auth, forex
from database import init_db

# Load environment variables first, before anything else
load_dotenv()

app = FastAPI(title="CA-Assist API", version="1.0.0")

# Initialize database on startup
@app.on_event("startup")
def startup_event():
    init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes (public)
app.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Protected routes
app.include_router(query.router, prefix="/query", tags=["Query"])
app.include_router(document.router, prefix="/document", tags=["Document"])
app.include_router(regime.router, prefix="/regime", tags=["Regime Compare"])
app.include_router(capital_budget.router, prefix="/capital-budget", tags=["Capital Budget"])
app.include_router(fund.router, prefix="/fund", tags=["Fund Accounting"])
app.include_router(forex.router, prefix="/forex", tags=["Forex Valuation"])

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
