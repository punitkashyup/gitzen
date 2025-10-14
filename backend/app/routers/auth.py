"""
Authentication Router

GitHub OAuth authentication endpoints.
"""
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
import httpx

from app.database import get_db
from app.config import settings
from app.models.user import User
from app.utils.auth import create_access_token, hash_access_token
from app.dependencies.auth import get_current_user, get_optional_user
from pydantic import BaseModel


router = APIRouter(prefix="/auth", tags=["authentication"])


# Pydantic Schemas
class UserResponse(BaseModel):
    """User profile response"""
    id: str
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    created_at: datetime
    last_login_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    """Login response with token"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


# In-memory state storage for OAuth (use Redis in production)
oauth_states = {}


@router.get("/login")
async def github_login(redirect_uri: Optional[str] = None):
    """
    Initiate GitHub OAuth login flow.
    
    **Flow:**
    1. Generate random state for CSRF protection
    2. Redirect user to GitHub authorization URL
    3. GitHub redirects back to /auth/callback
    
    **Query Parameters:**
    - redirect_uri: Optional URL to redirect to after login
    
    **Returns:**
    Redirect to GitHub OAuth authorization page
    
    **Note:**
    Make sure to configure GITHUB_CLIENT_ID in environment variables.
    """
    if not settings.GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured"
        )
    
    # Generate state for CSRF protection
    state = secrets.token_urlsafe(32)
    oauth_states[state] = {
        "created_at": datetime.utcnow(),
        "redirect_uri": redirect_uri
    }
    
    # Clean up old states (older than 10 minutes)
    cutoff = datetime.utcnow() - timedelta(minutes=10)
    oauth_states_copy = dict(oauth_states)
    for key, value in oauth_states_copy.items():
        if value["created_at"] < cutoff:
            del oauth_states[key]
    
    # Build GitHub authorization URL
    params = {
        "client_id": settings.GITHUB_CLIENT_ID,
        "redirect_uri": settings.GITHUB_REDIRECT_URI or "http://localhost:8000/api/v1/auth/callback",
        "scope": "read:user user:email",
        "state": state
    }
    
    github_auth_url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    
    return RedirectResponse(url=github_auth_url)


@router.get("/callback")
async def github_callback(
    code: str,
    state: str,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle GitHub OAuth callback.
    
    **Flow:**
    1. Verify state parameter (CSRF protection)
    2. Exchange authorization code for access token
    3. Fetch user profile from GitHub API
    4. Create/update user in database
    5. Generate JWT token
    6. Set HTTP-only cookie
    
    **Query Parameters:**
    - code: Authorization code from GitHub
    - state: CSRF protection state
    
    **Returns:**
    User profile and JWT token
    
    **Errors:**
    - 400: Invalid state or OAuth error
    - 500: GitHub API error
    """
    # Verify state
    if state not in oauth_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter"
        )
    
    redirect_uri = oauth_states[state].get("redirect_uri")
    del oauth_states[state]
    
    if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GitHub OAuth not configured"
        )
    
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI or "http://localhost:8000/api/v1/auth/callback"
            }
        )
        
        if token_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange code for token"
            )
        
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"GitHub OAuth error: {token_data.get('error_description', 'Unknown error')}"
            )
        
        access_token = token_data.get("access_token")
        
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No access token received from GitHub"
            )
        
        # Fetch user profile from GitHub
        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/json"
            }
        )
        
        if user_response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to fetch user profile from GitHub"
            )
        
        github_user = user_response.json()
        
        # Fetch user email if not in profile
        email = github_user.get("email")
        if not email:
            emails_response = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            if emails_response.status_code == 200:
                emails = emails_response.json()
                primary_email = next((e["email"] for e in emails if e.get("primary")), None)
                if primary_email:
                    email = primary_email
    
    # Create or update user in database
    github_id = github_user["id"]
    username = github_user["login"]
    avatar_url = github_user.get("avatar_url")
    
    # Check if user exists
    result = await db.execute(
        select(User).where(User.github_id == github_id, User.deleted_at.is_(None))
    )
    user = result.scalar_one_or_none()
    
    now = datetime.utcnow()
    token_hash = hash_access_token(access_token)
    
    if user:
        # Update existing user
        await db.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                username=username,
                email=email,
                avatar_url=avatar_url,
                access_token_hash=token_hash,
                last_login_at=now,
                updated_at=now
            )
        )
    else:
        # Create new user
        user = User(
            github_id=github_id,
            username=username,
            email=email,
            avatar_url=avatar_url,
            access_token_hash=token_hash,
            role="user",
            is_active=True,
            last_login_at=now
        )
        db.add(user)
    
    await db.commit()
    await db.refresh(user)
    
    # Generate JWT token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    # Set HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=settings.APP_ENV == "production",  # HTTPS only in production
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    # Prepare response
    user_response = UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        role=user.role,
        created_at=user.created_at,
        last_login_at=user.last_login_at
    )
    
    login_response = LoginResponse(
        access_token=jwt_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_response
    )
    
    # Redirect to frontend if redirect_uri provided
    if redirect_uri:
        redirect_url = f"{redirect_uri}?token={jwt_token}"
        return RedirectResponse(url=redirect_url)
    
    return login_response


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user: User = Depends(get_current_user)):
    """
    Get current authenticated user profile.
    
    **Authentication:** Required (JWT token in cookie or Authorization header)
    
    **Returns:**
    Current user profile information
    
    **Example:**
    ```
    GET /api/v1/auth/me
    Cookie: access_token=eyJ...
    ```
    """
    return UserResponse(
        id=str(user.id),
        username=user.username,
        email=user.email,
        avatar_url=user.avatar_url,
        role=user.role,
        created_at=user.created_at,
        last_login_at=user.last_login_at
    )


@router.post("/logout")
async def logout(response: Response, user: Optional[User] = Depends(get_optional_user)):
    """
    Logout current user.
    
    **Flow:**
    1. Clear access_token cookie
    2. (Optional) Invalidate token in Redis cache
    
    **Authentication:** Optional (works even if not authenticated)
    
    **Returns:**
    Success message
    
    **Example:**
    ```
    POST /api/v1/auth/logout
    Cookie: access_token=eyJ...
    ```
    """
    # Clear cookie
    response.delete_cookie(key="access_token")
    
    return {"message": "Successfully logged out"}


@router.post("/refresh")
async def refresh_token(
    response: Response,
    user: User = Depends(get_current_user)
):
    """
    Refresh JWT token (extend session).
    
    **Authentication:** Required
    
    **Returns:**
    New JWT token with extended expiration
    
    **Example:**
    ```
    POST /api/v1/auth/refresh
    Cookie: access_token=eyJ...
    ```
    """
    # Generate new token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    jwt_token = create_access_token(
        data={"sub": str(user.id), "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )
    
    # Update cookie
    response.set_cookie(
        key="access_token",
        value=jwt_token,
        httponly=True,
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

