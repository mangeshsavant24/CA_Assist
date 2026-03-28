#!/usr/bin/env python3
"""
Quick health check script to verify CA-Assist backend is running and responsive.
Run this before attempting uploads to confirm connectivity.
"""
import requests
import json
import sys

BACKEND_URL = "http://127.0.0.1:8000"

def check_health():
    """Check if backend is running and responding."""
    print(f"🔍 Checking backend health at {BACKEND_URL}...")
    try:
        resp = requests.get(f"{BACKEND_URL}/health", timeout=5)
        print(f"✅ Backend is running!")
        print(f"   Status: {resp.status_code}")
        print(f"   Response: {json.dumps(resp.json(), indent=2)}")
        return True
    except requests.ConnectionError:
        print(f"❌ Cannot connect to backend at {BACKEND_URL}")
        print(f"   Is uvicorn running? Start with:")
        print(f"   cd server/ca_assist")
        print(f"   uvicorn api.main:app --reload --host 127.0.0.1 --port 8000")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def check_json_response():
    """Verify that error responses return JSON, not HTML."""
    print(f"\n🔍 Checking exception handling (test with invalid endpoint)...")
    try:
        resp = requests.get(f"{BACKEND_URL}/invalid_endpoint", timeout=5)
        if resp.headers.get('content-type', '').startswith('application/json'):
            print(f"✅ Error responses are JSON (good!)")
            try:
                data = resp.json()
                print(f"   Status: {resp.status_code}")
                print(f"   Response: {json.dumps(data, indent=2)[:200]}...")
            except:
                print(f"   Could not parse as JSON")
        else:
            print(f"⚠️  Error response is not JSON!")
            print(f"   Content-Type: {resp.headers.get('content-type')}")
            print(f"   First 200 chars: {resp.text[:200]}")
            return False
        return True
    except Exception as e:
        print(f"⚠️  Check failed: {e}")
        return False

def main():
    print("=" * 60)
    print("CA-ASSIST BACKEND HEALTH CHECK")
    print("=" * 60)
    
    health_ok = check_health()
    if not health_ok:
        print("\n❌ Backend is not running. Please start it first.")
        sys.exit(1)
    
    json_ok = check_json_response()
    
    print("\n" + "=" * 60)
    if health_ok and json_ok:
        print("✅ BACKEND IS READY FOR TESTING")
        print("\nYou can now:")
        print("1. Open http://localhost:5173 in browser (frontend)")
        print("2. Login with test credentials")
        print("3. Go to Document Upload")
        print("4. Open DevTools (F12 → Console)")
        print("5. Upload a JPEG or PDF file")
        print("6. Watch console for logs and check for errors")
    else:
        print("⚠️  Backend may not be fully ready")
    print("=" * 60)

if __name__ == "__main__":
    main()
