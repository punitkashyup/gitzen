"""
Custom Exceptions and Error Handlers for Gitzen API
"""
from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from app.logging_config import get_logger

logger = get_logger(__name__)


# Custom Exception Classes

class GitzenException(Exception):
    """Base exception for Gitzen application"""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ResourceNotFoundError(GitzenException):
    """Resource not found exception"""
    def __init__(self, resource: str, resource_id: str | int):
        message = f"{resource} with ID '{resource_id}' not found"
        super().__init__(message, status_code=404)


class UnauthorizedError(GitzenException):
    """Unauthorized access exception"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status_code=401)


class ForbiddenError(GitzenException):
    """Forbidden access exception"""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status_code=403)


class ValidationError(GitzenException):
    """Data validation exception"""
    def __init__(self, message: str):
        super().__init__(message, status_code=422)


class ConflictError(GitzenException):
    """Resource conflict exception"""
    def __init__(self, message: str):
        super().__init__(message, status_code=409)


# Exception Handlers

async def gitzen_exception_handler(request: Request, exc: GitzenException) -> JSONResponse:
    """
    Handle custom Gitzen exceptions.
    
    Args:
        request: FastAPI request object
        exc: GitzenException instance
        
    Returns:
        JSONResponse with error details
    """
    logger.error(
        f"GitzenException: {exc.message}",
        extra={
            "exception_type": type(exc).__name__,
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": type(exc).__name__,
            "message": exc.message,
            "status_code": exc.status_code,
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """
    Handle Pydantic validation errors with detailed field-level errors.
    
    Args:
        request: FastAPI request object
        exc: RequestValidationError instance
        
    Returns:
        JSONResponse with validation error details
    """
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    
    logger.warning(
        f"Validation error: {len(errors)} field(s)",
        extra={
            "path": request.url.path,
            "method": request.method,
            "errors": errors,
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "ValidationError",
            "message": "Request validation failed",
            "status_code": 422,
            "details": errors,
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handle FastAPI HTTP exceptions.
    
    Args:
        request: FastAPI request object
        exc: HTTPException instance
        
    Returns:
        JSONResponse with error details
    """
    logger.warning(
        f"HTTP Exception: {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method,
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": "HTTPException",
            "message": exc.detail,
            "status_code": exc.status_code,
        }
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Handle unexpected exceptions with redacted error messages.
    
    Args:
        request: FastAPI request object
        exc: Exception instance
        
    Returns:
        JSONResponse with generic error message
    """
    logger.error(
        f"Unhandled exception: {str(exc)}",
        extra={
            "exception_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method,
        },
        exc_info=True,
    )
    
    # Don't expose internal error details in production
    message = str(exc) if logger.level == logger.DEBUG else "An internal server error occurred"
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": message,
            "status_code": 500,
        }
    )
