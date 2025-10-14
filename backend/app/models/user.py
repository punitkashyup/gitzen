"""
User Model

Stores user authentication and profile information.
"""
from sqlalchemy import Column, String, BigInteger, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class User(Base, TimestampMixin, SoftDeleteMixin):
    """
    User model for authentication and profile management.
    
    Attributes:
        id: Primary key (UUID)
        github_id: GitHub user ID
        username: GitHub username
        email: User email address
        avatar_url: GitHub avatar URL
        access_token_hash: SHA-256 hash of GitHub access token
        role: User role (user, admin)
        is_active: Whether user account is active
        last_login_at: Last login timestamp
    """
    __tablename__ = "users"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Primary key"
    )
    github_id = Column(
        BigInteger,
        unique=True,
        nullable=False,
        index=True,
        comment="GitHub user ID"
    )
    username = Column(
        String(255),
        nullable=False,
        index=True,
        comment="GitHub username"
    )
    email = Column(
        String(255),
        nullable=True,
        comment="User email address"
    )
    avatar_url = Column(
        String,
        nullable=True,
        comment="GitHub avatar URL"
    )
    access_token_hash = Column(
        String(64),
        nullable=True,
        comment="SHA-256 hash of access token"
    )
    role = Column(
        String(50),
        nullable=False,
        default="user",
        comment="User role (user, admin)"
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether user account is active"
    )
    last_login_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last login timestamp"
    )

    # Relationships
    repositories = relationship(
        "Repository",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    false_positives = relationship(
        "FalsePositive",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    resolved_findings = relationship(
        "Finding",
        back_populates="resolved_by_user",
        foreign_keys="Finding.resolved_by"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}', role='{self.role}')>"
