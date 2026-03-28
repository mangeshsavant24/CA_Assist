from fastapi.testclient import TestClient
from api.main import app
import uuid
import datetime

client = TestClient(app)

def test_auth():
    email = f"test_{uuid.uuid4()}@example.com"
    res = client.post("/auth/register", json={
        "email": email,
        "password": "supersecretpassword"
    })
    print("REgistered:", res.status_code, res.text)
    
    res = client.post("/auth/login", json={
        "username": email,
        "password": "supersecretpassword"
    })
    token = res.json()["access_token"]
    
    res = client.post("/regime/compare", headers={"Authorization": f"Bearer {token}"}, json={
        "gross_income": 900000,
        "sec_80c": 0,
        "sec_80d": 0,
        "hra_exemption": 0,
        "other_deductions": 0
    })
    print("Compare with Authorization:", res.status_code)
    print("Response:", res.text[:200])

if __name__ == "__main__":
    test_auth()
