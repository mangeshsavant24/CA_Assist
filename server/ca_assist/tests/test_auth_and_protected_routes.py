from fastapi.testclient import TestClient
from api.main import app
from database import init_db

client = TestClient(app)

# Ensure db exists before tests
init_db()


def test_user_register_and_login_and_protected_endpoints():
    # Register a new user
    user_data = {
        "email": "auth_test@example.com",
        "password": "securepass123",
        "full_name": "Auth Test"
    }
    res = client.post("/auth/register", json=user_data)
    assert res.status_code == 200
    user = res.json()
    assert user["email"] == user_data["email"]

    # Login
    res = client.post("/auth/login", json={"username": user_data["email"], "password": user_data["password"]})
    assert res.status_code == 200
    token_data = res.json()
    assert "access_token" in token_data
    assert token_data["token_type"] == "bearer"

    headers = {"Authorization": f"Bearer {token_data['access_token']}"}

    # Protected: Regime compare
    regime_payload = {
        "gross_income": 1000000,
        "sec_80c": 150000,
        "sec_80d": 25000,
        "hra_exemption": 100000,
        "other_deductions": 0
    }
    res = client.post("/regime/compare", json=regime_payload, headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert "old_regime" in body and "new_regime" in body

    # Protected: Query endpoint should work with token
    res = client.post("/query", json={"query": "What is 80C limit?"}, headers=headers)
    assert res.status_code == 200


def test_protected_route_denied_without_token():
    # No auth header on regime should fail
    res = client.post("/regime/compare", json={"gross_income": 1000000, "sec_80c": 0, "sec_80d": 0, "hra_exemption": 0, "other_deductions": 0})
    assert res.status_code == 401
