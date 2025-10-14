"""
Database connection and session management.

This module provides:
- Async SQLAlchemy engine and session factory
- Database initialization and cleanup
- Dependency injection for FastAPI routes
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from app.config import settings
from app.logging_config import get_logger
from app.models.base import Base

logger = get_logger(__name__)

# Global engine and session factory
_engine: AsyncEngine | None = None
_async_session_factory: async_sessionmaker[AsyncSession] | None = None


def get_engine() -> AsyncEngine:
    """
    Get or create the database engine.

    Returns:
        AsyncEngine: The SQLAlchemy async engine.

    Raises:
        RuntimeError: If database is not initialized.
    """
    global _engine
    if _engine is None:
        raise RuntimeError(
            "Database not initialized. Call init_db() first."
        )
    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Get the session factory.

    Returns:
        async_sessionmaker: The SQLAlchemy session factory.

    Raises:
        RuntimeError: If database is not initialized.
    """
    global _async_session_factory
    if _async_session_factory is None:
        raise RuntimeError(
            "Database not initialized. Call init_db() first."
        )
    return _async_session_factory


async def init_db() -> None:
    """
    Initialize database connection and session factory.

    This should be called during application startup.
    """
    global _engine, _async_session_factory

    logger.info(
        "Initializing database connection",
        extra={"database_url": settings.DATABASE_URL.split("@")[-1]},
    )

    # Create async engine
    _engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,  # SQL query logging in debug mode
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,  # Connection pool size
        max_overflow=10,  # Additional connections when pool is full
        # Use NullPool for testing to avoid connection issues
        poolclass=NullPool if settings.APP_ENV == "test" else None,
    )

    # Create session factory
    _async_session_factory = async_sessionmaker(
        _engine,
        class_=AsyncSession,
        expire_on_commit=False,  # Don't expire objects after commit
        autoflush=False,  # Manual control over flushing
        autocommit=False,  # Manual control over transactions
    )

    logger.info("Database connection initialized successfully")


async def close_db() -> None:
    """
    Close database connection and cleanup resources.

    This should be called during application shutdown.
    """
    global _engine, _async_session_factory

    if _engine is not None:
        logger.info("Closing database connection")
        await _engine.dispose()
        _engine = None
        _async_session_factory = None
        logger.info("Database connection closed")


async def create_tables() -> None:
    """
    Create all database tables.

    WARNING: This is for development/testing only.
    Use Alembic migrations in production.
    """
    engine = get_engine()
    logger.warning("Creating all database tables (development mode)")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Database tables created successfully")


async def drop_tables() -> None:
    """
    Drop all database tables.

    WARNING: This is for testing only. All data will be lost.
    """
    engine = get_engine()
    logger.warning("Dropping all database tables")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    logger.info("Database tables dropped successfully")


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency for database sessions.

    Yields:
        AsyncSession: Database session for the request.

    Example:
        @app.get("/users/{user_id}")
        async def get_user(
            user_id: UUID,
            db: AsyncSession = Depends(get_db)
        ):
            return await db.get(User, user_id)
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


@asynccontextmanager
async def get_db_context() -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager for database sessions outside of FastAPI.

    Yields:
        AsyncSession: Database session.

    Example:
        async with get_db_context() as db:
            user = await db.get(User, user_id)
    """
    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def check_db_health() -> dict[str, str | bool]:
    """
    Check database connection health.

    Returns:
        dict: Health check result with status and details.

    Example:
        {
            "status": "healthy",
            "database": "connected",
            "can_query": True
        }
    """
    try:
        engine = get_engine()

        # Test connection by executing a simple query
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
            "can_query": True,
        }
    except Exception as e:
        logger.error("Database health check failed", exc_info=e)
        return {
            "status": "unhealthy",
            "database": "disconnected",
            "can_query": False,
            "error": str(e),
        }
