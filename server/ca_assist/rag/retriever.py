from langchain_chroma import Chroma
from rag.embedder import get_embedder

def get_retriever(persist_dir: str = "./chroma_db/"):
    embedder = get_embedder()
    try:
        vectorstore = Chroma(persist_directory=persist_dir, embedding_function=embedder)
        return vectorstore.as_retriever(search_kwargs={"k": 5})
    except Exception as e:
        print(f"Failed to load Chroma DB: {e}")
        return None

def fetch_relevant_docs(query: str, filter_kwargs: dict = None):
    retriever = get_retriever()
    if not retriever:
        return []
        
    if filter_kwargs:
        retriever.search_kwargs["filter"] = filter_kwargs
        
    return retriever.invoke(query)
