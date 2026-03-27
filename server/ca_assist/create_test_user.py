#!/usr/bin/env python
"""Create a test user for CA-Assist"""

import sys
sys.path.insert(0, '/d/CA_Assist/server/ca_assist')

from database import SessionLocal, engine, Base
from models import User
from api.security import hash_password

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def create_test_user():
    """Create a test user"""
    # Check if user exists
    existing = db.query(User).filter(User.email == "test@caassist.com").first()
    if existing:
        print("✓ Test user already exists: test@caassist.com")
        return existing
    
    # Create new user
    hashed_pw = hash_password("Test@123")
    test_user = User(
        email="test@caassist.com",
        hashed_password=hashed_pw,
        full_name="Test User"
    )
    
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    
    print("✓ Test user created successfully!")
    print(f"  Email: test@caassist.com")
    print(f"  Password: Test@123")
    print(f"  User ID: {test_user.id}")
    
    return test_user

if __name__ == "__main__":
    try:
        user = create_test_user()
        print("\n✓ You can now login with these credentials!")
    except Exception as e:
        print(f"✗ Error: {e}")
    finally:
        db.close()
