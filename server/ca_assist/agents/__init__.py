import os

try:
    from langchain_openai import ChatOpenAI
except ImportError:
    try:
        from langchain_community.chat_models import ChatOpenAI
    except ImportError:
        ChatOpenAI = None

try:
    from langchain_ollama import ChatOllama
except ImportError:
    try:
        from langchain_community.chat_models import ChatOllama
    except ImportError:
        ChatOllama = None

from dotenv import load_dotenv

load_dotenv()

def get_llm():
    provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    if provider == "openai":
        return ChatOpenAI(model="gpt-4o", temperature=0)
    else:
        base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        model = os.getenv("OLLAMA_MODEL", "mistral")
        return ChatOllama(model=model, base_url=base_url, temperature=0.1)
