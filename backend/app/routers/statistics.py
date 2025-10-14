"""
Statistics API Router

Provides aggregate metrics and analytics for findings.
"""

from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.logging_config import get_logger
from app.models import Finding, Repository
from app.schemas import FindingStatistics

logger = get_logger(__name__)

# Create router
router = APIRouter(prefix="/statistics", tags=["Statistics"])


@router.get("", response_model=FindingStatistics)
async def get_statistics(
    repository_id: UUID | None = Query(None, description="Filter by repository"),
    days: int = Query(30, ge=1, le=365, description="Days to analyze for trending"),
    db: AsyncSession = Depends(get_db),
) -> FindingStatistics:
    """
    Get aggregate statistics and metrics for findings.
    
    **Provides:**
    - Total findings count
    - Breakdown by status (open, fixed, ignored, false_positive)
    - Breakdown by severity (critical, high, medium, low, info)
    - Breakdown by secret type
    - Breakdown by repository
    - Trending data (new vs fixed in time period)
    
    **Parameters:**
    - `repository_id`: Limit stats to specific repository
    - `days`: Number of days for trending analysis (default 30)
    
    **Privacy Note**: All aggregated, no secret values exposed.
    """
    logger.info(f"Generating statistics: repository_id={repository_id}, days={days}")
    
    # Base filter
    base_filter = Finding.deleted_at.is_(None)
    if repository_id:
        base_filter = and_(base_filter, Finding.repository_id == repository_id)
    
    # Total findings
    total_query = select(func.count()).select_from(Finding).where(base_filter)
    result = await db.execute(total_query)
    total_findings = result.scalar() or 0
    
    # Breakdown by status
    status_query = (
        select(Finding.status, func.count())
        .where(base_filter)
        .group_by(Finding.status)
    )
    result = await db.execute(status_query)
    status_counts = {row[0]: row[1] for row in result}
    
    open_findings = status_counts.get("open", 0)
    fixed_findings = status_counts.get("fixed", 0)
    ignored_findings = status_counts.get("ignored", 0)
    false_positives = status_counts.get("false_positive", 0)
    
    # Breakdown by severity
    severity_query = (
        select(Finding.severity, func.count())
        .where(base_filter)
        .group_by(Finding.severity)
    )
    result = await db.execute(severity_query)
    by_severity = {row[0]: row[1] for row in result}
    
    # Breakdown by secret type
    type_query = (
        select(Finding.secret_type, func.count())
        .where(base_filter)
        .group_by(Finding.secret_type)
        .order_by(func.count().desc())
        .limit(10)  # Top 10
    )
    result = await db.execute(type_query)
    by_secret_type = {row[0]: row[1] for row in result}
    
    # Breakdown by repository (if not filtering by single repo)
    by_repository = {}
    if not repository_id:
        repo_query = (
            select(Repository.full_name, func.count(Finding.id))
            .join(Finding, Repository.id == Finding.repository_id)
            .where(base_filter)
            .group_by(Repository.full_name)
            .order_by(func.count(Finding.id).desc())
            .limit(10)  # Top 10 repositories
        )
        result = await db.execute(repo_query)
        by_repository = {row[0]: row[1] for row in result}
    
    # Trending data (last N days)
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # New findings in period
    new_query = (
        select(func.count())
        .select_from(Finding)
        .where(
            and_(
                base_filter,
                Finding.created_at >= cutoff_date
            )
        )
    )
    result = await db.execute(new_query)
    trend_new = result.scalar() or 0
    
    # Fixed findings in period
    fixed_query = (
        select(func.count())
        .select_from(Finding)
        .where(
            and_(
                base_filter,
                Finding.status == "fixed",
                Finding.resolved_at >= cutoff_date
            )
        )
    )
    result = await db.execute(fixed_query)
    trend_fixed = result.scalar() or 0
    
    # Calculate trend percentage
    if trend_new > 0:
        trend_change_percent = ((trend_new - trend_fixed) / trend_new) * 100
    else:
        trend_change_percent = 0.0
    
    logger.info(
        f"Statistics: total={total_findings}, open={open_findings}, "
        f"fixed={fixed_findings}, trend_new={trend_new}, trend_fixed={trend_fixed}"
    )
    
    return FindingStatistics(
        total_findings=total_findings,
        open_findings=open_findings,
        fixed_findings=fixed_findings,
        ignored_findings=ignored_findings,
        false_positives=false_positives,
        by_severity=by_severity,
        by_secret_type=by_secret_type,
        by_repository=by_repository,
        trend_new=trend_new,
        trend_fixed=trend_fixed,
        trend_change_percent=round(trend_change_percent, 2),
    )


@router.get("/trends", response_model=dict)
async def get_trends(
    repository_id: UUID | None = Query(None),
    days: int = Query(30, ge=1, le=365),
    interval: str = Query("day", regex="^(day|week|month)$"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get time-series trend data for findings.
    
    **Returns:**
    - Time-series data showing findings over time
    - Can be grouped by day, week, or month
    - Shows new findings vs fixed findings
    
    **Parameters:**
    - `repository_id`: Limit to specific repository
    - `days`: Number of days to analyze
    - `interval`: Grouping interval (day, week, month)
    """
    logger.info(f"Generating trends: days={days}, interval={interval}")
    
    # Base filter
    base_filter = Finding.deleted_at.is_(None)
    if repository_id:
        base_filter = and_(base_filter, Finding.repository_id == repository_id)
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # For now, return a simple response structure
    # In production, you'd use date_trunc() SQL function for proper grouping
    return {
        "message": "Trend data endpoint",
        "interval": interval,
        "days": days,
        "note": "Full time-series implementation coming soon"
    }


# Export router
__all__ = ["router"]
