#!/usr/bin/env python3
"""Test Auth API endpoints"""
import httpx
import json

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("CA-ASSIST AUTH API TESTER")
print("=" * 60)

try:
    client = httpx.Client()
    
    # Test 1: Health check
    print("\n1. Testing health endpoint...")
    resp = client.get(f"{BASE_URL}/health")
    print(f"   Status: {resp.status_code}")
    print(f"   Response: {resp.json()}")
    
    # Test 2: Register user
    print("\n2. Registering test user...")
    register_data = {
        "email": "testuser@gmail.com",
        "password": "testpass123",
        "full_name": "Test User Demo"
    }
    resp = client.post(f"{BASE_URL}/auth/register", json=register_data)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        print(f"   ✓ User created!")
        print(f"   Response: {resp.json()}")
    else:
        print(f"   Response: {resp.text}")
    
    # Test 3: Login
    print("\n3. Testing login...")
    login_data = {
        "username": "testuser@gmail.com",
        "password": "testpass123"
    }
    resp = client.post(f"{BASE_URL}/auth/login", json=login_data)
    print(f"   Status: {resp.status_code}")
    if resp.status_code == 200:
        token = resp.json()
        print(f"   ✓ Login successful!")
        print(f"   Access Token: {token.get('access_token', 'N/A')[:30]}...")
        print(f"   Token Type: {token.get('token_type')}")
    else:
        print(f"   Error: {resp.text}")
    
    print("\n" + "=" * 60)
    print("✓ API testing complete")
    print("=" * 60)
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
