"""
Database Models

SQLAlchemy models for Gitzen application.

All models follow these principles:
- Privacy-first: No actual secrets stored, only SHA-256 hashes
- UUIDs for primary keys
- Timestamps on all tables (created_at, updated_at)
- Soft delete support (deleted_at)
- Proper indexing for common queries
- Foreign key constraints with cascading deletes
"""
from app.models.base import Base, TimestampMixin, SoftDeleteMixin
from app.models.user import User
from app.models.repository import Repository
from app.models.scan import Scan
from app.models.finding import Finding
from app.models.false_positive import FalsePositive

# Export all models for easy importing
__all__ = [
    "Base",
    "TimestampMixin",
    "SoftDeleteMixin",
    "User",
    "Repository",
    "Scan",
    "Finding",
    "FalsePositive",
]
