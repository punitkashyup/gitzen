"""
Scan Model

Stores scan execution metadata and results.
"""
from sqlalchemy import Column, String, Integer, BigInteger, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.models.base import Base, TimestampMixin, SoftDeleteMixin


class Scan(Base, TimestampMixin, SoftDeleteMixin):
    """
    Scan model for storing scan execution information.
    
    Attributes:
        id: Primary key (UUID)
        repository_id: Foreign key to repositories table
        commit_sha: Git commit SHA
        branch: Branch name
        pr_number: Pull request number (NULL for non-PR scans)
        scan_type: Type of scan (push, pull_request, manual)
        status: Scan status (pending, running, completed, failed)
        total_files_scanned: Number of files scanned
        total_findings: Total number of findings
        high_severity_count: Count of high severity findings
        medium_severity_count: Count of medium severity findings
        low_severity_count: Count of low severity findings
        scan_duration_ms: Scan duration in milliseconds
        error_message: Error message if scan failed
        github_action_run_id: GitHub Action run ID
        triggered_by: Username who triggered the scan
        started_at: Scan start timestamp
        completed_at: Scan completion timestamp
    """
    __tablename__ = "scans"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
        comment="Primary key"
    )
    repository_id = Column(
        UUID(as_uuid=True),
        ForeignKey("repositories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Foreign key to repositories table"
    )
    commit_sha = Column(
        String(40),
        nullable=False,
        index=True,
        comment="Git commit SHA"
    )
    branch = Column(
        String(255),
        nullable=False,
        comment="Branch name"
    )
    pr_number = Column(
        Integer,
        nullable=True,
        index=True,
        comment="Pull request number (NULL for non-PR scans)"
    )
    scan_type = Column(
        String(50),
        nullable=False,
        comment="Type of scan (push, pull_request, manual)"
    )
    status = Column(
        String(50),
        nullable=False,
        default="pending",
        index=True,
        comment="Scan status (pending, running, completed, failed)"
    )
    total_files_scanned = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Number of files scanned"
    )
    total_findings = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Total number of findings"
    )
    high_severity_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Count of high severity findings"
    )
    medium_severity_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Count of medium severity findings"
    )
    low_severity_count = Column(
        Integer,
        nullable=False,
        default=0,
        comment="Count of low severity findings"
    )
    scan_duration_ms = Column(
        Integer,
        nullable=True,
        comment="Scan duration in milliseconds"
    )
    error_message = Column(
        String,
        nullable=True,
        comment="Error message if scan failed"
    )
    github_action_run_id = Column(
        BigInteger,
        nullable=True,
        comment="GitHub Action run ID"
    )
    triggered_by = Column(
        String(255),
        nullable=True,
        comment="Username who triggered the scan"
    )
    started_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Scan start timestamp"
    )
    completed_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Scan completion timestamp"
    )

    # Relationships
    repository = relationship("Repository", back_populates="scans")
    findings = relationship(
        "Finding",
        back_populates="scan",
        cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Scan(id={self.id}, status='{self.status}', commit='{self.commit_sha[:7]}')>"
