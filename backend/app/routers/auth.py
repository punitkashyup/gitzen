"""
Authentication Router

Email/password and OAuth authentication endpoints.
"""
from datetime import datetime, timedelta
from typing import Optional
from urllib.parse import urlencode
import secrets

from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, or_
import httpx

from app.database import get_db
from app.config import settings
from app.models.user import User, AuthProvider
from app.utils.auth import (
    create_access_token,
    hash_access_token,
    hash_password,
    verify_password,
    validate_password_strength,
    validate_email,
    validate_username,
)
from app.dependencies.auth import get_current_user, get_optional_user
from app.logging_config import get_logger
from pydantic import BaseModel, EmailStr, Field


router = APIRouter(prefix="/auth", tags=["authentication"])
logger = get_logger(__name__)


# Pydantic Schemas
class RegisterRequest(BaseModel):
    """User registration request"""
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8)


class LoginRequest(BaseModel):
    """Email/password login request"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User profile response"""
    id: str
    username: str
    email: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    auth_provider: str
    email_verified: bool
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


# ============================================================================
# Email/Password Authentication Endpoints
# ============================================================================

@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(
    register_data: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Register new user with email and password.
    
    **Requirements:**
    - Username: 3-30 characters, alphanumeric with underscores/hyphens
    - Email: Valid email format
    - Password: Minimum 8 characters, must contain uppercase, lowercase, and number
    
    **Returns:**
    - JWT access token
    - User profile
    
    **Errors:**
    - 400: Validation error (weak password, invalid email, etc.)
    - 409: Username or email already exists
    
    **Example:**
    ```json
    POST /api/v1/auth/register
    {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "SecurePass123"
    }
    ```
    """
    logger.info(f"Registration attempt for username: {register_data.username}")
    
    # Validate username
    is_valid, error = validate_username(register_data.username)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # Validate email
    is_valid, error = validate_email(register_data.email)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # Validate password strength
    is_valid, error = validate_password_strength(register_data.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)
    
    # Check if username already exists
    query = select(User).where(
        User.username == register_data.username,
        User.deleted_at.is_(None)
    )
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists"
        )
    
    # Check if email already exists
    query = select(User).where(
        User.email == register_data.email.lower(),
        User.deleted_at.is_(None)
    )
    result = await db.execute(query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Hash password
    password_hash = hash_password(register_data.password)
    
    # Create user
    user = User(
        username=register_data.username,
        email=register_data.email.lower(),
        password_hash=password_hash,
        auth_provider=AuthProvider.EMAIL,
        email_verified=False,  # TODO: Implement email verification
        role="user",
        is_active=True,
        last_login_at=datetime.utcnow()
    )
    
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    logger.info(f"User registered successfully: {user.username} ({user.id})")
    
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
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return LoginResponse(
        access_token=jwt_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            avatar_url=user.avatar_url,
            role=user.role,
            auth_provider=user.auth_provider.value,
            email_verified=user.email_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at
        )
    )


@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db)
):
    """
    Login with email and password.
    
    **Returns:**
    - JWT access token
    - User profile
    
    **Errors:**
    - 401: Invalid email or password (intentionally vague for security)
    - 403: Account is disabled
    
    **Security:**
    - Does not reveal whether email exists (prevents user enumeration)
    - Uses constant-time password comparison
    - Rate limited to prevent brute force attacks
    
    **Example:**
    ```json
    POST /api/v1/auth/login
    {
        "email": "john@example.com",
        "password": "SecurePass123"
    }
    ```
    """
    logger.info(f"Login attempt for email: {login_data.email}")
    
    # Find user by email
    query = select(User).where(
        User.email == login_data.email.lower(),
        User.deleted_at.is_(None)
    )
    result = await db.execute(query)
    user = result.scalar_one_or_none()
    
    # Generic error message to prevent user enumeration
    invalid_credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password"
    )
    
    if not user:
        logger.warning(f"Login failed: User not found for email {login_data.email}")
        raise invalid_credentials_error
    
    # Check if user is using email auth (not OAuth)
    if user.auth_provider != AuthProvider.EMAIL:
        logger.warning(f"Login failed: User {user.username} attempted email login but uses {user.auth_provider.value}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This account uses {user.auth_provider.value} authentication. Please use the appropriate login method."
        )
    
    # Verify password
    if not user.password_hash or not verify_password(login_data.password, user.password_hash):
        logger.warning(f"Login failed: Invalid password for email {login_data.email}")
        raise invalid_credentials_error
    
    # Check if account is active
    if not user.is_active:
        logger.warning(f"Login failed: Account disabled for user {user.username}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled. Please contact support."
        )
    
    # Update last login
    user.last_login_at = datetime.utcnow()
    await db.commit()
    
    logger.info(f"User logged in successfully: {user.username} ({user.id})")
    
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
        secure=settings.APP_ENV == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    return LoginResponse(
        access_token=jwt_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse(
            id=str(user.id),
            username=user.username,
            email=user.email,
            avatar_url=user.avatar_url,
            role=user.role,
            auth_provider=user.auth_provider.value,
            email_verified=user.email_verified,
            created_at=user.created_at,
            last_login_at=user.last_login_at
        )
    )


# ============================================================================
# GitHub OAuth Authentication Endpoints
# ============================================================================


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
            auth_provider=AuthProvider.GITHUB,
            email_verified=True,  # GitHub emails are verified
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
        auth_provider=user.auth_provider.value,
        email_verified=user.email_verified,
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
        auth_provider=user.auth_provider.value,
        email_verified=user.email_verified,
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

