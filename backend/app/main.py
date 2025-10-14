"""
Gitzen API - Main Application Entry Point

FastAPI application with comprehensive middleware, error handling,
and structured logging.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import time
from app.config import settings
from app.logging_config import get_logger
from app.database import init_db, close_db, check_db_health
from app.exceptions import (
    GitzenException,
    gitzen_exception_handler,
    validation_exception_handler,
    http_exception_handler,
    generic_exception_handler,
)

logger = get_logger(__name__)

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Privacy-first Git Secret Detection & Cleanup Tool API",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    debug=settings.DEBUG,
)

# Exception Handlers
app.add_exception_handler(GitzenException, gitzen_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Middleware - Order matters! (executed bottom to top)

# 1. CORS Middleware (last middleware to execute, first to receive response)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# 2. GZip Compression Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 3. Request Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing information"""
    start_time = time.time()
    
    # Log request
    logger.info(
        f"Request started: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "client_host": request.client.host if request.client else None,
        }
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate duration
    duration = time.time() - start_time
    
    # Log response
    logger.info(
        f"Request completed: {request.method} {request.url.path} - {response.status_code}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2),
        }
    )
    
    # Add custom headers
    response.headers["X-Process-Time"] = str(round(duration * 1000, 2))
    response.headers["X-API-Version"] = settings.APP_VERSION
    
    return response


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health", tags=["Health"], response_model=dict)
async def health_check():
    """
    Health check endpoint for Docker health checks and monitoring.
    
    Returns service status, version, and environment information.
    Includes database connectivity status.
    """
    # Check database health
    db_health = await check_db_health()
    
    # Determine overall status
    overall_status = "healthy" if db_health.get("status") == "healthy" else "degraded"
    status_code = 200 if overall_status == "healthy" else 503
    
    return JSONResponse(
        content={
            "status": overall_status,
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.APP_ENV,
            "database": db_health,
        },
        status_code=status_code,
    )


@app.get("/", tags=["Root"], response_model=dict)
async def root():
    """
    API root endpoint with service information and navigation.
    """
    return {
        "message": f"Welcome to {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "documentation": {
            "swagger": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json",
        },
        "endpoints": {
            "health": "/health",
            "api": settings.API_PREFIX,
        },
    }


# ============================================================================
# API Router Registration
# ============================================================================

# TODO: Register routers here as they are created
# from app.routers import findings, repositories, scans, users
# app.include_router(findings.router, prefix=settings.API_PREFIX, tags=["Findings"])
# app.include_router(repositories.router, prefix=settings.API_PREFIX, tags=["Repositories"])
# app.include_router(scans.router, prefix=settings.API_PREFIX, tags=["Scans"])
# app.include_router(users.router, prefix=settings.API_PREFIX, tags=["Users"])


# ============================================================================
# Placeholder Endpoints (to be replaced by routers)
# ============================================================================

@app.get(f"{settings.API_PREFIX}/findings", tags=["Findings"])
async def get_findings():
    """Placeholder for findings list endpoint"""
    logger.info("Findings endpoint called (placeholder)")
    return {
        "message": "Findings endpoint - to be implemented in GITZ-42",
        "status": "coming_soon",
    }


@app.get(f"{settings.API_PREFIX}/repositories", tags=["Repositories"])
async def get_repositories():
    """Placeholder for repositories list endpoint"""
    logger.info("Repositories endpoint called (placeholder)")
    return {
        "message": "Repositories endpoint - to be implemented",
        "status": "coming_soon",
    }


# ============================================================================
# Application Lifecycle Events
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """
    Application startup tasks.
    
    - Log startup information
    - Initialize database connection pool
    - Initialize Redis connection
    - Run any necessary migrations
    """
    logger.info("🚀 Gitzen API starting up...")
    logger.info(f"📝 Environment: {settings.APP_ENV}")
    logger.info(f"🔧 Debug mode: {settings.DEBUG}")
    logger.info(f"🌐 CORS origins: {settings.get_cors_origins}")
    logger.info(f"🔗 API prefix: {settings.API_PREFIX}")
    
    # Initialize database connection pool
    try:
        await init_db()
        logger.info("✅ Database connection initialized")
    except Exception as e:
        logger.error(f"❌ Failed to initialize database: {e}")
        # Don't fail startup - allow app to start in degraded mode
        logger.warning("⚠️ Starting in degraded mode without database")
    
    # TODO: Initialize Redis connection (GITZ-34)
    # TODO: Run health checks on dependencies
    
    logger.info("✅ Ready to accept requests")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown tasks.
    
    - Close database connections
    - Close Redis connections
    - Clean up resources
    """
    logger.info("🛑 Gitzen API shutting down...")
    
    # Close database connection pool
    try:
        await close_db()
        logger.info("✅ Database connection closed")
    except Exception as e:
        logger.error(f"⚠️ Error closing database: {e}")
    
    # TODO: Close Redis connection
    # TODO: Clean up any remaining resources
    
    logger.info("✅ Cleanup complete")


# ============================================================================
# Development Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    logger.info(f"Starting development server on {settings.API_HOST}:{settings.API_PORT}")
    
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
