"""
Privacy Middleware

This middleware provides the last line of defense against accidentally
exposing secrets in API responses or error messages.

It intercepts all responses and automatically redacts any sensitive
data that might have slipped through.
"""

import json
import time
from typing import Callable

from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from app.logging_config import get_logger
from app.security import redact_secrets, sanitize_log_data

logger = get_logger(__name__)


class PrivacyMiddleware(BaseHTTPMiddleware):
    """
    Middleware that automatically redacts secrets from responses.
    
    This middleware:
    1. Intercepts all API responses
    2. Scans response bodies for potential secrets
    3. Redacts any secrets found
    4. Ensures error messages don't leak sensitive data
    
    This is a safety net - your code should never include secrets
    in responses in the first place, but this catches any that slip through.
    """
    
    def __init__(
        self,
        app: ASGIApp,
        redact_responses: bool = True,
        redact_errors: bool = True,
    ):
        super().__init__(app)
        self.redact_responses = redact_responses
        self.redact_errors = redact_errors
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Process request and redact secrets from response"""
        
        start_time = time.time()
        
        try:
            # Process request
            response = await call_next(request)
            
            # Only redact JSON responses
            content_type = response.headers.get("content-type", "")
            
            if "application/json" in content_type and self.redact_responses:
                # Read response body
                body_bytes = b""
                async for chunk in response.body_iterator:
                    body_bytes += chunk
                
                try:
                    # Parse JSON
                    body_str = body_bytes.decode("utf-8")
                    body_data = json.loads(body_str)
                    
                    # Redact secrets from response data
                    redacted_data = self._redact_response_data(body_data)
                    
                    # Create new response with redacted data
                    return JSONResponse(
                        content=redacted_data,
                        status_code=response.status_code,
                        headers=dict(response.headers),
                    )
                except (json.JSONDecodeError, UnicodeDecodeError):
                    # If not valid JSON or can't decode, return as-is
                    return Response(
                        content=body_bytes,
                        status_code=response.status_code,
                        headers=dict(response.headers),
                        media_type=content_type,
                    )
            
            return response
            
        except Exception as e:
            # Log error (with redaction)
            duration = time.time() - start_time
            
            error_data = {
                "path": request.url.path,
                "method": request.method,
                "duration_ms": round(duration * 1000, 2),
                "error": str(e),
            }
            
            # Sanitize error data before logging
            safe_error_data = sanitize_log_data(error_data)
            
            logger.error(
                f"Request error: {request.method} {request.url.path}",
                extra=safe_error_data,
                exc_info=True,
            )
            
            # Return error response with redacted message
            if self.redact_errors:
                error_message = redact_secrets(str(e))
            else:
                error_message = str(e)
            
            return JSONResponse(
                content={
                    "error": "Internal server error",
                    "message": error_message,
                },
                status_code=500,
            )
    
    def _redact_response_data(self, data: dict | list | str | any) -> any:
        """
        Recursively redact secrets from response data.
        
        Args:
            data: Response data to redact
            
        Returns:
            Redacted data
        """
        if isinstance(data, dict):
            return {
                key: self._redact_response_data(value)
                for key, value in data.items()
            }
        elif isinstance(data, list):
            return [self._redact_response_data(item) for item in data]
        elif isinstance(data, str):
            return redact_secrets(data)
        else:
            return data


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for privacy-safe request logging.
    
    Logs all requests but automatically redacts sensitive data from:
    - Request headers (Authorization, API keys, etc.)
    - Request body (passwords, secrets, tokens, etc.)
    - Query parameters
    """
    
    SENSITIVE_HEADERS = {
        "authorization",
        "x-api-key",
        "x-auth-token",
        "cookie",
        "x-csrf-token",
    }
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Log request with privacy protection"""
        
        start_time = time.time()
        
        # Sanitize headers
        safe_headers = {}
        for key, value in request.headers.items():
            if key.lower() in self.SENSITIVE_HEADERS:
                safe_headers[key] = "***REDACTED***"
            else:
                safe_headers[key] = value
        
        # Sanitize query params
        safe_params = {}
        for key, value in request.query_params.items():
            key_lower = key.lower()
            if any(term in key_lower for term in ["token", "key", "secret", "password"]):
                safe_params[key] = "***REDACTED***"
            else:
                safe_params[key] = value
        
        # Log request start
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                "method": request.method,
                "path": request.url.path,
                "client_host": request.client.host if request.client else None,
                "headers": safe_headers,
                "query_params": safe_params,
            },
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
            },
        )
        
        return response


class SecureErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware that ensures error messages never contain secrets.
    
    This is particularly important for validation errors, database errors,
    and other exceptions that might inadvertently include sensitive data
    in their messages.
    """
    
    async def dispatch(
        self, request: Request, call_next: Callable
    ) -> Response:
        """Handle errors securely"""
        
        try:
            response = await call_next(request)
            
            # If response is an error (4xx or 5xx), check for secrets
            if response.status_code >= 400:
                content_type = response.headers.get("content-type", "")
                
                if "application/json" in content_type:
                    # Read error response
                    body_bytes = b""
                    async for chunk in response.body_iterator:
                        body_bytes += chunk
                    
                    try:
                        body_str = body_bytes.decode("utf-8")
                        body_data = json.loads(body_str)
                        
                        # Redact any secrets in error messages
                        redacted_data = self._redact_error_data(body_data)
                        
                        return JSONResponse(
                            content=redacted_data,
                            status_code=response.status_code,
                            headers=dict(response.headers),
                        )
                    except (json.JSONDecodeError, UnicodeDecodeError):
                        # If can't parse, return as-is
                        return Response(
                            content=body_bytes,
                            status_code=response.status_code,
                            headers=dict(response.headers),
                            media_type=content_type,
                        )
            
            return response
            
        except Exception as e:
            # Ensure exception message doesn't contain secrets
            error_message = redact_secrets(str(e))
            
            logger.error(
                "Unhandled error in request",
                extra=sanitize_log_data({"error": error_message}),
                exc_info=True,
            )
            
            return JSONResponse(
                content={
                    "error": "Internal server error",
                    "message": error_message,
                },
                status_code=500,
            )
    
    def _redact_error_data(self, data: dict | list | str | any) -> any:
        """Redact secrets from error data"""
        if isinstance(data, dict):
            return {
                key: self._redact_error_data(value)
                for key, value in data.items()
            }
        elif isinstance(data, list):
            return [self._redact_error_data(item) for item in data]
        elif isinstance(data, str):
            return redact_secrets(data)
        else:
            return data


# Export middleware classes
__all__ = [
    "PrivacyMiddleware",
    "RequestLoggingMiddleware",
    "SecureErrorHandlerMiddleware",
]
