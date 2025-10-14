"""
Authentication Utilities

JWT token generation, validation, OAuth helpers, and password management.
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import re

from jose import JWTError, jwt
from fastapi import HTTPException, status
import bcrypt

from app.config import settings


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode in the token
        expires_delta: Optional expiration time delta (default: 24 hours)
        
    Returns:
        Encoded JWT token string
        
    Example:
        >>> token = create_access_token({"sub": "user_id_123", "username": "octocat"})
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow()
    })
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT access token.
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Decoded token payload
        
    Raises:
        HTTPException: If token is invalid or expired
        
    Example:
        >>> payload = decode_access_token(token)
        >>> user_id = payload.get("sub")
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def hash_access_token(access_token: str) -> str:
    """
    Create a SHA-256 hash of an access token for secure storage.
    
    Args:
        access_token: GitHub OAuth access token
        
    Returns:
        SHA-256 hash of the token (64 hex characters)
        
    Note:
        We hash tokens before storing them in the database to prevent
        token leakage if the database is compromised.
        
    Example:
        >>> token_hash = hash_access_token("gho_abc123...")
    """
    return hashlib.sha256(access_token.encode()).hexdigest()


def verify_token_hash(access_token: str, token_hash: str) -> bool:
    """
    Verify that an access token matches its stored hash.
    
    Args:
        access_token: GitHub OAuth access token to verify
        token_hash: Stored SHA-256 hash
        
    Returns:
        True if token matches hash, False otherwise
        
    Example:
        >>> is_valid = verify_token_hash("gho_abc123...", stored_hash)
    """
    return hash_access_token(access_token) == token_hash


# ============================================================================
# Password Management
# ============================================================================

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt with cost factor 12.
    
    Args:
        password: Plain text password
        
    Returns:
        Bcrypt hashed password string
        
    Security:
        - Uses bcrypt with cost factor 12 (2^12 iterations)
        - Includes salt automatically
        - Resistant to rainbow table attacks
        
    Example:
        >>> hashed = hash_password("MySecurePassword123!")
    """
    # Generate salt and hash password
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its bcrypt hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Bcrypt hashed password from database
        
    Returns:
        True if password matches hash, False otherwise
        
    Security:
        - Constant-time comparison
        - Resistant to timing attacks
        
    Example:
        >>> is_valid = verify_password("MyPassword123!", user.password_hash)
    """
    try:
        return bcrypt.checkpw(
            plain_password.encode('utf-8'),
            hashed_password.encode('utf-8')
        )
    except (ValueError, AttributeError):
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """
    Validate password meets security requirements.
    
    Requirements:
        - Minimum 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one number
        - At least one special character (optional but recommended)
    
    Args:
        password: Password string to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        
    Example:
        >>> is_valid, error = validate_password_strength("Weak")
        >>> if not is_valid:
        ...     print(error)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one number"
    
    # Optional: Check for special characters (recommended but not required)
    # if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
    #     return False, "Password must contain at least one special character"
    
    return True, ""


def validate_email(email: str) -> tuple[bool, str]:
    """
    Validate email address format.
    
    Uses a simplified RFC 5322 pattern for practical email validation.
    
    Args:
        email: Email address to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        
    Example:
        >>> is_valid, error = validate_email("user@example.com")
    """
    # Basic email pattern (simplified RFC 5322)
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not email or len(email) > 255:
        return False, "Email address is required and must be less than 255 characters"
    
    if not re.match(pattern, email):
        return False, "Invalid email address format"
    
    return True, ""


def validate_username(username: str) -> tuple[bool, str]:
    """
    Validate username format.
    
    Requirements:
        - 3-30 characters
        - Alphanumeric, underscores, and hyphens only
        - Must start with alphanumeric
        - No consecutive special characters
    
    Args:
        username: Username to validate
        
    Returns:
        Tuple of (is_valid, error_message)
        
    Example:
        >>> is_valid, error = validate_username("john_doe")
    """
    if not username or len(username) < 3:
        return False, "Username must be at least 3 characters long"
    
    if len(username) > 30:
        return False, "Username must be less than 30 characters"
    
    # Must start with alphanumeric
    if not re.match(r'^[a-zA-Z0-9]', username):
        return False, "Username must start with a letter or number"
    
    # Only alphanumeric, underscore, and hyphen allowed
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        return False, "Username can only contain letters, numbers, underscores, and hyphens"
    
    # No consecutive special characters
    if re.search(r'[_-]{2,}', username):
        return False, "Username cannot contain consecutive underscores or hyphens"
    
    return True, ""


