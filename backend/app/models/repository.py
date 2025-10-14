"""
Repository Model

Stores repository metadata linked to users.
"""
from sqlalchemy import Column, String, BigInteger, Boolean, Integer, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class Repository(Base, TimestampMixin, SoftDeleteMixin):
    """
    Repository model for storing GitHub repository information.
    
    Attributes:
        id: Primary key (UUID)
        user_id: Foreign key to users table
        github_repo_id: GitHub repository ID
        owner: Repository owner username
        name: Repository name
        full_name: Full repository name (owner/repo)
        description: Repository description
        is_private: Whether repository is private
        default_branch: Default branch name
        language: Primary programming language
        stars_count: Number of stars
        last_scanned_at: Last scan timestamp
        scan_enabled: Whether scanning is enabled
    """
    __tablename__ = "repositories"
    __table_args__ = (
        UniqueConstraint('user_id', 'github_repo_id', name='unique_repo_per_user'),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Primary key"
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Foreign key to users table"
    )
    github_repo_id = Column(
        BigInteger,
        unique=True,
        nullable=False,
        index=True,
        comment="GitHub repository ID"
    )
    owner = Column(
        String(255),
        nullable=False,
        comment="Repository owner username"
    )
    name = Column(
        String(255),
        nullable=False,
        comment="Repository name"
    )
    full_name = Column(
        String(512),
        nullable=False,
        index=True,
        comment="Full repository name (owner/repo)"
    )
    description = Column(
        String,
        nullable=True,
        comment="Repository description"
    )
    is_private = Column(
        Boolean,
        nullable=False,
        default=False,
        comment="Whether repository is private"
    )
    default_branch = Column(
        String(255),
        nullable=False,
        default="main",
        comment="Default branch name"
    )
    language = Column(
        String(100),
        nullable=True,
        comment="Primary programming language"
    )
    stars_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Number of stars"
    )
    last_scanned_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last scan timestamp"
    )
    scan_enabled = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether scanning is enabled"
    )

    # Relationships
    user = relationship("User", back_populates="repositories")
    scans = relationship(
        "Scan",
        back_populates="repository",
        cascade="all, delete-orphan"
    )
    findings = relationship(
        "Finding",
        back_populates="repository",
        cascade="all, delete-orphan"
    )
    false_positives = relationship(
        "FalsePositive",
        back_populates="repository",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Repository(id={self.id}, full_name='{self.full_name}')>"
