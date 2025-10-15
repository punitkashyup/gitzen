"""
GitHub Router

GitHub API integration endpoints for fetching user profile and repository data.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.logging_config import get_logger
from pydantic import BaseModel


router = APIRouter(prefix="/github", tags=["github"])
logger = get_logger(__name__)


# Pydantic Schemas
class GitHubProfile(BaseModel):
    """GitHub user profile"""
    name: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    company: Optional[str] = None
    blog: Optional[str] = None
    public_repos: int
    followers: int
    following: int
    html_url: str
    avatar_url: str
    login: str


class GitHubRepository(BaseModel):
    """GitHub repository"""
    id: int
    name: str
    full_name: str
    description: Optional[str] = None
    private: bool
    html_url: str
    language: Optional[str] = None
    stargazers_count: int
    forks_count: int
    updated_at: str
    pushed_at: Optional[str] = None


async def get_github_client(user: User) -> httpx.AsyncClient:
    """Create authenticated GitHub API client"""
    # For now, return mock data since we're storing hashed tokens
    # TODO: Implement proper token storage and retrieval
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="GitHub API integration is being implemented. Mock data will be returned in the frontend."
    )


@router.get("/profile", response_model=GitHubProfile)
async def get_github_profile(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get GitHub profile for the authenticated user.
    
    **Note:** Currently returns mock data while GitHub API integration is being implemented.
    
    **Authentication:** Required (GitHub OAuth)
    
    **Returns:**
    GitHub user profile information (mock data)
    """
    logger.info(f"Fetching GitHub profile for user: {user.username}")
    
    # Return mock data for now - TODO: Implement real GitHub API calls
    return GitHubProfile(
        name=f"{user.username.replace('_', ' ').title()}",
        bio="Software developer passionate about security and privacy",
        location="San Francisco, CA",
        company="Tech Corp",
        blog=f"https://{user.username}.dev",
        public_repos=42,
        followers=123,
        following=87,
        html_url=f"https://github.com/{user.username}",
        avatar_url=user.avatar_url or f"https://github.com/{user.username}.png",
        login=user.username
    )


@router.get("/repositories", response_model=List[GitHubRepository])
async def get_github_repositories(
    user: User = Depends(get_current_user),
    per_page: int = 30,
    page: int = 1,
    db: AsyncSession = Depends(get_db)
):
    """
    Get repositories for the authenticated user.
    
    **Note:** Currently returns mock data while GitHub API integration is being implemented.
    
    **Authentication:** Required (GitHub OAuth)
    
    **Query Parameters:**
    - per_page: Number of repositories per page (default: 30, max: 100)
    - page: Page number (default: 1)
    
    **Returns:**
    List of user's GitHub repositories (mock data)
    """
    logger.info(f"Fetching GitHub repositories for user: {user.username}")
    
    # Return mock data for now - TODO: Implement real GitHub API calls
    mock_repos = [
        GitHubRepository(
            id=1,
            name="gitzen",
            full_name=f"{user.username}/gitzen",
            description="Privacy-first Git secret detection and cleanup tool",
            private=False,
            html_url=f"https://github.com/{user.username}/gitzen",
            language="Python",
            stargazers_count=15,
            forks_count=3,
            updated_at="2025-10-14T10:30:00Z",
            pushed_at="2025-10-14T10:30:00Z"
        ),
        GitHubRepository(
            id=2,
            name="my-awesome-app",
            full_name=f"{user.username}/my-awesome-app",
            description="A sample web application",
            private=True,
            html_url=f"https://github.com/{user.username}/my-awesome-app",
            language="TypeScript",
            stargazers_count=8,
            forks_count=1,
            updated_at="2025-10-13T15:20:00Z",
            pushed_at="2025-10-13T15:20:00Z"
        ),
        GitHubRepository(
            id=3,
            name="dotfiles",
            full_name=f"{user.username}/dotfiles",
            description="My personal configuration files",
            private=False,
            html_url=f"https://github.com/{user.username}/dotfiles",
            language="Shell",
            stargazers_count=2,
            forks_count=0,
            updated_at="2025-10-12T09:15:00Z",
            pushed_at="2025-10-12T09:15:00Z"
        )
    ]
    
    # Limit results based on pagination
    per_page = min(per_page, 100)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    
    return mock_repos[start_idx:end_idx]


@router.get("/repository/{repo_name}", response_model=GitHubRepository)
async def get_github_repository(
    repo_name: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get a specific repository by name.
    
    **Authentication:** Required (GitHub OAuth)
    
    **Path Parameters:**
    - repo_name: Name of the repository
    
    **Returns:**
    GitHub repository information
    
    **Errors:**
    - 401: No GitHub access token or invalid token
    - 404: Repository not found
    - 500: GitHub API error
    """
    logger.info(f"Fetching GitHub repository {repo_name} for user: {user.username}")
    
    if user.auth_provider != "github":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not authenticated via GitHub"
        )
    
    try:
        async with await get_github_client(user) as client:
            response = await client.get(f"/repos/{user.username}/{repo_name}")
            
            if response.status_code == 401:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="GitHub access token is invalid. Please re-authenticate."
                )
            elif response.status_code == 404:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Repository '{repo_name}' not found"
                )
            elif response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"GitHub API error: {response.status_code}"
                )
            
            repo = response.json()
            
            return GitHubRepository(
                id=repo.get("id", 0),
                name=repo.get("name", ""),
                full_name=repo.get("full_name", ""),
                description=repo.get("description"),
                private=repo.get("private", False),
                html_url=repo.get("html_url", ""),
                language=repo.get("language"),
                stargazers_count=repo.get("stargazers_count", 0),
                forks_count=repo.get("forks_count", 0),
                updated_at=repo.get("updated_at", ""),
                pushed_at=repo.get("pushed_at")
            )
            
    except httpx.RequestError as e:
        logger.error(f"GitHub API request failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to connect to GitHub API"
        )
    except Exception as e:
        logger.error(f"Unexpected error fetching GitHub repository: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )