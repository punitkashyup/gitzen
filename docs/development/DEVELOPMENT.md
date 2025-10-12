# 🚀 Gitzen Development Guide

Complete guide for setting up and running Gitzen locally using Docker.

---

## 📋 Prerequisites

- **Docker Desktop** 20.10+ ([Download](https://www.docker.com/products/docker-desktop/))
- **Docker Compose** v2.0+ (included with Docker Desktop)
- **Git** 2.0+
- **(Optional)** GitHub OAuth App for authentication

---

## 🏃 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/punitkashyup/gitzen.git
cd gitzen
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and update values (optional for basic setup)
# The default values work for local development
```

### 3. Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# Or run in foreground to see logs
docker-compose up
```

### 4. Verify Services

**Frontend Dashboard:**
- URL: http://localhost:3000
- Should show "Gitzen" welcome page

**API Backend:**
- URL: http://localhost:8000
- Docs: http://localhost:8000/docs (Swagger UI)
- Health: http://localhost:8000/health

**Database & Cache:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

---

## 🎯 Development Workflow

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Stop Services

```bash
# Stop all services (keeps containers)
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove everything including volumes (⚠️ DATA LOSS)
docker-compose down -v
```

### Restart Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Rebuild After Changes

```bash
# Rebuild and restart all services
docker-compose up -d --build

# Rebuild specific service
docker-compose up -d --build backend
```

### Access Service Shells

```bash
# Backend shell
docker-compose exec backend /bin/bash

# Frontend shell
docker-compose exec frontend /bin/sh

# PostgreSQL shell
docker-compose exec postgres psql -U gitzen -d gitzen

# Redis CLI
docker-compose exec redis redis-cli -a gitzen_redis_password
```

---

## 🔧 Hot Reload

Both frontend and backend support hot-reload in development mode:

### Backend (FastAPI)
- Edit files in `backend/app/**/*.py`
- Changes are automatically detected
- Server restarts automatically
- Check logs: `docker-compose logs -f backend`

### Frontend (React + Vite)
- Edit files in `frontend/src/**/*`
- Changes reflect immediately in browser
- No page refresh needed (HMR - Hot Module Replacement)
- Check logs: `docker-compose logs -f frontend`

---

## 🗄️ Database Management

### Run Migrations (Once Backend is Implemented)

```bash
# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "Description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback migration
docker-compose exec backend alembic downgrade -1
```

### Access Database

```bash
# Using psql
docker-compose exec postgres psql -U gitzen -d gitzen

# Common queries
SELECT * FROM pg_tables WHERE schemaname = 'public';
\dt  -- List tables
\d table_name  -- Describe table
```

### Reset Database

```bash
# Stop services
docker-compose down

# Remove volume
docker volume rm gitzen-postgres-data

# Restart (will recreate with init script)
docker-compose up -d postgres
```

---

## 🧪 Running Tests

### Backend Tests

```bash
# Run all tests
docker-compose exec backend pytest

# Run with coverage
docker-compose exec backend pytest --cov=app --cov-report=html

# Run specific test file
docker-compose exec backend pytest tests/test_api.py

# Run with verbose output
docker-compose exec backend pytest -v
```

### Frontend Tests

```bash
# Run tests (once implemented)
docker-compose exec frontend npm test

# Run with coverage
docker-compose exec frontend npm test -- --coverage
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8000  # Backend
lsof -i :3000  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill the process or change ports in .env
```

### Services Won't Start

```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Database Connection Errors

```bash
# Verify postgres is healthy
docker-compose ps postgres

# Check postgres logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U gitzen
```

### Frontend Can't Connect to API

1. Check CORS settings in `.env`
2. Verify backend is running: `curl http://localhost:8000/health`
3. Check `VITE_API_URL` in frontend environment
4. View browser console for errors

---

## 📦 Installing Dependencies

### Backend (Python)

```bash
# Add new package
docker-compose exec backend poetry add package-name

# Add dev dependency
docker-compose exec backend poetry add --group dev package-name

# Update poetry.lock
docker-compose exec backend poetry lock

# Rebuild to install
docker-compose up -d --build backend
```

### Frontend (Node.js)

```bash
# Add new package
docker-compose exec frontend npm install package-name

# Add dev dependency
docker-compose exec frontend npm install --save-dev package-name

# Rebuild to install (if needed)
docker-compose up -d --build frontend
```

---

## 🔐 GitHub OAuth Setup (Optional)

### 1. Create GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name:** Gitzen Local Dev
   - **Homepage URL:** http://localhost:3000
   - **Callback URL:** http://localhost:8000/auth/github/callback
4. Copy **Client ID** and **Client Secret**

### 2. Update .env

```bash
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```

### 3. Restart Backend

```bash
docker-compose restart backend
```

---

## 📊 Monitoring & Health Checks

### Health Check Endpoints

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health (via Nginx)
curl http://localhost:3000/health

# Check all services
docker-compose ps
```

### Service Status

All services include health checks that run every 10 seconds:
- ✅ **healthy** - Service is running correctly
- 🔄 **starting** - Service is starting up
- ❌ **unhealthy** - Service has issues

---

## 🧹 Cleanup

### Remove Development Data

```bash
# Stop and remove containers, networks
docker-compose down

# Also remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### Clean Docker System

```bash
# Remove unused containers, networks, images
docker system prune

# Remove everything including volumes
docker system prune -a --volumes
```

---

## 📚 Project Structure

```
gitzen/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── main.py         # Application entry point
│   │   ├── api/            # API routes (to be created)
│   │   ├── models/         # Database models (to be created)
│   │   └── services/       # Business logic (to be created)
│   ├── Dockerfile          # Multi-stage Docker build
│   ├── pyproject.toml      # Python dependencies
│   └── poetry.lock         # Locked dependencies
│
├── frontend/                # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx         # Main component
│   │   ├── main.tsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── Dockerfile          # Multi-stage Docker build
│   ├── package.json        # Node dependencies
│   └── vite.config.ts      # Vite configuration
│
├── scripts/
│   └── init-db.sql         # Database initialization
│
├── docker-compose.yml       # Services orchestration
├── .env.example            # Environment variables template
└── .gitignore              # Git ignore rules
```

---

## 🎯 Current Sprint: Sprint 0

### GITZ-10: Set up Docker-based development environment ✅
**Status:** In Progress  
**Story Points:** 5

**Acceptance Criteria:**
- [x] All services start with `docker-compose up`
- [x] PostgreSQL 15+ running
- [x] Redis 7+ running
- [x] Backend API accessible at http://localhost:8000
- [x] Frontend dashboard at http://localhost:3000
- [x] Hot reload working for backend and frontend
- [x] Health checks configured
- [x] .env.example documented

### GITZ-11: Configure CI/CD pipeline with GitHub Actions
**Status:** To Do  
**Story Points:** 8

---

## 💡 Tips

- **Use `docker-compose logs -f`** to watch logs in real-time
- **Enable BuildKit** for faster builds: `export DOCKER_BUILDKIT=1`
- **Use volumes** for faster rebuilds (code is mounted, not copied)
- **Check `.gitignore`** before committing (don't commit .env or node_modules)
- **Run tests frequently** to catch issues early
- **Use health checks** to verify services are ready

---

## 📞 Need Help?

- **Jira Board:** https://geekfleet-dev.atlassian.net/jira/software/projects/GITZ
- **GitHub Issues:** https://github.com/punitkashyup/gitzen/issues
- **Documentation:** Check `PROJECT_DOCUMENTATION.md`

---

**Happy Coding! 🚀**

*Last Updated: October 12, 2025 - Sprint 0*
