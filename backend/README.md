# Gitzen Backend API

Privacy-first Git Secret Detection & Cleanup Tool - REST API Backend

## 🚀 Quick Start

### Prerequisites

- Python 3.11+ (tested with Python 3.14)
- PostgreSQL 15+ (for GITZ-40)
- Redis 5+ (for GITZ-34)

### Installation

1. **Create Virtual Environment**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install Dependencies**

```bash
pip install --upgrade pip
pip install fastapi 'uvicorn[standard]' pydantic pydantic-settings \
    sqlalchemy alembic asyncpg redis 'python-jose[cryptography]' \
    'passlib[bcrypt]' python-multipart python-json-logger \
    pytest pytest-asyncio pytest-cov httpx
```

3. **Configure Environment**

Copy `.env.example` to `.env` and update values:

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Run Development Server**

```bash
# Set PYTHONPATH and start uvicorn
PYTHONPATH=$(pwd) uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: http://localhost:8000
- Interactive Docs (Swagger): http://localhost:8000/docs
- Alternative Docs (ReDoc): http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/openapi.json

## 📁 Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Pydantic Settings configuration
│   ├── logging_config.py    # Structured JSON logging setup
│   ├── exceptions.py        # Custom exception classes & handlers
│   ├── api/                 # API routes (to be created in GITZ-42)
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   ├── models/              # SQLAlchemy models (GITZ-40)
│   ├── schemas/             # Pydantic schemas (GITZ-41)
│   ├── crud/                # Database CRUD operations
│   └── utils/               # Utility functions
├── tests/                   # Test suite
├── alembic/                 # Database migrations (GITZ-40)
├── .env                     # Environment configuration
├── .env.example             # Example environment file
├── requirements.txt         # Python dependencies (alternative to Poetry)
├── pyproject.toml           # Poetry configuration
└── README.md                # This file
```

## 🔧 Configuration

All configuration is managed through environment variables via Pydantic Settings.

### Key Environment Variables

```bash
# Application
APP_NAME=Gitzen
APP_VERSION=0.1.0
APP_ENV=development
DEBUG=true

# API Server
API_HOST=0.0.0.0
API_PORT=8000
API_PREFIX=/api/v1

# CORS (comma-separated origins)
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
CORS_ALLOW_CREDENTIALS=true

# Database (PostgreSQL - for GITZ-40)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gitzen
DB_USER=gitzen
DB_PASSWORD=your_password

# Redis (for GITZ-34)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# Security
SECRET_KEY=your-secret-key-here-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json  # or "plain" for development
```

## 🏗️ Architecture

### Middleware Stack

1. **Request Logging Middleware** - Logs all requests with timing
2. **GZip Compression** - Compresses responses > 1KB
3. **CORS Middleware** - Configurable cross-origin support

### Error Handling

Custom exception handlers for:
- `GitzenException` - Base application exception
- `ResourceNotFoundError` - 404 errors
- `UnauthorizedError` - 401 authentication errors
- `ForbiddenError` - 403 authorization errors
- `ValidationError` - 422 validation errors
- `ConflictError` - 409 conflict errors
- `RequestValidationError` - Pydantic validation failures
- Generic `Exception` - Catch-all with safe error messages

### Logging

- **Development**: Plain text logs to console
- **Production**: Structured JSON logs with:
  - Timestamp
  - Log level
  - Logger name
  - Message
  - File path and line number
  - Extra context (method, path, duration, etc.)

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_main.py

# Run with verbose output
pytest -v
```

## 📊 API Endpoints

### Health & Status

- `GET /health` - Health check endpoint
  - Returns: Service status, version, environment

- `GET /` - API root with navigation
  - Returns: Welcome message, documentation links

### API v1 (Placeholder - to be implemented)

- `GET /api/v1/findings` - List findings (GITZ-42)
- `GET /api/v1/repositories` - List repositories
- `POST /api/v1/scans` - Submit scan results
- `GET /api/v1/statistics` - Get metrics

## 🔐 Security Features

- **Privacy-First**: No actual secrets stored (GITZ-41)
- **SHA-256 Hashing**: All sensitive data hashed
- **JWT Authentication**: Secure token-based auth
- **CORS Protection**: Configurable origin validation
- **Input Validation**: Pydantic schema validation
- **Safe Error Messages**: No internal details exposed in production

## 🐳 Docker Support

Run with Docker Compose (from project root):

```bash
docker-compose up -d backend
```

## 📝 Development Guidelines

### Adding New Endpoints

1. Create endpoint in `app/api/v1/endpoints/`
2. Add route to `app/api/v1/router.py`
3. Register router in `app/main.py`
4. Add tests in `tests/api/v1/test_[endpoint].py`

### Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Code Style

- Follow PEP 8
- Use type hints
- Document with docstrings
- Keep functions small and focused
- Write tests for new features

## 🚧 Sprint Progress

### Sprint 2: API Backend Development

- ✅ **GITZ-16**: Set up REST API server with FastAPI (13 pts)
  - FastAPI application with health check
  - Pydantic Settings configuration
  - Structured JSON logging
  - Custom exception handling
  - CORS, GZip, request logging middleware
  - OpenAPI documentation (Swagger & ReDoc)
  
- 🔄 **GITZ-40**: Design and implement database schema (13 pts)
  - Coming next: PostgreSQL schema with Alembic
  
- ⏳ **GITZ-41**: Implement privacy-safe data validation (8 pts)
  - Coming: SHA-256 hashing, input validation
  
- ⏳ **GITZ-42**: Build findings query API endpoints (13 pts)
  - Coming: GET /api/findings, GET /api/findings/:id, GET /api/statistics

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Add tests
4. Run test suite
5. Submit pull request

## 📄 License

[Your License Here]

## 🔗 Related Documentation

- [Project README](../README.md)
- [Sprint 1 Summary](../docs/sprints/SPRINT_1_SUMMARY.md)
- [GitHub Action README](../action/README.md)
- [Frontend README](../frontend/README.md)
