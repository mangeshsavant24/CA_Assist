#!/usr/bin/env python3
"""
Test script to verify the document extraction and LLM provider fixes.
Run this to validate the changes before starting the server.
"""

import sys
import os
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_imports():
    """Test that all required imports work."""
    print("=" * 60)
    print("Testing imports...")
    print("=" * 60)
    
    try:
        from agents import get_llm, get_available_providers
        print("✅ Agents module imported successfully")
    except Exception as e:
        print(f"❌ Failed to import agents: {e}")
        return False
    
    try:
        from agents.document_agent import DocumentAgent
        print("✅ DocumentAgent imported successfully")
    except Exception as e:
        print(f"❌ Failed to import DocumentAgent: {e}")
        return False
    
    try:
        from api.document_schemas import ExtractedDataResponse, DocumentUploadResponse
        print("✅ Document schemas imported successfully")
    except Exception as e:
        print(f"❌ Failed to import document schemas: {e}")
        return False
    
    return True

def test_lm_providers():
    """Test LLM provider detection."""
    print("\n" + "=" * 60)
    print("Testing LLM providers...")
    print("=" * 60)
    
    try:
        from agents import get_available_providers
        providers = get_available_providers()
        
        print(f"\nAvailable providers:")
        for provider, info in providers.items():
            status = "✅ Available" if info.get("available") else "❌ Not available"
            print(f"  {provider}: {status}")
            if "models" in info:
                print(f"    Models: {info['models']}")
            if "error" in info and info["error"]:
                print(f"    Error: {info['error']}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to check providers: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_document_agent_syntax():
    """Test that DocumentAgent can be instantiated."""
    print("\n" + "=" * 60)
    print("Testing DocumentAgent instantiation...")
    print("=" * 60)
    
    try:
        from agents.document_agent import DocumentAgent
        agent = DocumentAgent()
        print("✅ DocumentAgent instantiated successfully")
        
        # Test classification method signature
        doc_type, is_relevant = agent._classify_document_type("Sample payslip...")
        print(f"✅ Classification works: type={doc_type}, relevant={is_relevant}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to test DocumentAgent: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_schemas():
    """Test that schemas can be created."""
    print("\n" + "=" * 60)
    print("Testing API schemas...")
    print("=" * 60)
    
    try:
        from api.document_schemas import ExtractedDataResponse
        
        # Test creating a response with a relevant document
        extracted = ExtractedDataResponse(
            gross_salary=900000,
            tds_deducted=15000,
            pf=50000,
            pan="ABCDE1234F",
            gstin=None,
            document_type="salary_slip",
            is_relevant_for_regime=True,
            relevance_reason=None
        )
        print(f"✅ ExtractedDataResponse schema works")
        print(f"   Document type: {extracted.document_type}")
        print(f"   Relevant for regime: {extracted.is_relevant_for_regime}")
        
        # Test creating a response with an irrelevant document
        extracted2 = ExtractedDataResponse(
            document_type="invoice",
            is_relevant_for_regime=False,
            relevance_reason="This invoice is not applicable for regime calculations."
        )
        print(f"✅ ExtractedDataResponse schema works for irrelevant docs")
        print(f"   Document type: {extracted2.document_type}")
        print(f"   Relevant for regime: {extracted2.is_relevant_for_regime}")
        print(f"   Reason: {extracted2.relevance_reason}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to test schemas: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_env_config():
    """Test environment configuration."""
    print("\n" + "=" * 60)
    print("Testing environment configuration...")
    print("=" * 60)
    
    try:
        from dotenv import load_dotenv
        import os
        
        load_dotenv()
        
        llm_provider = os.getenv("LLM_PROVIDER", "ollama")
        ollama_model = os.getenv("OLLAMA_MODEL", "mistral")
        ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        
        print(f"✅ Environment loaded:")
        print(f"   LLM_PROVIDER: {llm_provider}")
        print(f"   OLLAMA_MODEL: {ollama_model}")
        print(f"   OLLAMA_BASE_URL: {ollama_url}")
        
        return True
    except Exception as e:
        print(f"❌ Failed to load environment: {e}")
        return False

def main():
    """Run all tests."""
    print("\n")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║  CA_Assist Document Extraction Fixes - Verification Test  ║")
    print("╚════════════════════════════════════════════════════════════╝")
    
    results = {
        "Imports": test_imports(),
        "Environment": test_env_config(),
        "LLM Providers": test_lm_providers(),
        "Schemas": test_schemas(),
        "DocumentAgent": test_document_agent_syntax(),
    }
    
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{test_name}: {status}")
    
    all_passed = all(results.values())
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ All tests passed! Ready to start server.")
        print("\nNext steps:")
        print("1. Ensure Ollama is running (ollama serve)")
        print("2. Verify your model is installed (ollama pull llama2)")
        print("3. Start the server: uvicorn api.main:app --reload")
        print("4. Test document upload via API or UI")
    else:
        print("❌ Some tests failed. Please check the errors above.")
        print("Fix the issues before starting the server.")
    print("=" * 60)
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
