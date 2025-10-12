# CI/CD Pipeline Documentation

## Overview

GitZen uses GitHub Actions for continuous integration and continuous deployment. The CI/CD pipeline automatically tests, validates, and deploys code changes.

## Pipeline Structure

### Workflows

#### 1. **Main CI Pipeline** (`.github/workflows/ci.yml`)

Runs on every pull request and push to `main` or `develop` branches.

**Jobs:**

1. **Backend Tests**
   - Sets up Python 3.11 environment
   - Installs dependencies with pip caching
   - Runs ruff linting
   - Runs mypy type checking
   - Executes pytest with coverage
   - Uploads coverage to Codecov

2. **Frontend Tests**
   - Sets up Node.js 20 environment
   - Installs dependencies with npm caching
   - Runs ESLint linting
   - Runs TypeScript type checking
   - Executes Vitest tests with coverage
   - Builds production bundle
   - Uploads coverage to Codecov

3. **Security Scanning**
   - Runs Trivy vulnerability scanner
   - Executes Bandit security linter for Python
   - Checks for secrets with TruffleHog
   - Uploads results to GitHub Security tab

4. **Code Quality**
   - Runs SonarCloud analysis
   - Checks Black formatting (Python)
   - Checks Prettier formatting (JavaScript/TypeScript)

5. **Docker Build Test**
   - Tests backend Dockerfile build
   - Tests frontend Dockerfile build
   - Validates docker-compose configuration
   - Uses layer caching for faster builds

6. **Integration Tests**
   - Starts all services with docker-compose
   - Validates service health endpoints
   - Runs integration test suite
   - Shows logs on failure

7. **CI Status Check**
   - Aggregates all job statuses
   - Required check for PR merge
   - Fails if any critical job fails

## Running Tests Locally

### Backend Tests

```bash
# Run all tests
cd backend
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_main.py

# Run with verbose output
pytest -v

# Run and show print statements
pytest -s
```

### Frontend Tests

```bash
# Run all tests
cd frontend
npm run test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test

# Run with UI
npm run test:ui
```

### Linting

```bash
# Backend linting
cd backend
ruff check app/
black --check app/

# Frontend linting
cd frontend
npm run lint
npm run format:check
```

### Type Checking

```bash
# Backend type checking
cd backend
mypy app/

# Frontend type checking
cd frontend
npm run type-check
```

## Code Coverage

- **Minimum Coverage:** 80% (recommended)
- **Coverage Reports:** Uploaded to Codecov on every CI run
- **Local Reports:** Generated in `backend/htmlcov` and `frontend/coverage`

### Viewing Coverage Locally

```bash
# Backend
cd backend
pytest --cov=app --cov-report=html
open htmlcov/index.html

# Frontend
cd frontend
npm run test:coverage
open coverage/index.html
```

## Security Scanning

### Trivy (Vulnerability Scanner)
- Scans for vulnerabilities in dependencies and Docker images
- Results uploaded to GitHub Security tab
- Severity levels: CRITICAL, HIGH, MEDIUM

### Bandit (Python Security Linter)
- Scans Python code for security issues
- Checks for common security anti-patterns
- Reports potential vulnerabilities

### TruffleHog (Secret Scanner)
- Scans commits for leaked secrets
- Checks for API keys, tokens, passwords
- Only verified secrets trigger failures

## CI Environment Variables

The following secrets need to be configured in GitHub repository settings:

### Required Secrets
- `SONAR_TOKEN` - SonarCloud authentication token (optional)
- `CODECOV_TOKEN` - Codecov upload token (optional)

### Default Environment Variables
All other variables use sensible defaults from `.env.example`

## Branch Protection Rules

### Main Branch
- Require pull request reviews (1 approver)
- Require status checks to pass:
  - Backend Tests
  - Frontend Tests
  - Docker Build Test
  - Integration Tests
  - CI Status Check
- Require branches to be up to date
- Restrict pushes to main

### Develop Branch
- Require status checks to pass
- Allow direct pushes from maintainers

## Pull Request Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/GITZ-123-description
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Run Tests Locally**
   ```bash
   make test
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "GITZ-123: Description of changes"
   ```

5. **Push to GitHub**
   ```bash
   git push origin feature/GITZ-123-description
   ```

6. **Create Pull Request**
   - Go to GitHub
   - Click "New Pull Request"
   - Fill in description
   - Link Jira issue (GITZ-123)

7. **CI Pipeline Runs**
   - All checks must pass
   - Review coverage reports
   - Fix any issues

8. **Code Review**
   - Request review from team
   - Address feedback
   - Push updates (CI re-runs automatically)

9. **Merge**
   - Squash and merge to main
   - Delete feature branch

## Troubleshooting CI Failures

### Backend Test Failures

**Symptom:** Backend tests fail in CI but pass locally

**Solutions:**
1. Check database connection (CI uses test database)
2. Verify environment variables are set correctly
3. Check for race conditions in async tests
4. Run tests with same Python version as CI (3.11)

```bash
# Run tests with CI environment
DATABASE_URL=postgresql://gitzen_test:test_password@localhost:5432/gitzen_test \
pytest
```

### Frontend Test Failures

**Symptom:** Frontend tests fail in CI but pass locally

**Solutions:**
1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Check for timezone-dependent tests
3. Verify no absolute paths are used
4. Run tests in CI mode: `CI=true npm run test`

### Linting Failures

**Symptom:** Linting fails in CI

**Solutions:**
1. Run linters locally before pushing
2. Fix formatting: `make format`
3. Check ESLint/Ruff configurations match

```bash
# Backend
black app/
ruff check app/ --fix

# Frontend
npm run format
npm run lint -- --fix
```

### Docker Build Failures

**Symptom:** Docker build fails in CI

**Solutions:**
1. Test Docker build locally: `docker-compose build`
2. Check Dockerfile syntax
3. Verify all files referenced in Dockerfile exist
4. Check for platform-specific issues

```bash
# Test backend build
docker build -t test-backend -f backend/Dockerfile backend/

# Test frontend build
docker build -t test-frontend -f frontend/Dockerfile frontend/
```

### Security Scan Failures

**Symptom:** Trivy or Bandit finds vulnerabilities

**Solutions:**
1. Update dependencies to patched versions
2. Review Bandit findings and fix code
3. Add suppressions for false positives (with justification)

```bash
# Update Python dependencies
pip install --upgrade package-name

# Update Node dependencies
npm update package-name
```

## Performance Optimization

### Caching

The CI pipeline uses caching to speed up builds:

- **Pip Cache:** Python dependencies
- **NPM Cache:** Node dependencies
- **Docker Layer Cache:** Docker image layers

### Parallel Execution

Jobs run in parallel when possible:
- Backend and frontend tests run simultaneously
- Security scans run in parallel with other jobs
- Only integration tests wait for dependencies

### Build Time Expectations

- **Backend Tests:** ~2-3 minutes
- **Frontend Tests:** ~3-4 minutes
- **Security Scans:** ~2-3 minutes
- **Docker Builds:** ~3-5 minutes
- **Integration Tests:** ~2-3 minutes
- **Total Pipeline:** ~8-10 minutes

## Monitoring and Notifications

### GitHub Actions
- View pipeline status in PR checks
- Click "Details" to see full logs
- Download artifacts for detailed reports

### Codecov
- View coverage reports at codecov.io
- See coverage changes in PR comments
- Track coverage trends over time

### SonarCloud
- View code quality metrics
- See code smells and technical debt
- Track quality gates

## Best Practices

1. **Write Tests First (TDD)**
   - Write failing test
   - Implement feature
   - Verify test passes

2. **Keep Tests Fast**
   - Mock external services
   - Use test databases
   - Avoid sleep/wait in tests

3. **Maintain High Coverage**
   - Aim for 80%+ coverage
   - Test edge cases
   - Test error handling

4. **Fix Linting Before Committing**
   - Run `make lint` before commit
   - Use pre-commit hooks
   - Keep code formatted

5. **Review CI Logs**
   - Don't ignore warnings
   - Fix failing tests immediately
   - Keep pipeline green

## Continuous Deployment (Future)

The following CD features are planned:

- **Staging Deployment:** Auto-deploy to staging on merge to develop
- **Production Deployment:** Auto-deploy to production on merge to main
- **Blue/Green Deployments:** Zero-downtime deployments
- **Rollback Automation:** Automatic rollback on deployment failures
- **Performance Testing:** Load tests before production deployment

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Pytest Documentation](https://docs.pytest.org/)
- [Vitest Documentation](https://vitest.dev/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security Best Practices](https://owasp.org/)
