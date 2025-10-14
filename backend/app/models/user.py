"""
User Model

Stores user authentication and profile information.
Supports both OAuth (GitHub, Google) and email/password authentication.
"""
from sqlalchemy import Column, String, BigInteger, Boolean, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class AuthProvider(str, enum.Enum):
    """Authentication provider types"""
    EMAIL = "email"
    GITHUB = "github"
    GOOGLE = "google"


class User(Base, TimestampMixin, SoftDeleteMixin):
    """
    User model for authentication and profile management.
    
    Supports multiple authentication methods:
    - Email/Password (primary)
    - GitHub OAuth
    - Google OAuth (future)
    
    Attributes:
        id: Primary key (UUID)
        username: Unique username
        email: User email address (unique for email auth, nullable for OAuth)
        password_hash: Bcrypt hash of password (only for email auth)
        auth_provider: Authentication method (email, github, google)
        email_verified: Whether email has been verified
        
        # OAuth fields (nullable for email auth)
        github_id: GitHub user ID
        google_id: Google user ID (future)
        avatar_url: Profile avatar URL
        access_token_hash: SHA-256 hash of OAuth access token
        
        # Common fields
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
    username = Column(
        String(255),
        nullable=False,
        unique=True,
        index=True,
        comment="Unique username"
    )
    email = Column(
        String(255),
        nullable=True,  # Nullable for OAuth users without email
        unique=True,
        index=True,
        comment="User email address"
    )
    password_hash = Column(
        String(255),
        nullable=True,  # Nullable for OAuth users
        comment="Bcrypt hash of password (only for email auth)"
    )
    auth_provider = Column(
        Enum(AuthProvider),
        nullable=False,
        default=AuthProvider.EMAIL,
        index=True,
        comment="Authentication provider (email, github, google)"
    )
    email_verified = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether email has been verified"
    )
    
    # OAuth-specific fields
    github_id = Column(
        BigInteger,
        unique=True,
        nullable=True,  # Only for GitHub OAuth users
        index=True,
        comment="GitHub user ID"
    )
    google_id = Column(
        String(255),
        unique=True,
        nullable=True,  # Only for Google OAuth users
        index=True,
        comment="Google user ID"
    )
    avatar_url = Column(
        String,
        nullable=True,
        comment="Profile avatar URL"
    )
    access_token_hash = Column(
        String(64),
        nullable=True,
        comment="SHA-256 hash of OAuth access token"
    )
    
    # Common fields
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
