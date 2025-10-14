"""
False Positive Model

Stores user-marked false positives for pattern learning.
"""
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class FalsePositive(Base, TimestampMixin, SoftDeleteMixin):
    """
    False Positive model for storing user-marked false positive patterns.
    
    This allows the system to learn and automatically filter out known false positives.
    
    Attributes:
        id: Primary key (UUID)
        repository_id: Foreign key to repositories table (NULL for global scope)
        user_id: Foreign key to users table (who marked it)
        secret_type: Type of secret
        pattern_hash: SHA-256 hash of the pattern
        file_path_pattern: Optional glob pattern for file paths
        reason: User's reason for marking as false positive
        scope: Scope of the false positive (repository, global)
        is_active: Whether this false positive is active
        times_matched: Number of times this pattern has been matched
        last_matched_at: Last time this pattern was matched
    """
    __tablename__ = "false_positives"
    __table_args__ = (
        UniqueConstraint(
            'repository_id', 'pattern_hash',
            name='unique_false_positive'
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Primary key"
    )
    repository_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        comment="Foreign key to repositories table (NULL for global scope)"
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Foreign key to users table (who marked it)"
    )
    secret_type = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Type of secret"
    )
    pattern_hash = Column(
        String(64),
        nullable=False,
        index=True,
        comment="SHA-256 hash of the pattern"
    )
    file_path_pattern = Column(
        String,
        nullable=True,
        comment="Optional glob pattern for file paths (e.g., **/test/**)"
    )
    reason = Column(
        String,
        nullable=True,
        comment="User's reason for marking as false positive"
    )
    scope = Column(
        String(50),
        nullable=False,
        default="repository",
        index=True,
        comment="Scope of the false positive (repository, global)"
    )
    is_active = Column(
        Boolean,
        nullable=False,
        default=True,
        comment="Whether this false positive is active"
    )
    times_matched = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Number of times this pattern has been matched"
    )
    last_matched_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Last time this pattern was matched"
    )

    # Relationships
    repository = relationship("Repository", back_populates="false_positives")
    user = relationship("User", back_populates="false_positives")

    def __repr__(self) -> str:
        return f"<FalsePositive(id={self.id}, secret_type='{self.secret_type}', scope='{self.scope}')>"
