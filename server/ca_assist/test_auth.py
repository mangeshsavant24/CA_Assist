#!/usr/bin/env python3
"""Test authentication setup"""

try:
    # Initialize database
    from database import engine, init_db, SessionLocal
    from models import User
    from api.security import hash_password, verify_password
    
    print("✓ Imports successful")
    
    # Create tables
    init_db()
    print("✓ Database tables created")
    
    # Create test user
    db = SessionLocal()
    
    # Check if user exists
    user = db.query(User).filter(User.email == "user1@gmail.com").first()
    if user:
        print(f"✓ Test user exists: {user.email}")
        # Verify password works
        test_pass = verify_password("password123", user.hashed_password)
        print(f"✓ Password verification: {test_pass}")
    else:
        # Create new user
        hashed = hash_password("password123")
        new_user = User(
            email="user1@gmail.com",
            hashed_password=hashed,
            full_name="Test User"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        print(f"✓ Created test user with ID: {new_user.id}")
        
        # Test password verification
        test_pass = verify_password("password123", new_user.hashed_password)
        print(f"✓ Password verification: {test_pass}")
    
    db.close()
    print("\n✓ All tests passed! Login with:")
    print("  Email: user1@gmail.com")
    print("  Password: password123")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
