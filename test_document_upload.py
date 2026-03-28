#!/usr/bin/env python3
"""
Quick test to verify document upload endpoint returns valid JSON.
Usage:
  1. Start backend: uvicorn ca_assist.api.main:app --reload
  2. Create a test user and get token
  3. Run: python test_document_upload.py <token> <image_path>
"""
import sys
import json
import requests
from pathlib import Path

API_URL = "http://127.0.0.1:8000"

def test_upload(token: str, file_path: str):
    """Test document upload with a real file."""
    file_path = Path(file_path)
    if not file_path.exists():
        print(f"❌ File not found: {file_path}")
        return False

    print(f"📄 Testing upload of: {file_path.name} ({file_path.stat().st_size / 1024:.1f} KB)")
    
    headers = {"Authorization": f"Bearer {token}"}
    with open(file_path, "rb") as fh:
        files = {"file": fh}
        try:
            resp = requests.post(
                f"{API_URL}/document/upload",
                headers=headers,
                files=files,
                timeout=30
            )
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return False

    print(f"\n📊 Status Code: {resp.status_code}")
    print(f"📊 Content-Type: {resp.headers.get('content-type')}")
    
    try:
        data = resp.json()
        print(f"\n✅ Response is valid JSON:")
        print(json.dumps(data, indent=2, default=str)[:1000])
        
        # Check required fields
        if resp.status_code == 200:
            if data.get("success") is True:
                print(f"✅ Response.success = true")
                if data.get("document"):
                    print(f"✅ 'document' object present")
                if data.get("extracted_data"):
                    print(f"✅ 'extracted_data' object present")
                if data.get("ingest_result"):
                    print(f"✅ 'ingest_result' object present")
            elif data.get("success") is False:
                print(f"⚠️  Response.success = false (document processing failed)")
                print(f"   Error: {data.get('error')}")
        else:
            print(f"⚠️  Status {resp.status_code}: {data.get('detail') or data.get('error')}")
        
        return True
    except Exception as e:
        print(f"❌ Response is NOT valid JSON!")
        print(f"   Error: {e}")
        print(f"   Response text: {resp.text[:200]}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_document_upload.py <token> <image_path>")
        print("Example: python test_document_upload.py 'eyJ...' '../test.jpg'")
        sys.exit(1)
    
    token = sys.argv[1]
    file_path = sys.argv[2]
    
    success = test_upload(token, file_path)
    sys.exit(0 if success else 1)
