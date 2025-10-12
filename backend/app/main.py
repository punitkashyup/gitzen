"""
Gitzen API - Main Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os

# Create FastAPI application
app = FastAPI(
    title="Gitzen API",
    description="Git Secret Detection & Cleanup Tool API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for Docker health checks and monitoring.
    """
    return JSONResponse(
        content={
            "status": "healthy",
            "service": "gitzen-api",
            "version": "0.1.0",
        },
        status_code=200,
    )


# Root Endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    API root endpoint with service information.
    """
    return {
        "message": "Welcome to Gitzen API",
        "docs": "/docs",
        "health": "/health",
        "version": "0.1.0",
    }


# Placeholder API endpoints (to be implemented in GITZ-16, GITZ-17, etc.)
@app.get("/api/v1/findings", tags=["Findings"])
async def get_findings():
    """Placeholder for findings list endpoint"""
    return {"message": "Findings endpoint - to be implemented"}


@app.get("/api/v1/repositories", tags=["Repositories"])
async def get_repositories():
    """Placeholder for repositories list endpoint"""
    return {"message": "Repositories endpoint - to be implemented"}


# Startup Event
@app.on_event("startup")
async def startup_event():
    """
    Application startup tasks.
    """
    print("🚀 Gitzen API starting up...")
    print(f"📝 Environment: {os.getenv('APP_ENV', 'development')}")
    print(f"🔧 Debug mode: {os.getenv('DEBUG', 'false')}")
    print("✅ Ready to accept requests")


# Shutdown Event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Application shutdown tasks.
    """
    print("🛑 Gitzen API shutting down...")
    print("✅ Cleanup complete")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=os.getenv("DEBUG", "false").lower() == "true",
    )
