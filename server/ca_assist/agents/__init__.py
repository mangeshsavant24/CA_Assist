import os
import warnings
import requests
from typing import Optional

try:
    from langchain_ollama import ChatOllama
except ImportError:
    try:
        from langchain_community.chat_models import ChatOllama
    except ImportError:
        ChatOllama = None

try:
    from langchain_openai import ChatOpenAI
except ImportError:
    ChatOpenAI = None

from dotenv import load_dotenv

load_dotenv()

def get_llm():
    """
    Get LLM instance with fallback providers.
    Priority: Specified provider → Ollama → OpenAI → Error
    
    Environment variables:
    - LLM_PROVIDER: 'ollama' or 'openai' (default: 'ollama')
    - OLLAMA_BASE_URL: Ollama server URL (default: http://localhost:11434)
    - OLLAMA_MODEL: Model name to use (default: 'llama2')  
    - OPENAI_API_KEY: OpenAI API key
    - OPENAI_MODEL: OpenAI model (default: 'gpt-3.5-turbo')
    - LLM_TEMPERATURE: Model temperature (default: 0.1)
    """
    provider = os.getenv("LLM_PROVIDER", "ollama").lower()
    temperature = float(os.getenv("LLM_TEMPERATURE", "0.1"))
    
    # Try primary provider first
    if provider == "openai":
        try:
            return _get_openai_llm(temperature)
        except Exception as e:
            warnings.warn(f"OpenAI provider failed: {e}. Falling back to Ollama.")
            try:
                return _get_ollama_llm(temperature)
            except Exception as ollama_error:
                raise RuntimeError(
                    f"All LLM providers failed. OpenAI: {e}, Ollama: {ollama_error}"
                ) from ollama_error
    else:  # Default to ollama
        try:
            return _get_ollama_llm(temperature)
        except Exception as e:
            warnings.warn(f"Ollama provider failed: {e}. Falling back to OpenAI.")
            try:
                return _get_openai_llm(temperature)
            except Exception as openai_error:
                raise RuntimeError(
                    f"All LLM providers failed. Ollama: {e}, OpenAI: {openai_error}"
                ) from openai_error


def _get_ollama_llm(temperature: float):
    """Initialize Ollama LLM provider."""
    if ChatOllama is None:
        raise ImportError("langchain-ollama is not installed")
    
    base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    model = os.getenv("OLLAMA_MODEL", "llama2")
    
    # Validate connection and model availability
    import requests
    try:
        response = requests.get(f"{base_url}/api/tags", timeout=5)
        if response.status_code != 200:
            raise RuntimeError(f"Ollama server returned status {response.status_code}")
        
        available_models = [m["name"].split(":")[0] for m in response.json().get("models", [])]
        if not available_models:
            raise RuntimeError("No models available in Ollama. Install a model with: ollama pull llama2")
        
        if model not in available_models:
            warnings.warn(
                f"Model '{model}' not found in Ollama. Available: {available_models}. "
                f"Using first available model: {available_models[0]}. "
                f"To use '{model}', run: ollama pull {model}"
            )
            model = available_models[0]
    except requests.exceptions.ConnectionError:
        raise RuntimeError(
            f"Cannot connect to Ollama at {base_url}. "
            "Is it running? Start with: ollama serve"
        )
    except Exception as e:
        warnings.warn(f"Could not validate Ollama models: {e}. Proceeding anyway...")
    
    print(f"Using Ollama LLM: {model} at {base_url}")
    return ChatOllama(model=model, base_url=base_url, temperature=temperature)


def _get_openai_llm(temperature: float):
    """Initialize OpenAI LLM provider."""
    if ChatOpenAI is None:
        raise ImportError("langchain-openai is not installed")
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "sk-yourapikey":
        raise ValueError(
            "OPENAI_API_KEY not configured. Set valid key in .env file."
        )
    
    model = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")
    print(f"Using OpenAI LLM: {model}")
    return ChatOpenAI(model=model, api_key=api_key, temperature=temperature)


def get_available_providers() -> dict:
    """Check which LLM providers are available."""
    providers = {}
    
    # Check Ollama
    if ChatOllama:
        try:
            base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
            import requests
            response = requests.get(f"{base_url}/api/tags", timeout=2)
            if response.status_code == 200:
                models = [m["name"] for m in response.json().get("models", [])]
                providers["ollama"] = {"available": True, "models": models}
            else:
                providers["ollama"] = {"available": False, "error": "Server error"}
        except Exception as e:
            providers["ollama"] = {"available": False, "error": str(e)}
    
    # Check OpenAI
    if ChatOpenAI:
        api_key = os.getenv("OPENAI_API_KEY")
        providers["openai"] = {
            "available": bool(api_key and api_key != "sk-yourapikey"),
            "error": "API key not configured" if not api_key else None
        }
    
    return providers
