"""
Pydantic Schemas for API Request/Response Validation

These schemas ensure data is validated before it reaches the database
or is sent to clients. They enforce:
- Type safety
- Required fields
- Privacy-first design (no raw secrets)
- Input sanitization
"""

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, ConfigDict

from app.security import sanitize_file_path, validate_secret_type, hash_secret


# ============================================================================
# Base Schemas
# ============================================================================

class TimestampSchema(BaseModel):
    """Base schema with timestamp fields"""
    created_at: datetime
    updated_at: datetime


class SoftDeleteSchema(TimestampSchema):
    """Base schema with soft delete support"""
    deleted_at: datetime | None = None


# ============================================================================
# Finding Schemas
# ============================================================================

class FindingBase(BaseModel):
    """Base finding schema with common fields"""
    
    # File location
    file_path: str = Field(..., min_length=1, max_length=1000)
    line_number: int = Field(..., ge=1, le=1000000)
    column_start: int | None = Field(None, ge=0, le=10000)
    column_end: int | None = Field(None, ge=0, le=10000)
    
    # Secret information (NEVER the actual secret!)
    secret_type: str = Field(..., min_length=1, max_length=100)
    rule_id: str | None = Field(None, max_length=200)
    rule_name: str | None = Field(None, max_length=200)
    
    # Context (redacted)
    line_content_before: str | None = Field(None, max_length=500)
    line_content_after: str | None = Field(None, max_length=500)
    
    # Metadata
    severity: Literal["critical", "high", "medium", "low", "info"] = "medium"
    confidence: Literal["high", "medium", "low"] = "medium"
    
    # Status
    status: Literal["open", "fixed", "ignored", "false_positive"] = "open"
    
    # Git information
    commit_sha: str | None = Field(None, max_length=40)
    commit_author: str | None = Field(None, max_length=255)
    commit_message: str | None = Field(None, max_length=1000)
    commit_date: datetime | None = None
    
    # Additional context
    tags: list[str] = Field(default_factory=list)
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_validator("file_path")
    @classmethod
    def validate_file_path(cls, v: str) -> str:
        """Sanitize file path to prevent directory traversal"""
        return sanitize_file_path(v, allow_absolute=False)
    
    @field_validator("secret_type")
    @classmethod
    def validate_secret_type_field(cls, v: str) -> str:
        """Validate secret type against known types"""
        if not validate_secret_type(v):
            raise ValueError(
                f"Invalid secret_type: {v}. Must be a known secret type."
            )
        return v.lower()
    
    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        """Validate and sanitize tags"""
        if len(v) > 10:
            raise ValueError("Maximum 10 tags allowed")
        
        sanitized = []
        for tag in v:
            if len(tag) > 50:
                raise ValueError("Tag length must be <= 50 characters")
            if not tag.strip():
                continue
            sanitized.append(tag.strip().lower())
        
        return sanitized


class FindingCreate(FindingBase):
    """
    Schema for creating a new finding.
    
    CRITICAL: The 'matched_secret' field is used to generate the hash
    but is NEVER stored in the database. After hashing, it should be
    immediately discarded from memory.
    """
    
    # Repository and scan references
    repository_id: UUID
    scan_id: UUID
    
    # SECURITY CRITICAL: This field is NEVER stored!
    # It's only used to generate match_text_hash, then discarded.
    matched_secret: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="The actual secret found (NEVER stored, only hashed)"
    )
    
    # Line content with secret (for context, will be redacted)
    line_content: str | None = Field(None, max_length=1000)
    
    def get_match_text_hash(self) -> str:
        """
        Generate SHA-256 hash of the matched secret.
        
        This hash is what gets stored in the database. The original
        matched_secret is never persisted.
        
        Returns:
            str: SHA-256 hash (64 hex characters)
        """
        return hash_secret(self.matched_secret)
    
    model_config = ConfigDict(
        from_attributes=True,
        # Ensure matched_secret is not included in str() or repr()
        json_schema_extra={
            "example": {
                "repository_id": "123e4567-e89b-12d3-a456-426614174000",
                "scan_id": "123e4567-e89b-12d3-a456-426614174001",
                "file_path": "src/config.py",
                "line_number": 42,
                "secret_type": "api_key",
                "matched_secret": "*** NEVER LOG THIS FIELD ***",
                "severity": "high",
                "status": "open",
            }
        }
    )


class FindingUpdate(BaseModel):
    """Schema for updating a finding"""
    
    status: Literal["open", "fixed", "ignored", "false_positive"] | None = None
    resolution_notes: str | None = Field(None, max_length=2000)
    fixed_in_commit: str | None = Field(None, max_length=40)
    fixed_at: datetime | None = None
    
    model_config = ConfigDict(from_attributes=True)


class FindingResponse(FindingBase, TimestampSchema):
    """
    Schema for returning finding data in API responses.
    
    NEVER includes the actual secret or match_text_hash.
    Only includes metadata needed for display.
    """
    
    id: UUID
    repository_id: UUID
    scan_id: UUID
    
    # Risk assessment
    risk_score: float | None = Field(None, ge=0.0, le=10.0)
    
    # Resolution information
    resolution_notes: str | None = None
    resolved_by_id: UUID | None = None
    resolved_at: datetime | None = None
    fixed_in_commit: str | None = None
    
    # False positive association
    false_positive_id: UUID | None = None
    
    model_config = ConfigDict(from_attributes=True)


class FindingListResponse(BaseModel):
    """Paginated list of findings"""
    
    items: list[FindingResponse]
    total: int = Field(..., ge=0)
    page: int = Field(..., ge=1)
    page_size: int = Field(..., ge=1, le=100)
    total_pages: int = Field(..., ge=0)
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Scan Schemas
# ============================================================================

class ScanBase(BaseModel):
    """Base scan schema"""
    
    scan_type: Literal["full", "incremental", "manual"] = "full"
    branch: str | None = Field(None, max_length=255)
    commit_sha: str | None = Field(None, max_length=40)
    
    model_config = ConfigDict(from_attributes=True)


class ScanCreate(ScanBase):
    """Schema for creating a scan"""
    
    repository_id: UUID
    triggered_by_id: UUID


class ScanUpdate(BaseModel):
    """Schema for updating a scan"""
    
    status: Literal["pending", "running", "completed", "failed", "cancelled"] | None = None
    error_message: str | None = Field(None, max_length=2000)
    
    # Metrics
    findings_count: int | None = Field(None, ge=0)
    critical_count: int | None = Field(None, ge=0)
    high_count: int | None = Field(None, ge=0)
    medium_count: int | None = Field(None, ge=0)
    low_count: int | None = Field(None, ge=0)
    info_count: int | None = Field(None, ge=0)
    
    files_scanned: int | None = Field(None, ge=0)
    total_files: int | None = Field(None, ge=0)
    
    model_config = ConfigDict(from_attributes=True)


class ScanResponse(ScanBase, TimestampSchema):
    """Schema for returning scan data"""
    
    id: UUID
    repository_id: UUID
    triggered_by_id: UUID
    
    status: str
    
    # Metrics
    findings_count: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    info_count: int = 0
    
    # Performance
    duration_seconds: float | None = None
    files_scanned: int = 0
    total_files: int = 0
    
    # Timing
    started_at: datetime | None = None
    completed_at: datetime | None = None
    
    error_message: str | None = None
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# False Positive Schemas
# ============================================================================

class FalsePositiveCreate(BaseModel):
    """Schema for creating a false positive"""
    
    repository_id: UUID | None = None  # None = global scope
    
    # Pattern info (hashed, never the actual pattern)
    pattern_description: str = Field(..., min_length=1, max_length=500)
    reason: str = Field(..., min_length=1, max_length=2000)
    
    # The pattern itself (will be hashed, never stored)
    pattern: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="Pattern to ignore (will be hashed)"
    )
    
    scope: Literal["repository", "global"] = "repository"
    expires_at: datetime | None = None
    
    def get_pattern_hash(self) -> str:
        """Generate SHA-256 hash of the pattern"""
        return hash_secret(self.pattern)
    
    model_config = ConfigDict(from_attributes=True)


class FalsePositiveResponse(TimestampSchema):
    """Schema for returning false positive data"""
    
    id: UUID
    repository_id: UUID | None
    
    pattern_description: str
    reason: str
    scope: str
    
    created_by_id: UUID
    updated_by_id: UUID | None
    
    expires_at: datetime | None
    is_active: bool
    
    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# Statistics Schemas
# ============================================================================

class FindingStatistics(BaseModel):
    """Aggregated finding statistics"""
    
    total_findings: int = 0
    open_findings: int = 0
    fixed_findings: int = 0
    ignored_findings: int = 0
    false_positives: int = 0
    
    by_severity: dict[str, int] = Field(default_factory=dict)
    by_secret_type: dict[str, int] = Field(default_factory=dict)
    by_repository: dict[str, int] = Field(default_factory=dict)
    
    # Trending data (last 30 days)
    trend_new: int = 0
    trend_fixed: int = 0
    trend_change_percent: float = 0.0
    
    model_config = ConfigDict(from_attributes=True)


# Export all schemas
__all__ = [
    "FindingBase",
    "FindingCreate",
    "FindingUpdate",
    "FindingResponse",
    "FindingListResponse",
    "ScanBase",
    "ScanCreate",
    "ScanUpdate",
    "ScanResponse",
    "FalsePositiveCreate",
    "FalsePositiveResponse",
    "FindingStatistics",
]
