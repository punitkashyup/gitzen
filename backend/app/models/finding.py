"""
Finding Model

Stores individual secret detection findings.

CRITICAL: This model NEVER stores actual secrets, only SHA-256 hashes!
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, DateTime, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class Finding(Base, TimestampMixin, SoftDeleteMixin):
    """
    Finding model for storing secret detection results.
    
    PRIVACY-FIRST DESIGN:
    - match_text_hash: SHA-256 hash of the matched secret (NEVER the actual secret)
    - context_before/after: Sanitized context (no secrets)
    
    Attributes:
        id: Primary key (UUID)
        scan_id: Foreign key to scans table
        repository_id: Foreign key to repositories table
        file_path: Path to file containing the finding
        line_number: Line number where secret was found
        start_column: Starting column position
        end_column: Ending column position
        secret_type: Type of secret detected
        match_text_hash: SHA-256 hash of the matched text
        rule_id: Gitleaks rule ID that detected the secret
        entropy: Entropy score of the match
        context_before: Sanitized line before the match
        context_after: Sanitized line after the match
        commit_sha: Git commit SHA where secret was found
        commit_author: Author of the commit
        commit_date: Date of the commit
        status: Finding status (active, resolved, false_positive, ignored)
        severity: Severity level (high, medium, low)
        resolved_at: Timestamp when finding was resolved
        resolved_by: User ID who resolved the finding
        resolution_note: Note explaining the resolution
    """
    __tablename__ = "findings"
    __table_args__ = (
        UniqueConstraint(
            'scan_id', 'file_path', 'line_number', 'match_text_hash',
            name='unique_finding_per_scan'
        ),
    )

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Primary key"
    )
    scan_id = Column(
        UUID(as_uuid=True),
        ForeignKey("scans.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Foreign key to scans table"
    )
    repository_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Foreign key to repositories table"
    )
    
    # Location information
    file_path = Column(
        String,
        nullable=False,
        index=True,
        comment="Path to file containing the finding"
    )
    line_number = Column(
        Integer,
        nullable=False,
        comment="Line number where secret was found"
    )
    start_column = Column(
        Integer,
        nullable=True,
        comment="Starting column position"
    )
    end_column = Column(
        Integer,
        nullable=True,
        comment="Ending column position"
    )
    
    # Secret information (PRIVACY-SAFE)
    secret_type = Column(
        String(100),
        nullable=False,
        index=True,
        comment="Type of secret detected (e.g., aws_access_key, github_token)"
    )
    match_text_hash = Column(
        String(64),
        nullable=False,
        index=True,
        comment="SHA-256 hash of the matched text (NEVER the actual secret)"
    )
    rule_id = Column(
        String(255),
        nullable=True,
        comment="Gitleaks rule ID that detected the secret"
    )
    entropy = Column(
        Float,
        nullable=True,
        comment="Entropy score of the match"
    )
    
    # Context (sanitized)
    context_before = Column(
        String,
        nullable=True,
        comment="Sanitized line before the match (no secrets)"
    )
    context_after = Column(
        String,
        nullable=True,
        comment="Sanitized line after the match (no secrets)"
    )
    commit_sha = Column(
        String(40),
        nullable=True,
        comment="Git commit SHA where secret was found"
    )
    commit_author = Column(
        String(255),
        nullable=True,
        comment="Author of the commit"
    )
    commit_date = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Date of the commit"
    )
    
    # Status tracking
    status = Column(
        String(50),
        nullable=False,
        default="active",
        index=True,
        comment="Finding status (active, resolved, false_positive, ignored)"
    )
    severity = Column(
        String(20),
        nullable=False,
        default="high",
        index=True,
        comment="Severity level (high, medium, low)"
    )
    
    # Resolution tracking
    resolved_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Timestamp when finding was resolved"
    )
    resolved_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        comment="User ID who resolved the finding"
    )
    resolution_note = Column(
        String,
        nullable=True,
        comment="Note explaining the resolution"
    )

    # Relationships
    scan = relationship("Scan", back_populates="findings")
    repository = relationship("Repository", back_populates="findings")
    resolved_by_user = relationship(
        "User",
        back_populates="resolved_findings",
        foreign_keys=[resolved_by]
    )

    def __repr__(self) -> str:
        return f"<Finding(id={self.id}, secret_type='{self.secret_type}', status='{self.status}', severity='{self.severity}')>"
