"""
Authentication Utilities

JWT token generation, validation, and OAuth helper functions.
"""
from datetime import datetime, timedelta
from typing import Optional
import hashlib

from jose import JWTError, jwt
from fastapi import HTTPException, status

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

