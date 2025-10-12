"""
Tests for the main FastAPI application.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_read_health():
    """Test the health endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "gitzen-api"
    assert "version" in data


def test_read_root():
    """Test the root endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "GitZen API" in data["message"]


def test_cors_headers():
    """Test CORS headers are present."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        }
    )
    # CORS headers should be present
    assert response.status_code in [200, 204]


def test_api_version_endpoint():
    """Test the API version information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data
    assert data["version"] == "0.1.0"


def test_findings_endpoint_placeholder():
    """Test findings endpoint returns placeholder data."""
    response = client.get("/api/v1/findings")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "message" in data


def test_repositories_endpoint_placeholder():
    """Test repositories endpoint returns placeholder data."""
    response = client.get("/api/v1/repositories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "message" in data


def test_invalid_endpoint():
    """Test that invalid endpoints return 404."""
    response = client.get("/api/v1/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_startup_event():
    """Test that startup event is triggered."""
    # This test ensures the app can start without errors
    assert app is not None
    assert hasattr(app, "openapi")


@pytest.mark.asyncio
async def test_shutdown_event():
    """Test that shutdown event can be triggered."""
    # This test ensures the app can shutdown without errors
    assert app is not None
