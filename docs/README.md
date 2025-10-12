# GitZen Documentation

Welcome to the GitZen documentation! This directory contains all technical documentation, guides, and sprint summaries.

## 📚 Documentation Structure

### 🏗️ Architecture
High-level system design and technical specifications.

- **[Project Documentation](./architecture/PROJECT_DOCUMENTATION.md)** - Complete technical specifications and business plan
- **[Dashboard Mockups](./architecture/dashboard-mockup.md)** - UI/UX design and wireframes

### 🛠️ Development
Guides for setting up and working with the development environment.

- **[Development Guide](./development/DEVELOPMENT.md)** - Docker setup and local development workflow
- **[CI/CD Pipeline](./development/CI_CD.md)** - GitHub Actions, testing, and deployment

### 📖 Guides
Step-by-step guides for common tasks and setup.

- **[Setup Guide](./guides/SETUP_GUIDE.md)** - Quick start and configuration instructions
- **[GitHub Action Usage](./guides/GITHUB_ACTION.md)** - How to use the GitZen GitHub Action (Coming Soon)
- **[API Documentation](./guides/API.md)** - Backend API reference (Coming Soon)

### 🏃 Sprint Summaries
Historical records of completed sprints.

- **[Sprint 0 - Foundation](./sprints/SPRINT_0_SUMMARY.md)** - Docker environment and CI/CD setup (Oct 2025)
- More sprints will be added as they complete...

## 🚀 Quick Links

### For Developers
1. [Get Started with Development](./development/DEVELOPMENT.md) - Set up Docker environment
2. [Understanding CI/CD](./development/CI_CD.md) - Learn about our testing pipeline
3. [Sprint History](./sprints/) - See what we've built

### For Users
1. [Setup Guide](./guides/SETUP_GUIDE.md) - Install and configure GitZen
2. [Project Overview](./architecture/PROJECT_DOCUMENTATION.md) - Understand the vision

### For Contributors
1. [Development Workflow](./development/DEVELOPMENT.md#development-workflow) - How to contribute
2. [Testing Guide](./development/CI_CD.md#running-tests-locally) - Run tests before submitting PR

## 📊 Project Status

| Sprint | Status | Points | Dates |
|--------|--------|--------|-------|
| Sprint 0 - Foundation | ✅ Complete | 13/13 | Oct 15-28, 2025 |
| Sprint 1 - GitHub Action Core | 🔄 In Progress | 0/34 | Oct 29 - Nov 11, 2025 |
| Sprint 2 - Enhanced Scanning | 📅 Planned | - | Nov 12-25, 2025 |

## 🎯 Current Sprint

**Sprint 1: GitHub Action Core**

Focus: Build the core GitHub Action for secret detection

Stories:
- GITZ-12: Implement secret detection (13 pts)
- GITZ-13: Post scan results as PR comments (8 pts)  
- GITZ-14: Extract privacy-safe metadata (8 pts)
- GITZ-15: Configure exclusions and allowlists (5 pts)

## 📝 Document Conventions

### File Naming
- Use `UPPERCASE_WITH_UNDERSCORES.md` for major documents
- Use `lowercase-with-dashes.md` for guides
- Prefix sprint summaries with `SPRINT_X_`

### Structure
- Start with a clear title and description
- Use emoji for visual hierarchy (📚 🛠️ 🚀 etc.)
- Include table of contents for long documents
- Add "Last Updated" dates at the bottom

### Links
- Use relative links within docs: `[Link](./path/to/file.md)`
- Use absolute URLs for external resources
- Keep links up to date when moving files

## 🔄 Keeping Docs Updated

Documentation should be updated:
- ✅ When adding new features (update relevant guides)
- ✅ When completing sprints (add sprint summary)
- ✅ When changing architecture (update technical docs)
- ✅ When fixing bugs (update troubleshooting sections)

## 🤝 Contributing to Docs

Good documentation:
- Is clear and concise
- Includes examples and code snippets
- Has proper formatting (headers, lists, code blocks)
- Is kept up to date with code changes
- Helps users solve problems quickly

## 📞 Questions?

If you can't find what you're looking for:
1. Check the [README](../README.md) in the root directory
2. Search existing documentation
3. Open a GitHub Discussion
4. Contact the team

---

*Documentation Structure - Last Updated: October 13, 2025*
