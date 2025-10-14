"""
Authentication Dependencies

FastAPI dependencies for user authentication and authorization.
"""
from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.utils.auth import decode_access_token


# HTTP Bearer token scheme (extracts token from Authorization header)
security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> User:
    """
    Get the currently authenticated user from JWT token.
    
    This dependency can be used in route handlers to require authentication:
    
    ```python
    @router.get("/protected")
    async def protected_route(user: User = Depends(get_current_user)):
        return {"message": f"Hello {user.username}"}
    ```
    
    Args:
        request: FastAPI request object (to check cookies)
        db: Database session
        credentials: Bearer token from Authorization header
        
    Returns:
        User object if authenticated
        
    Raises:
        HTTPException 401: If no token found or token is invalid
        HTTPException 404: If user not found in database
        HTTPException 403: If user account is inactive
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try to get token from Authorization header first
    token = None
    if credentials:
        token = credentials.credentials
    
    # Fall back to cookie if no Authorization header
    if not token:
        token = request.cookies.get("access_token")
    
    if not token:
        raise credentials_exception
    
    # Decode and validate token
    payload = decode_access_token(token)
    
    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Fetch user from database
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise credentials_exception
    
    result = await db.execute(
        select(User).where(User.id == user_uuid, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current active user (alias for get_current_user).
    
    This is a convenience dependency that ensures the user is active.
    Since get_current_user already checks is_active, this is just an alias.
    
    Args:
        current_user: User from get_current_user dependency
        
    Returns:
        Active user object
    """
    return current_user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> Optional[User]:
    """
    Get the current user if authenticated, otherwise None.
    
    This dependency is useful for endpoints that support both authenticated
    and unauthenticated access.
    
    Args:
        request: FastAPI request object
        db: Database session
        credentials: Optional bearer token
        
    Returns:
        User object if authenticated, None otherwise
    """
    try:
        return await get_current_user(request, db, credentials)
    except HTTPException:
        return None

