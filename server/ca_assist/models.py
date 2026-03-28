from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, JSON, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationship to UserDocument
    documents = relationship("UserDocument", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email})>"


class UserDocument(Base):
    __tablename__ = "user_documents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    filename = Column(String, nullable=True) # Synthesis / user-facing name
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(String, nullable=True) # pdf, jpeg...
    document_type = Column(String, nullable=True) # our classified type
    description = Column(String, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    # New extracted status fields
    extracted_fields = Column(JSON, nullable=True)
    chunks_added = Column(Integer, nullable=True, default=0)
    is_relevant_for_regime = Column(Boolean, nullable=True, default=False)
    is_relevant_for_forex = Column(Boolean, nullable=True, default=False)
    is_relevant_for_fund = Column(Boolean, nullable=True, default=False)
    
    # Relationship back to User
    user = relationship("User", back_populates="documents")

    def __repr__(self):
        return f"<UserDocument(id={self.id}, user_id={self.user_id}, filename={self.original_filename})>"
