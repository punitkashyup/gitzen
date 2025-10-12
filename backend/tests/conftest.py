"""Test configuration and fixtures."""
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture(scope="module")
def test_client() -> Generator:
    """
    Create a test client for the FastAPI application.
    """
    with TestClient(app) as client:
        yield client


@pytest.fixture(scope="session")
def test_db_url() -> str:
    """
    Return the test database URL.
    """
    return "postgresql://gitzen_test:test_password@localhost:5432/gitzen_test"


@pytest.fixture(scope="session")
def test_redis_url() -> str:
    """
    Return the test Redis URL.
    """
    return "redis://localhost:6379/1"
