# GitHub OAuth Authentication - Implementation Guide

## Overview

Complete GitHub OAuth authentication implementation for Gitzen, including both backend (FastAPI) and frontend (React + TypeScript).

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│   Backend    │─────▶│   GitHub    │
│  (React)    │◀─────│  (FastAPI)   │◀─────│    OAuth    │
└─────────────┘      └──────────────┘      └─────────────┘
      │                      │
      │                      ▼
      │              ┌──────────────┐
      └─────────────▶│  PostgreSQL  │
                     └──────────────┘
```

## Backend Implementation (GITZ-17)

### Files Created

#### 1. **Auth Router** (`backend/app/routers/auth.py`)
- `GET /api/v1/auth/login` - Initiate GitHub OAuth
- `GET /api/v1/auth/callback` - Handle OAuth callback
- `GET /api/v1/auth/me` - Get current user (protected)
- `POST /api/v1/auth/logout` - Logout user
- `POST /api/v1/auth/refresh` - Refresh JWT token

#### 2. **JWT Utilities** (`backend/app/utils/auth.py`)
- `create_access_token()` - Generate JWT tokens
- `decode_access_token()` - Validate and decode tokens
- `hash_access_token()` - SHA-256 hashing for storage
- `verify_token_hash()` - Verify token against hash

#### 3. **Auth Dependencies** (`backend/app/dependencies/auth.py`)
- `get_current_user` - Main authentication dependency
- `get_current_active_user` - Ensure user is active
- `get_optional_user` - Optional authentication

### Configuration

**Environment Variables** (`.env`):
```bash
# GitHub OAuth
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
GITHUB_REDIRECT_URI=http://localhost:8000/api/v1/auth/callback

# JWT
SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours
```

### Security Features

✅ **CSRF Protection** - OAuth state parameter  
✅ **HTTP-only Cookies** - XSS protection  
✅ **Token Hashing** - SHA-256 before database storage  
✅ **JWT Validation** - Signature and expiration checks  
✅ **Secure Cookies** - HTTPS in production  

## Frontend Implementation (GITZ-18)

### Files Created

#### 1. **Pages**
- `LoginPage.tsx` - GitHub OAuth login UI
- `CallbackPage.tsx` - OAuth callback handler
- `DashboardPage.tsx` - Protected dashboard with user profile

#### 2. **Components**
- `ProtectedRoute.tsx` - Route guard for authentication

#### 3. **Services & State**
- `lib/api-client.ts` - Axios configuration with interceptors
- `services/auth.service.ts` - Auth API calls
- `store/auth.store.ts` - Zustand state management

### Configuration

**Environment Variables** (`.env`):
```bash
VITE_API_URL=http://localhost:8000
VITE_API_PREFIX=/api/v1
VITE_APP_NAME=Gitzen
VITE_APP_ENV=development
```

### Features

✅ **Automatic Token Refresh** - 401 triggers refresh  
✅ **State Persistence** - localStorage for user data  
✅ **Loading States** - Spinners during auth checks  
✅ **Error Handling** - User-friendly error messages  
✅ **Responsive Design** - Tailwind CSS styling  

## Setup Instructions

### 1. Register GitHub OAuth App

1. Go to https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in details:
   - **Application name**: Gitzen (or your choice)
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: `http://localhost:8000/api/v1/auth/callback`
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env and add:
# GITHUB_CLIENT_ID=your_client_id
# GITHUB_CLIENT_SECRET=your_client_secret
# Generate a strong SECRET_KEY (32+ characters)
```

### 3. Configure Frontend

```bash
cd frontend
cp .env.example .env
# Edit .env and verify:
# VITE_API_URL=http://localhost:8000
# VITE_API_PREFIX=/api/v1
```

### 4. Start Services

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Terminal 3 - Database (if not using Docker):**
```bash
docker run -d \
  --name gitzen-postgres \
  -e POSTGRES_USER=gitzen \
  -e POSTGRES_PASSWORD=gitzen_dev_password \
  -e POSTGRES_DB=gitzen \
  -p 5432:5432 \
  postgres:15-alpine
```

## Testing the Flow

### 1. Visit Login Page
```
http://localhost:3000/login
```

### 2. Click "Sign in with GitHub"
- Redirects to GitHub authorization page
- You'll be asked to authorize the app
- After authorization, redirects back to callback

### 3. Callback Processing
```
http://localhost:8000/api/v1/auth/callback?code=...&state=...
```
- Backend exchanges code for access token
- Fetches user profile from GitHub
- Creates/updates user in database
- Generates JWT token
- Sets HTTP-only cookie
- Redirects to frontend with token

### 4. Dashboard
```
http://localhost:3000/dashboard
```
- Shows user profile information
- Displays avatar, username, email, role
- Logout button to clear session

## API Endpoints

### Public Endpoints

**GET** `/api/v1/auth/login`  
Initiates GitHub OAuth flow

**GET** `/api/v1/auth/callback?code=...&state=...`  
Handles OAuth callback

### Protected Endpoints (Require Authentication)

**GET** `/api/v1/auth/me`  
Returns current user profile

**POST** `/api/v1/auth/logout`  
Clears session cookie

**POST** `/api/v1/auth/refresh`  
Refreshes JWT token

### Authentication Header

```bash
# Option 1: Cookie (automatic with withCredentials)
curl -b "access_token=<token>" http://localhost:8000/api/v1/auth/me

# Option 2: Authorization header
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/v1/auth/me
```

## Flow Diagrams

### Login Flow

```
User                Frontend              Backend              GitHub
 │                     │                     │                     │
 │  Click "Login"      │                     │                     │
 │────────────────────>│                     │                     │
 │                     │  GET /auth/login    │                     │
 │                     │────────────────────>│                     │
 │                     │                     │  Redirect to OAuth  │
 │                     │                     │────────────────────>│
 │                     │                     │                     │
 │                  Authorize App            │                     │
 │<────────────────────────────────────────────────────────────────│
 │                     │                     │                     │
 │                     │  GET /callback      │                     │
 │                     │────────────────────>│                     │
 │                     │                     │  Exchange code      │
 │                     │                     │────────────────────>│
 │                     │                     │  Access token       │
 │                     │                     │<────────────────────│
 │                     │                     │                     │
 │                     │  JWT + Cookie       │                     │
 │                     │<────────────────────│                     │
 │  Redirect /dashboard│                     │                     │
 │<────────────────────│                     │                     │
```

### Protected Route Access

```
Frontend              Backend              Database
   │                     │                     │
   │  GET /auth/me       │                     │
   │────────────────────>│                     │
   │  (with cookie)      │  Validate JWT       │
   │                     │────────┐            │
   │                     │        │            │
   │                     │<───────┘            │
   │                     │  Query user         │
   │                     │────────────────────>│
   │                     │  User data          │
   │                     │<────────────────────│
   │  User profile       │                     │
   │<────────────────────│                     │
```

## Troubleshooting

### Backend Issues

**"GitHub OAuth not configured"**
- Ensure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in `.env`

**"Invalid state parameter"**
- OAuth state expired (>10 minutes) - try logging in again
- For production, move state storage to Redis

**"Could not validate credentials"**
- JWT token invalid or expired
- Check `SECRET_KEY` is consistent
- Try logging out and back in

### Frontend Issues

**"Failed to authenticate"**
- Check backend is running on port 8000
- Verify `VITE_API_URL` in frontend `.env`
- Check browser console for errors

**Redirect loop**
- Clear localStorage: `localStorage.clear()`
- Clear cookies for localhost
- Restart both servers

**CORS errors**
- Backend `CORS_ORIGINS` must include `http://localhost:3000`
- Check backend logs for CORS configuration

## Security Best Practices

### Production Checklist

- [ ] Generate strong `SECRET_KEY` (32+ characters, random)
- [ ] Enable HTTPS (secure cookies)
- [ ] Set `APP_ENV=production` in backend
- [ ] Update GitHub OAuth callback to production URL
- [ ] Move OAuth state storage to Redis
- [ ] Enable rate limiting on auth endpoints
- [ ] Add token rotation/refresh strategy
- [ ] Implement session management beyond JWT
- [ ] Add audit logging for authentication events
- [ ] Configure proper CORS origins
- [ ] Use environment-specific configuration
- [ ] Enable HSTS headers
- [ ] Implement CSP headers
- [ ] Add brute-force protection

## Testing

### Manual Testing Checklist

- [ ] Login redirects to GitHub
- [ ] OAuth authorization works
- [ ] Callback processes successfully
- [ ] JWT token is set in cookie
- [ ] Protected routes require auth
- [ ] Logout clears session
- [ ] Token refresh works on 401
- [ ] User profile displays correctly
- [ ] Unauthenticated access redirects to login
- [ ] Error messages display properly

### Automated Testing

```bash
# Backend tests
cd backend
pytest tests/test_auth.py

# Frontend tests
cd frontend
npm test
```

## Next Steps

- [ ] **GITZ-19**: Implement session management with Redis
- [ ] **GITZ-20**: Build user profile and settings page
- [ ] **GITZ-21**: Build findings list page with filtering
- [ ] Add Remember Me functionality
- [ ] Implement token blacklisting
- [ ] Add email notifications
- [ ] Multi-factor authentication (MFA)

## Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [React Router Documentation](https://reactrouter.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## Support

For issues or questions:
- Check backend logs: `tail -f backend/logs/app.log`
- Check frontend console: Browser DevTools > Console
- Review API documentation: http://localhost:8000/docs

---

**Last Updated**: October 14, 2025  
**Version**: 0.1.0  
**Story Points**: 16 (8 backend + 8 frontend)
