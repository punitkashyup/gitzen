"""
Findings API Router

RESTful API endpoints for managing and querying security findings.
All endpoints are privacy-safe and never expose actual secrets.
"""

from datetime import datetime, timedelta
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.logging_config import get_logger
from app.models import Finding, Repository, Scan
from app.schemas import (
    FindingListResponse,
    FindingResponse,
    FindingStatistics,
    FindingUpdate,
)

logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/findings", tags=["Findings"])


# ============================================================================
# List Findings Endpoint
# ============================================================================

@router.get("", response_model=FindingListResponse)
async def list_findings(
    # Pagination
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
    
    # Filtering
    repository_id: UUID | None = Query(None, description="Filter by repository"),
    status: Literal["open", "fixed", "ignored", "false_positive"] | None = Query(
        None, description="Filter by status"
    ),
    secret_type: str | None = Query(None, description="Filter by secret type"),
    severity: Literal["critical", "high", "medium", "low", "info"] | None = Query(
        None, description="Filter by severity"
    ),
    search: str | None = Query(None, max_length=200, description="Search in file paths"),
    
    # Sorting
    sort_by: Literal["created_at", "severity", "secret_type", "file_path"] = Query(
        "created_at", description="Sort by field"
    ),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Sort order"),
    
    # Database session
    db: AsyncSession = Depends(get_db),
) -> FindingListResponse:
    """
    Get paginated list of findings with filtering and sorting.
    
    **Privacy Note**: This endpoint NEVER returns actual secret values,
    only metadata about where secrets were found.
    
    **Filtering Options:**
    - `repository_id`: Show findings from specific repository
    - `status`: Filter by open, fixed, ignored, or false_positive
    - `secret_type`: Filter by type (api_key, github_token, etc.)
    - `severity`: Filter by severity level
    - `search`: Search in file paths (case-insensitive)
    
    **Sorting Options:**
    - `sort_by`: Field to sort by (created_at, severity, secret_type, file_path)
    - `sort_order`: asc or desc
    
    **Pagination:**
    - `page`: Page number (starting from 1)
    - `page_size`: Items per page (max 100)
    
    **Returns:**
    - List of findings with metadata
    - Total count and pagination info
    - NEVER includes actual secret values
    """
    logger.info(
        f"Listing findings: page={page}, page_size={page_size}, "
        f"repository_id={repository_id}, status={status}, "
        f"secret_type={secret_type}, severity={severity}"
    )
    
    # Build query
    query = select(Finding).where(Finding.deleted_at.is_(None))
    
    # Apply filters
    filters = []
    
    if repository_id:
        filters.append(Finding.repository_id == repository_id)
    
    if status:
        filters.append(Finding.status == status)
    
    if secret_type:
        filters.append(Finding.secret_type == secret_type)
    
    if severity:
        filters.append(Finding.severity == severity)
    
    if search:
        # Search in file paths (case-insensitive)
        filters.append(Finding.file_path.ilike(f"%{search}%"))
    
    if filters:
        query = query.where(and_(*filters))
    
    # Count total results
    count_query = select(func.count()).select_from(Finding).where(Finding.deleted_at.is_(None))
    if filters:
        count_query = count_query.where(and_(*filters))
    
    result = await db.execute(count_query)
    total = result.scalar() or 0
    
    # Apply sorting
    sort_column = getattr(Finding, sort_by)
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(sort_column)
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    findings = result.scalars().all()
    
    # Convert to response schema
    finding_responses = [FindingResponse.model_validate(f) for f in findings]
    
    # Calculate pagination info
    total_pages = (total + page_size - 1) // page_size
    
    logger.info(f"Found {total} findings, returning page {page}/{total_pages}")
    
    return FindingListResponse(
        items=finding_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ============================================================================
# Get Finding by ID
# ============================================================================

@router.get("/{finding_id}", response_model=FindingResponse)
async def get_finding(
    finding_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> FindingResponse:
    """
    Get detailed information about a specific finding.
    
    **Privacy Note**: NEVER returns the actual secret value,
    only metadata about the finding.
    
    **Returns:**
    - Full finding details
    - Related finding information
    - Resolution history if applicable
    - NEVER includes actual secret value
    
    **Errors:**
    - 404: Finding not found or deleted
    """
    logger.info(f"Fetching finding: {finding_id}")
    
    # Query finding
    query = select(Finding).where(
        and_(
            Finding.id == finding_id,
            Finding.deleted_at.is_(None)
        )
    )
    
    result = await db.execute(query)
    finding = result.scalar_one_or_none()
    
    if not finding:
        logger.warning(f"Finding not found: {finding_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding {finding_id} not found"
        )
    
    logger.info(f"Found finding: {finding_id} in {finding.file_path}")
    
    return FindingResponse.model_validate(finding)


# ============================================================================
# Update Finding Status
# ============================================================================

@router.patch("/{finding_id}", response_model=FindingResponse)
async def update_finding(
    finding_id: UUID,
    finding_update: FindingUpdate,
    db: AsyncSession = Depends(get_db),
) -> FindingResponse:
    """
    Update finding status and resolution information.
    
    **Allowed Updates:**
    - Change status (open → fixed, ignored, false_positive)
    - Add resolution notes
    - Record fixed commit SHA
    - Set resolution timestamp
    
    **Privacy Note**: All updates are logged securely without
    exposing sensitive data.
    
    **Errors:**
    - 404: Finding not found
    - 400: Invalid status transition
    """
    logger.info(f"Updating finding: {finding_id}")
    
    # Query finding
    query = select(Finding).where(
        and_(
            Finding.id == finding_id,
            Finding.deleted_at.is_(None)
        )
    )
    
    result = await db.execute(query)
    finding = result.scalar_one_or_none()
    
    if not finding:
        logger.warning(f"Finding not found: {finding_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding {finding_id} not found"
        )
    
    # Update fields
    update_data = finding_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(finding, field, value)
    
    # If status changed to fixed/ignored/false_positive, set resolved_at
    if finding_update.status and finding_update.status != "open":
        if not finding.resolved_at:
            finding.resolved_at = datetime.utcnow()
    
    # Update last_seen_at
    finding.last_seen_at = datetime.utcnow()
    
    # Commit changes
    await db.commit()
    await db.refresh(finding)
    
    logger.info(f"Updated finding {finding_id}: status={finding.status}")
    
    return FindingResponse.model_validate(finding)


# ============================================================================
# Get Related Findings
# ============================================================================

@router.get("/{finding_id}/related", response_model=FindingListResponse)
async def get_related_findings(
    finding_id: UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> FindingListResponse:
    """
    Get findings related to this one.
    
    Related findings are determined by:
    - Same repository
    - Same secret type
    - Similar file paths (same directory)
    - Within last 30 days
    
    **Privacy Note**: NEVER returns actual secret values.
    """
    logger.info(f"Fetching related findings for: {finding_id}")
    
    # Get the original finding
    query = select(Finding).where(Finding.id == finding_id)
    result = await db.execute(query)
    original = result.scalar_one_or_none()
    
    if not original:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Finding {finding_id} not found"
        )
    
    # Extract directory from file path
    file_dir = "/".join(original.file_path.split("/")[:-1])
    
    # Build query for related findings
    query = select(Finding).where(
        and_(
            Finding.id != finding_id,  # Exclude the original
            Finding.repository_id == original.repository_id,
            Finding.secret_type == original.secret_type,
            Finding.deleted_at.is_(None),
            # Same directory or nearby
            or_(
                Finding.file_path.like(f"{file_dir}/%"),
                Finding.file_path == original.file_path,
            ),
            # Within 30 days
            Finding.created_at >= datetime.utcnow() - timedelta(days=30)
        )
    ).order_by(desc(Finding.created_at))
    
    # Count total
    count_query = select(func.count()).select_from(Finding).where(
        and_(
            Finding.id != finding_id,
            Finding.repository_id == original.repository_id,
            Finding.secret_type == original.secret_type,
            Finding.deleted_at.is_(None),
            or_(
                Finding.file_path.like(f"{file_dir}/%"),
                Finding.file_path == original.file_path,
            ),
            Finding.created_at >= datetime.utcnow() - timedelta(days=30)
        )
    )
    
    result = await db.execute(count_query)
    total = result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    findings = result.scalars().all()
    
    # Convert to response
    finding_responses = [FindingResponse.model_validate(f) for f in findings]
    total_pages = (total + page_size - 1) // page_size
    
    logger.info(f"Found {total} related findings")
    
    return FindingListResponse(
        items=finding_responses,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# Export router
__all__ = ["router"]
