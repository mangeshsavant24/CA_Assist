import requests
import json
import uuid
import sys

# 1. Register a user
email = f"test_{uuid.uuid4()}@example.com"
password = "supersecretpassword123"

print("Registering:", email)
res = requests.post("http://localhost:8000/auth/register", json={
    "email": email,
    "password": password,
    "full_name": "Test User"
})
if res.status_code != 200:
    print("Register failed:", res.status_code, res.text)
    sys.exit(1)

# 2. Login
print("Logging in...")
res = requests.post("http://localhost:8000/auth/login", json={
    "username": email,
    "password": password
})
if res.status_code != 200:
    print("Login failed:", res.status_code, res.text)
    sys.exit(1)

token = res.json()["access_token"]
print("Token achieved")

# 3. Hit /regime/compare
print("Testing Calculate...")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
res = requests.post("http://localhost:8000/regime/compare", headers=headers, json={
    "gross_income": 900000,
    "sec_80c": 0,
    "sec_80d": 0,
    "hra_exemption": 0,
    "other_deductions": 0
})
print("Regime status:", res.status_code)
print("Regime response:", res.text)

# 4. Check lowercase authorization header
headers_lower = {
    "authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}
res2 = requests.post("http://localhost:8000/regime/compare", headers=headers_lower, json={
    "gross_income": 900000
})
print("Regime (lowercase auth) status:", res2.status_code)
