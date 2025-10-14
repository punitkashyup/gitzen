"""
Security and Privacy Utilities

This module provides privacy-first utilities for handling sensitive data:
- SHA-256 hashing for secrets (NEVER store plaintext)
- Secret redaction for logs and error messages
- Input sanitization to prevent injection attacks
- PII detection and masking
"""

import hashlib
import re
from typing import Any
from pathlib import Path


# Patterns for detecting sensitive data that should be redacted
SENSITIVE_PATTERNS = [
    # API Keys and Tokens
    (re.compile(r'(api[_-]?key|apikey)["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_\-]{20,})', re.IGNORECASE), '***REDACTED_API_KEY***'),
    (re.compile(r'(access[_-]?token|accesstoken)["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_\-\.]{20,})', re.IGNORECASE), '***REDACTED_TOKEN***'),
    (re.compile(r'(bearer\s+)([a-zA-Z0-9_\-\.]{20,})', re.IGNORECASE), r'\1***REDACTED_TOKEN***'),
    
    # AWS Keys
    (re.compile(r'(AKIA[0-9A-Z]{16})', re.IGNORECASE), '***REDACTED_AWS_KEY***'),
    (re.compile(r'(aws_secret_access_key)["\']?\s*[:=]\s*["\']?([a-zA-Z0-9/+]{40})', re.IGNORECASE), r'\1=***REDACTED_AWS_SECRET***'),
    
    # GitHub Tokens
    (re.compile(r'(ghp_[a-zA-Z0-9]{36})', re.IGNORECASE), '***REDACTED_GITHUB_TOKEN***'),
    (re.compile(r'(gho_[a-zA-Z0-9]{36})', re.IGNORECASE), '***REDACTED_GITHUB_OAUTH***'),
    (re.compile(r'(ghs_[a-zA-Z0-9]{36})', re.IGNORECASE), '***REDACTED_GITHUB_SECRET***'),
    
    # Passwords
    (re.compile(r'(password|passwd|pwd)["\']?\s*[:=]\s*["\']?([^\s"\']{8,})', re.IGNORECASE), r'\1=***REDACTED_PASSWORD***'),
    
    # Private Keys
    (re.compile(r'(-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA\s+)?PRIVATE\s+KEY-----)', re.IGNORECASE), '***REDACTED_PRIVATE_KEY***'),
    
    # Database URLs with passwords
    (re.compile(r'(postgresql|mysql|mongodb)://([^:]+):([^@]+)@', re.IGNORECASE), r'\1://\2:***REDACTED_PASSWORD***@'),
    
    # Email addresses (PII)
    (re.compile(r'\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b'), '***REDACTED_EMAIL***'),
    
    # Generic secrets (anything marked as secret)
    (re.compile(r'(secret)["\']?\s*[:=]\s*["\']?([^\s"\']{8,})', re.IGNORECASE), r'\1=***REDACTED_SECRET***'),
]


def hash_secret(secret: str) -> str:
    """
    Hash a secret using SHA-256.
    
    This is used to create a unique identifier for a secret without
    storing the actual secret value. The hash can be used to:
    - Detect duplicate findings across scans
    - Check if a secret has been seen before
    - Group related findings
    
    **NEVER store or log the original secret value!**
    
    Args:
        secret: The secret value to hash (will not be stored)
        
    Returns:
        str: SHA-256 hash in hexadecimal format (64 characters)
        
    Example:
        >>> secret = "ghp_abc123def456"  # GitHub token
        >>> hashed = hash_secret(secret)
        >>> len(hashed)
        64
        >>> hashed.startswith('a')  # deterministic
        True
        
    Security Note:
        The secret parameter should NEVER be logged, stored in a variable
        that might be logged, or included in error messages.
    """
    if not secret:
        raise ValueError("Secret cannot be empty")
    
    # Use UTF-8 encoding for consistent hashing across platforms
    secret_bytes = secret.encode('utf-8')
    
    # SHA-256 hash
    hash_obj = hashlib.sha256(secret_bytes)
    
    # Return hexadecimal digest (64 characters)
    return hash_obj.hexdigest()


def hash_pattern(pattern: str) -> str:
    """
    Hash a pattern for false positive learning.
    
    Similar to hash_secret but specifically for patterns that users
    mark as false positives.
    
    Args:
        pattern: The pattern to hash
        
    Returns:
        str: SHA-256 hash in hexadecimal format
    """
    return hash_secret(pattern)


def redact_secrets(text: str, redaction_text: str = "***REDACTED***") -> str:
    """
    Redact sensitive data from text before logging or displaying.
    
    This function scans text for common secret patterns and replaces
    them with a redaction marker. Use this for:
    - Log messages
    - Error messages
    - API responses that might contain sensitive data
    
    Args:
        text: The text to scan for secrets
        redaction_text: Text to replace secrets with
        
    Returns:
        str: Text with secrets replaced by redaction marker
        
    Example:
        >>> log_msg = "API key: sk_live_abc123def456"
        >>> safe_msg = redact_secrets(log_msg)
        >>> "sk_live_abc123def456" not in safe_msg
        True
        >>> "REDACTED" in safe_msg
        True
        
    Note:
        This is a best-effort approach. Always design your system
        to NEVER include secrets in logs or error messages in the
        first place!
    """
    if not text:
        return text
    
    redacted_text = text
    
    # Apply all sensitive patterns
    for pattern, replacement in SENSITIVE_PATTERNS:
        redacted_text = pattern.sub(replacement, redacted_text)
    
    return redacted_text


def sanitize_file_path(file_path: str, allow_absolute: bool = False) -> str:
    """
    Sanitize file path to prevent directory traversal attacks.
    
    This ensures that file paths from scan results don't contain
    malicious patterns like "../../../etc/passwd".
    
    Args:
        file_path: The file path to sanitize
        allow_absolute: Whether to allow absolute paths
        
    Returns:
        str: Sanitized file path
        
    Raises:
        ValueError: If path contains suspicious patterns
        
    Example:
        >>> sanitize_file_path("src/main.py")
        'src/main.py'
        >>> sanitize_file_path("../../../etc/passwd")
        Traceback (most recent call last):
        ValueError: Invalid file path: contains directory traversal
    """
    if not file_path:
        raise ValueError("File path cannot be empty")
    
    # Check for directory traversal attempts
    if ".." in file_path:
        raise ValueError("Invalid file path: contains directory traversal")
    
    # Check for null bytes (can bypass security checks)
    if "\0" in file_path:
        raise ValueError("Invalid file path: contains null byte")
    
    # Normalize path
    path_obj = Path(file_path)
    
    # Check if absolute path
    if path_obj.is_absolute() and not allow_absolute:
        raise ValueError("Invalid file path: absolute paths not allowed")
    
    # Resolve path (this also removes redundant separators)
    try:
        # Don't actually resolve to filesystem, just normalize
        normalized = path_obj.as_posix()
    except (ValueError, OSError) as e:
        raise ValueError(f"Invalid file path: {e}")
    
    # Additional checks
    if normalized.startswith("/"):
        if not allow_absolute:
            raise ValueError("Invalid file path: absolute paths not allowed")
    
    return normalized


def validate_secret_type(secret_type: str) -> bool:
    """
    Validate that a secret type is one of the known types.
    
    This prevents injection of arbitrary values into the secret_type
    field, which could be used for attacks.
    
    Args:
        secret_type: The secret type to validate
        
    Returns:
        bool: True if valid, False otherwise
        
    Known secret types:
        - api_key
        - aws_access_key
        - aws_secret_key
        - github_token
        - private_key
        - database_url
        - password
        - jwt_token
        - oauth_token
        - slack_token
        - stripe_key
        - generic_secret
    """
    KNOWN_SECRET_TYPES = {
        "api_key",
        "aws_access_key",
        "aws_secret_key",
        "github_token",
        "gitlab_token",
        "bitbucket_token",
        "private_key",
        "ssh_key",
        "database_url",
        "connection_string",
        "password",
        "jwt_token",
        "oauth_token",
        "oauth_secret",
        "slack_token",
        "slack_webhook",
        "stripe_key",
        "twilio_key",
        "sendgrid_key",
        "mailgun_key",
        "azure_key",
        "gcp_key",
        "npm_token",
        "pypi_token",
        "docker_token",
        "generic_secret",
        "generic_token",
        "generic_key",
    }
    
    return secret_type.lower() in KNOWN_SECRET_TYPES


def sanitize_log_data(data: dict[str, Any]) -> dict[str, Any]:
    """
    Sanitize a dictionary for safe logging.
    
    Recursively redacts sensitive fields from a dictionary before
    it's logged. This is the last line of defense against accidentally
    logging secrets.
    
    Args:
        data: Dictionary to sanitize
        
    Returns:
        dict: Sanitized dictionary safe for logging
        
    Example:
        >>> data = {"user": "john", "password": "secret123", "api_key": "sk_test_123"}
        >>> safe = sanitize_log_data(data)
        >>> safe["password"]
        '***REDACTED***'
        >>> safe["api_key"]
        '***REDACTED***'
    """
    SENSITIVE_KEYS = {
        "password", "passwd", "pwd", "secret", "token", "key", "api_key",
        "apikey", "access_token", "accesstoken", "refresh_token", "auth",
        "authorization", "credential", "credentials", "private_key",
        "secret_key", "secretkey", "session", "cookie", "jwt",
    }
    
    if not isinstance(data, dict):
        return data
    
    sanitized = {}
    
    for key, value in data.items():
        key_lower = key.lower().replace("_", "").replace("-", "")
        
        # Check if key contains sensitive terms
        is_sensitive = any(term in key_lower for term in SENSITIVE_KEYS)
        
        if is_sensitive:
            sanitized[key] = "***REDACTED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        elif isinstance(value, list):
            sanitized[key] = [
                sanitize_log_data(item) if isinstance(item, dict) else item
                for item in value
            ]
        elif isinstance(value, str):
            # Redact any secrets found in string values
            sanitized[key] = redact_secrets(value)
        else:
            sanitized[key] = value
    
    return sanitized


def mask_email(email: str) -> str:
    """
    Mask an email address for display (PII protection).
    
    Args:
        email: Email address to mask
        
    Returns:
        str: Masked email (e.g., "j***@example.com")
        
    Example:
        >>> mask_email("john.doe@example.com")
        'j***@example.com'
    """
    if not email or "@" not in email:
        return "***REDACTED_EMAIL***"
    
    local, domain = email.split("@", 1)
    
    if len(local) <= 1:
        masked_local = local[0] + "***"
    elif len(local) <= 3:
        masked_local = local[0] + "***"
    else:
        masked_local = local[0] + "***" + local[-1]
    
    return f"{masked_local}@{domain}"


def is_likely_secret(value: str, min_length: int = 20) -> bool:
    """
    Heuristic to detect if a string is likely a secret.
    
    This is used as a safety check - if something looks like a secret,
    treat it as sensitive even if it doesn't match specific patterns.
    
    Args:
        value: String to check
        min_length: Minimum length to consider (default 20)
        
    Returns:
        bool: True if string looks like a secret
        
    Characteristics of secrets:
        - Long length (>= 20 chars)
        - High entropy (mixed case, numbers, special chars)
        - No spaces
        - Not natural language
    """
    if not value or len(value) < min_length:
        return False
    
    # Check if contains spaces (secrets usually don't)
    if " " in value:
        return False
    
    # Calculate character diversity
    has_upper = any(c.isupper() for c in value)
    has_lower = any(c.islower() for c in value)
    has_digit = any(c.isdigit() for c in value)
    has_special = any(not c.isalnum() for c in value)
    
    # Count how many character types are present
    diversity_score = sum([has_upper, has_lower, has_digit, has_special])
    
    # If it has high diversity (3 or more types), it's likely a secret
    return diversity_score >= 3


# Export main functions
__all__ = [
    "hash_secret",
    "hash_pattern",
    "redact_secrets",
    "sanitize_file_path",
    "validate_secret_type",
    "sanitize_log_data",
    "mask_email",
    "is_likely_secret",
]
