from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import os
import warnings
from dotenv import load_dotenv

load_dotenv()

# FIXED: Suppress bcrypt version warning (bcrypt 4.x removed __about__ module)
warnings.filterwarnings(
    "ignore",
    message=".*error reading bcrypt version.*"
)

# Password hashing
# FIXED: Use bcrypt only (argon2_cffi not installed, bcrypt is stable and available)
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))


def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> tuple[str, int]:
    """
    Create JWT access token
    
    Returns:
        tuple: (token_string, expires_in_seconds)
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    expires_in = int(expires_delta.total_seconds()) if expires_delta else (ACCESS_TOKEN_EXPIRE_MINUTES * 60)
    
    return encoded_jwt, expires_in


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verify JWT token and return payload
    
    Returns:
        dict: Token payload if valid, None if invalid or expired
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
