"""
Database Base Configuration

Provides the declarative base for all SQLAlchemy models.
"""
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
import uuid

# Create declarative base
Base = declarative_base()


class TimestampMixin:
    """
    Mixin that adds timestamp fields to models.
    
    Attributes:
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        comment="Record creation timestamp"
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        comment="Record last update timestamp"
    )


class SoftDeleteMixin:
    """
    Mixin that adds soft delete support to models.
    
    Attributes:
        deleted_at: Timestamp when record was soft deleted (NULL if active)
    """
    deleted_at = Column(
        DateTime(timezone=True),
        nullable=True,
        comment="Soft delete timestamp (NULL if active)"
    )
    
    @property
    def is_deleted(self) -> bool:
        """Check if record is soft deleted"""
        return self.deleted_at is not None
    
    def soft_delete(self):
        """Mark record as deleted"""
        self.deleted_at = func.now()
    
    def restore(self):
        """Restore a soft deleted record"""
        self.deleted_at = None
