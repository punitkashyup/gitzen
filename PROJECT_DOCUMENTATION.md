# GitHub Secret Scan & Cleanup Tool - Project Documentation

**Version:** 1.0  
**Date:** October 12, 2025  
**Status:** Planning Phase

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Component Specifications](#component-specifications)
4. [Implementation Strategy](#implementation-strategy)
5. [Security & Privacy](#security--privacy)
6. [Development Roadmap](#development-roadmap)
7. [Business Model](#business-model)
8. [Challenges & Solutions](#challenges--solutions)

---

## Executive Summary

### Vision
Create a privacy-first, automated solution for detecting and safely remediating exposed secrets in Git repositories, without storing sensitive code or credential information.

### Key Differentiators
- **Privacy-First Design**: Never stores actual code or secret values
- **Automated Cleanup**: Guided workflows for history rewriting
- **Safe Operations**: Built-in verification and rollback mechanisms
- **Enterprise-Ready**: Scalable SaaS architecture with self-hosted options

### Target Users
- Development teams managing multiple repositories
- Security teams conducting compliance audits
- DevOps engineers implementing security automation
- Organizations with strict data privacy requirements

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
│  ┌────────────┐      ┌──────────────┐                       │
│  │ Pull Request│      │   Scheduled  │                       │
│  │   Trigger   │      │    Trigger   │                       │
│  └──────┬──────┘      └──────┬───────┘                       │
│         └─────────────────────┘                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Action Workflow                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Checkout Code                                     │   │
│  │  2. Run Gitleaks Scanner                              │   │
│  │  3. Parse JSON Report                                 │   │
│  │  4. Extract Metadata (no code/secrets)                │   │
│  │  5. Send to Dashboard API (HTTPS + Auth)              │   │
│  │  6. Update GitHub Status Check                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ Encrypted API Call
                      │ (Metadata Only)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Web Dashboard (SaaS)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   API Layer  │  │   Database   │  │  Frontend UI │      │
│  │  (FastAPI/   │  │  (PostgreSQL)│  │  (React/Vue) │      │
│  │   Express)   │  │              │  │              │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┴──────────────────┘              │
│                           │                                 │
│  ┌────────────────────────┴─────────────────────────────┐   │
│  │  Features:                                            │   │
│  │  • Report Visualization                               │   │
│  │  • Cleanup Script Generation                          │   │
│  │  • Verification Workflows                             │   │
│  │  • Rollback Management                                │   │
│  │  • Team Collaboration                                 │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Local/Mirror Repository                         │
│  • Safe history rewriting                                    │
│  • Verification before push                                  │
│  • Automatic backups                                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────┐
│   Gitleaks   │
│    Scan      │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  JSON Report (includes code snippets)        │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  Metadata Extraction (Privacy Filter)        │
│  • File path                                 │
│  • Line number                               │
│  • Commit hash                               │
│  • Secret type                               │
│  • Timestamp                                 │
│  • Rule ID                                   │
│  ✗ NO code snippets                          │
│  ✗ NO actual secret values                   │
└──────┬───────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────┐
│  Dashboard Storage (Safe Metadata)           │
└──────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. GitHub Action

#### Configuration File: `.github/workflows/secret-scan.yml`

**Features:**
- Configurable triggers (PR, push, schedule)
- Exclude patterns for files/directories
- Severity thresholds
- Custom Gitleaks rules
- Integration with GitHub Security features

**Environment Variables:**
- `DASHBOARD_API_URL`: Dashboard endpoint
- `DASHBOARD_API_KEY`: Authentication token (stored as GitHub Secret)
- `GITLEAKS_VERSION`: Scanner version
- `EXCLUDED_PATHS`: Comma-separated paths to exclude

#### Action Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `dashboard-url` | Dashboard API endpoint | Yes | - |
| `api-key` | Authentication key | Yes | - |
| `config-path` | Custom Gitleaks config | No | `.gitleaks.toml` |
| `exclude-paths` | Paths to exclude | No | `""` |
| `fail-on-findings` | Fail workflow on secrets | No | `true` |
| `severity-threshold` | Minimum severity to report | No | `medium` |

#### Action Outputs

| Output | Description |
|--------|-------------|
| `secrets-found` | Number of secrets detected |
| `report-url` | Dashboard URL for detailed report |
| `scan-id` | Unique scan identifier |

---

### 2. Web Dashboard

#### Technology Stack

**Backend:**
- **Framework**: FastAPI (Python) or Express.js (Node.js)
- **Database**: PostgreSQL with encryption at rest
- **Authentication**: JWT tokens + OAuth2 (GitHub, Google)
- **API Documentation**: OpenAPI/Swagger
- **Message Queue**: Redis/Celery for async tasks

**Frontend:**
- **Framework**: React with TypeScript or Vue 3
- **UI Library**: Material-UI or Tailwind CSS
- **State Management**: Redux/Vuex or React Context
- **Charts**: Chart.js or D3.js for visualizations

**Infrastructure:**
- **Hosting**: AWS/GCP/Azure with auto-scaling
- **CDN**: CloudFlare for frontend assets
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack or CloudWatch

#### Database Schema

```sql
-- Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    subscription_tier VARCHAR(50)
);

-- Repositories
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES organizations(id),
    repo_name VARCHAR(255) NOT NULL,
    repo_url VARCHAR(500),
    github_repo_id BIGINT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    last_scan_at TIMESTAMP
);

-- Scans
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id UUID REFERENCES repositories(id),
    scan_date TIMESTAMP DEFAULT NOW(),
    trigger_type VARCHAR(50), -- 'pr', 'schedule', 'manual'
    branch_name VARCHAR(255),
    commit_hash VARCHAR(40),
    total_findings INTEGER,
    status VARCHAR(50) -- 'completed', 'failed', 'in_progress'
);

-- Findings (NO CODE OR SECRETS STORED)
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID REFERENCES scans(id),
    file_path VARCHAR(1000) NOT NULL,
    line_number INTEGER,
    commit_hash VARCHAR(40),
    author_email_hash VARCHAR(64), -- Hashed for privacy
    secret_type VARCHAR(100), -- 'aws_key', 'github_token', etc.
    rule_id VARCHAR(100),
    severity VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    discovered_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50), -- 'open', 'resolved', 'false_positive'
    resolved_at TIMESTAMP,
    resolution_notes TEXT
);

-- Cleanup Jobs
CREATE TABLE cleanup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID REFERENCES findings(id),
    created_at TIMESTAMP DEFAULT NOW(),
    status VARCHAR(50), -- 'pending', 'in_progress', 'completed', 'failed'
    cleanup_method VARCHAR(50), -- 'git-filter-repo', 'bfg'
    script_generated TEXT,
    verification_hash VARCHAR(64),
    completed_at TIMESTAMP
);

-- Audit Log
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action VARCHAR(100),
    resource_type VARCHAR(50),
    resource_id UUID,
    timestamp TIMESTAMP DEFAULT NOW(),
    details JSONB
);
```

#### API Endpoints

**Authentication:**
```
POST   /api/v1/auth/login
POST   /api/v1/auth/register
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
```

**Scan Reporting:**
```
POST   /api/v1/scans              # Create new scan report
GET    /api/v1/scans/:id          # Get scan details
GET    /api/v1/scans              # List scans (with filters)
```

**Findings:**
```
GET    /api/v1/findings           # List all findings
GET    /api/v1/findings/:id       # Get finding details
PATCH  /api/v1/findings/:id       # Update finding status
POST   /api/v1/findings/:id/false-positive  # Mark as false positive
```

**Cleanup Operations:**
```
POST   /api/v1/cleanup/generate   # Generate cleanup script
POST   /api/v1/cleanup/verify     # Verify cleanup success
GET    /api/v1/cleanup/jobs       # List cleanup jobs
GET    /api/v1/cleanup/jobs/:id   # Get job status
```

**Repositories:**
```
GET    /api/v1/repositories       # List repositories
GET    /api/v1/repositories/:id   # Get repository details
GET    /api/v1/repositories/:id/stats  # Get statistics
```

#### Dashboard Features

**1. Dashboard Home**
- Overview statistics (total scans, findings, resolved)
- Recent activity timeline
- Severity distribution chart
- Repository health scores
- Trending secret types

**2. Findings Management**
- Filterable/sortable table of all findings
- Batch operations (mark as false positive, resolve)
- Export to CSV/JSON
- Integration with ticketing systems (Jira, Linear)

**3. Cleanup Workflows**
- Step-by-step guided process
- Script generation with preview
- Safety checklist
- Verification tools
- Rollback instructions

**4. Analytics & Reporting**
- Custom date ranges
- Secret type trends over time
- Repository comparison
- Team performance metrics
- Compliance reports (exportable)

**5. Settings & Configuration**
- GitHub App integration
- Webhook configuration
- Custom rule management
- Team member management
- Notification preferences

---

## Implementation Strategy

### Phase 1: MVP (Months 1-2)

**GitHub Action:**
- [x] Basic workflow file
- [x] Gitleaks integration
- [x] Metadata extraction
- [x] API reporting
- [x] GitHub status checks

**Dashboard:**
- [x] User authentication (GitHub OAuth)
- [x] Basic finding visualization
- [x] Repository listing
- [x] Simple script generation
- [x] API endpoints for scan reporting

**Documentation:**
- [x] Setup guide
- [x] API documentation
- [x] User manual
- [x] Security best practices

### Phase 2: Core Features (Months 3-4)

**GitHub Action:**
- [ ] Advanced configuration options
- [ ] Custom rule support
- [ ] Multi-repository support
- [ ] Scheduled scans
- [ ] Performance optimizations

**Dashboard:**
- [ ] Advanced analytics
- [ ] Team collaboration features
- [ ] Notification system (email, Slack)
- [ ] Verification workflows
- [ ] Rollback management

**Integrations:**
- [ ] GitHub Security Advisories
- [ ] Slack notifications
- [ ] Email alerts
- [ ] Jira/Linear integration

### Phase 3: Enterprise Features (Months 5-6)

**Advanced Features:**
- [ ] Self-hosted deployment option
- [ ] SAML/SSO authentication
- [ ] Advanced RBAC
- [ ] Audit logging
- [ ] Compliance reporting
- [ ] Custom integrations API
- [ ] Automated remediation (with approval)

**Scaling:**
- [ ] Multi-region deployment
- [ ] High availability setup
- [ ] Performance monitoring
- [ ] Rate limiting
- [ ] Caching strategies

### Phase 4: Polish & Growth (Months 7+)

**Enhancements:**
- [ ] Machine learning for false positive reduction
- [ ] Secret rotation automation
- [ ] Historical trend analysis
- [ ] Mobile app
- [ ] Browser extension
- [ ] IDE plugins

---

## Security & Privacy

### Privacy-First Design Principles

#### 1. **No Code Storage**
```python
# ✅ GOOD: Store only metadata
finding_data = {
    "file_path": "src/config.py",
    "line_number": 42,
    "commit_hash": "abc123",
    "secret_type": "aws_access_key",
    "rule_id": "aws-access-key"
}

# ❌ BAD: Never store code or secrets
# finding_data = {
#     "code_snippet": "AWS_KEY=AKIA...",
#     "secret_value": "AKIA..."
# }
```

#### 2. **Data Minimization**
- Only collect essential metadata
- Hash sensitive identifiers (email addresses)
- Avoid storing repository content
- Implement data retention policies

#### 3. **Encryption**
- **In Transit**: TLS 1.3 for all API communications
- **At Rest**: AES-256 encryption for database
- **API Keys**: Stored as hashed values (bcrypt/Argon2)
- **Secrets**: Use GitHub Secrets, never in code

#### 4. **Access Control**
- Role-based access control (RBAC)
- Principle of least privilege
- API rate limiting
- IP whitelisting (enterprise tier)

#### 5. **Compliance**
- GDPR compliance (data subject rights)
- SOC 2 Type II certification (target)
- Regular security audits
- Vulnerability disclosure program

### Security Implementation

**GitHub Action Security:**
```yaml
# Secure secret handling
env:
  DASHBOARD_API_KEY: ${{ secrets.DASHBOARD_API_KEY }}

# Run in isolated environment
permissions:
  contents: read
  security-events: write
  pull-requests: write

# Verify third-party actions
uses: gitleaks/gitleaks-action@v2.3.4
  with:
    verify-signature: true
```

**Dashboard Security:**
- WAF (Web Application Firewall)
- DDoS protection
- SQL injection prevention (parameterized queries)
- XSS protection (Content Security Policy)
- CSRF tokens
- Secure session management

**API Security:**
- JWT with short expiration (15 minutes)
- Refresh token rotation
- API key rotation policy
- Request signing
- Rate limiting (per user/org)

---

## Development Roadmap

### Q4 2025 - Foundation

**October:**
- [x] Project planning and architecture design
- [ ] Set up development environment
- [ ] Create GitHub organization
- [ ] Initialize repositories
- [ ] Set up CI/CD pipelines

**November:**
- [ ] Implement basic GitHub Action
- [ ] Build API server skeleton
- [ ] Design database schema
- [ ] Create authentication system
- [ ] Develop frontend foundation

**December:**
- [ ] Complete MVP features
- [ ] Internal testing
- [ ] Security audit
- [ ] Documentation writing
- [ ] Beta program launch

### Q1 2026 - MVP Launch

**January:**
- [ ] Public beta release
- [ ] Community feedback collection
- [ ] Bug fixes and improvements
- [ ] Marketing website launch
- [ ] Developer documentation

**February:**
- [ ] Core feature development
- [ ] Integration partnerships (Slack, Jira)
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Compliance preparation

**March:**
- [ ] Official v1.0 launch
- [ ] Pricing tiers implementation
- [ ] Customer onboarding automation
- [ ] Support system setup
- [ ] Community building

### Q2 2026 - Growth

**April-June:**
- [ ] Enterprise features development
- [ ] Self-hosted version
- [ ] Advanced analytics
- [ ] API marketplace
- [ ] Partnership expansion

### Key Milestones

| Milestone | Target Date | Success Criteria |
|-----------|-------------|------------------|
| MVP Beta | Dec 2025 | 50 beta users, <5 critical bugs |
| v1.0 Launch | Mar 2026 | 500+ users, 99% uptime |
| Enterprise Ready | Jun 2026 | SOC 2 Type II, 10 enterprise customers |
| Profitability | Q4 2026 | Positive cash flow |

---

## Business Model

### Pricing Strategy

#### **Free Tier** (Community)
- **Price**: $0/month
- **Features**:
  - Up to 3 repositories
  - 10 scans per month
  - Basic finding detection
  - Community support
  - 30-day data retention
- **Target**: Individual developers, open source projects

#### **Pro Tier** (Teams)
- **Price**: $29/user/month (annual) or $35/month (monthly)
- **Features**:
  - Unlimited repositories
  - Unlimited scans
  - Advanced analytics
  - Slack/email notifications
  - Priority email support
  - 1-year data retention
  - Custom rules
  - Export capabilities
- **Target**: Small to medium development teams

#### **Enterprise Tier**
- **Price**: Custom pricing (starting at $999/month)
- **Features**:
  - Everything in Pro
  - Self-hosted option
  - SAML/SSO authentication
  - Advanced RBAC
  - SLA guarantees (99.9% uptime)
  - Dedicated support
  - Custom integrations
  - Unlimited data retention
  - Compliance reporting
  - Account manager
- **Target**: Large organizations, regulated industries

### Revenue Streams

1. **Subscription Revenue** (Primary)
   - Monthly/annual subscriptions
   - User-based pricing
   - Repository-based pricing (alternative model)

2. **Professional Services** (Secondary)
   - Custom integration development
   - Security consulting
   - Training and workshops
   - Migration assistance

3. **Marketplace** (Future)
   - Premium rules and patterns
   - Third-party integrations
   - Custom plugins

### Go-to-Market Strategy

**Phase 1: Developer Community (Months 1-6)**
- Open source core components
- GitHub Marketplace listing
- Dev.to and Hashnode blog posts
- Twitter/X engagement
- Conference talks and workshops
- YouTube tutorials

**Phase 2: Product-Led Growth (Months 7-12)**
- Free tier with upgrade prompts
- In-app education
- Case studies and testimonials
- Referral program
- Integration partnerships

**Phase 3: Enterprise Sales (Months 13+)**
- Direct sales team
- Partner channel program
- Industry-specific solutions
- Compliance certifications
- Analyst relations (Gartner, Forrester)

### Competitive Advantages

1. **Privacy-First**: Never stores code or secrets
2. **Ease of Use**: Guided workflows, not just detection
3. **Open Source Core**: Community trust and contributions
4. **Integration-First**: Works with existing tools
5. **Safe Operations**: Built-in verification and rollback

---

## Challenges & Solutions

### Technical Challenges

#### Challenge 1: Large Repository Performance
**Problem**: Scanning large monorepos can take significant time.

**Solutions:**
- Incremental scanning (only changed files)
- Parallel processing
- Caching previous scan results
- Optimize Gitleaks configuration
- Optional shallow clone for recent history

```yaml
# Incremental scanning approach
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v40
  
- name: Scan only changed files
  run: |
    gitleaks detect --source . \
      --no-git \
      --report-format json \
      --report-path results.json \
      --files="${{ steps.changed-files.outputs.all_changed_files }}"
```

#### Challenge 2: False Positives
**Problem**: Too many false positives reduce user trust and create alert fatigue.

**Solutions:**
- Configurable rules and allowlists
- Machine learning classification (future)
- Community-validated patterns
- Easy false positive marking
- Pattern refinement based on feedback

#### Challenge 3: History Rewriting Safety
**Problem**: Git history rewriting is dangerous and can break repositories.

**Solutions:**
- Mandatory backup creation
- Dry-run mode with preview
- Verification checksums
- Rollback documentation
- Force push protection warnings
- Testing in mirror repository first

```bash
# Safety workflow
# 1. Create backup
git clone --mirror original-repo backup-repo

# 2. Create working copy
git clone original-repo cleanup-repo
cd cleanup-repo

# 3. Dry run first
git-filter-repo --path secret-file.txt --invert-paths --dry-run

# 4. Review changes
# 5. Execute if safe
git-filter-repo --path secret-file.txt --invert-paths

# 6. Verify
git log --all --oneline | grep -i "secret"

# 7. Force push with lease (safer)
git push --force-with-lease
```

#### Challenge 4: Scale & Cost
**Problem**: Processing thousands of repositories requires significant infrastructure.

**Solutions:**
- Serverless architecture for scan processing
- Queue-based job processing
- Efficient database indexing
- CDN for static assets
- Auto-scaling policies
- Cost monitoring and alerts

### Business Challenges

#### Challenge 1: Adoption Barrier
**Problem**: Teams may resist adding another tool to their workflow.

**Solutions:**
- Seamless GitHub integration
- Minimal configuration required
- Clear value demonstration (free tier)
- Excellent documentation
- Quick setup (< 5 minutes)

#### Challenge 2: Trust & Privacy Concerns
**Problem**: Users worry about sending repository data to third-party service.

**Solutions:**
- Open source scanning component
- Transparent privacy policy
- Public security audits
- Self-hosted option for enterprises
- Detailed technical documentation
- SOC 2 compliance

#### Challenge 3: Competition
**Problem**: Existing tools like GitHub Advanced Security, GitGuardian.

**Solutions:**
- Differentiate on privacy and ease of use
- Focus on cleanup workflows, not just detection
- Better pricing for small teams
- Superior user experience
- Community-driven development

#### Challenge 4: Monetization
**Problem**: Developers expect free tools; converting to paid difficult.

**Solutions:**
- Generous free tier
- Clear value in paid features
- Transparent pricing
- Usage-based alerts before limits
- Annual discount incentives

---

## Technical Specifications

### GitHub Action Implementation

#### File Structure
```
.github/
  workflows/
    secret-scan.yml
action/
  action.yml
  src/
    index.js
    scanner.js
    reporter.js
    utils.js
  dist/
    index.js (compiled)
  tests/
    scanner.test.js
    reporter.test.js
  package.json
  README.md
```

#### Core Action Code (Pseudocode)

```javascript
// src/index.js
const core = require('@actions/core');
const github = require('@actions/github');
const scanner = require('./scanner');
const reporter = require('./reporter');

async function run() {
  try {
    // Get inputs
    const dashboardUrl = core.getInput('dashboard-url', { required: true });
    const apiKey = core.getInput('api-key', { required: true });
    const configPath = core.getInput('config-path') || '.gitleaks.toml';
    const excludePaths = core.getInput('exclude-paths') || '';
    const failOnFindings = core.getInput('fail-on-findings') === 'true';
    
    // Run Gitleaks scan
    core.info('Starting secret scan...');
    const scanResults = await scanner.runGitleaks({
      configPath,
      excludePaths
    });
    
    // Extract metadata (no code!)
    const metadata = scanner.extractMetadata(scanResults, {
      repoName: github.context.repo.repo,
      repoOwner: github.context.repo.owner,
      branch: github.context.ref,
      commitHash: github.context.sha,
      triggerType: github.context.eventName,
      prNumber: github.context.payload.pull_request?.number
    });
    
    // Send to dashboard
    core.info('Sending report to dashboard...');
    const reportResponse = await reporter.sendToDashboard({
      url: dashboardUrl,
      apiKey: apiKey,
      data: metadata
    });
    
    // Update GitHub status
    await reporter.updateGitHubStatus({
      context: github.context,
      findings: metadata.findings.length,
      reportUrl: reportResponse.reportUrl
    });
    
    // Set outputs
    core.setOutput('secrets-found', metadata.findings.length);
    core.setOutput('report-url', reportResponse.reportUrl);
    core.setOutput('scan-id', reportResponse.scanId);
    
    // Fail if configured
    if (failOnFindings && metadata.findings.length > 0) {
      core.setFailed(`Found ${metadata.findings.length} secrets`);
    } else {
      core.info('✅ Scan completed successfully');
    }
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
```

```javascript
// src/scanner.js
const { execSync } = require('child_process');
const fs = require('fs');

async function runGitleaks({ configPath, excludePaths }) {
  const reportPath = 'gitleaks-report.json';
  
  let command = `gitleaks detect --source . --report-format json --report-path ${reportPath}`;
  
  if (fs.existsSync(configPath)) {
    command += ` --config ${configPath}`;
  }
  
  if (excludePaths) {
    // Write exclude paths to temp file
    fs.writeFileSync('.gitleaks-exclude', excludePaths);
    command += ' --exclude-paths .gitleaks-exclude';
  }
  
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    // Gitleaks exits with code 1 when findings exist
    if (error.status !== 1) {
      throw error;
    }
  }
  
  return JSON.parse(fs.readFileSync(reportPath, 'utf8'));
}

function extractMetadata(scanResults, context) {
  return {
    repoName: context.repoName,
    repoOwner: context.repoOwner,
    branch: context.branch,
    commitHash: context.commitHash,
    triggerType: context.triggerType,
    prNumber: context.prNumber,
    scanDate: new Date().toISOString(),
    findings: scanResults.map(finding => ({
      // Privacy-safe metadata only
      filePath: finding.File,
      lineNumber: finding.StartLine,
      commitHash: finding.Commit,
      authorEmailHash: hashEmail(finding.Email),
      secretType: finding.RuleID,
      severity: finding.Tags?.includes('high') ? 'high' : 'medium',
      ruleId: finding.RuleID,
      // ❌ NEVER include:
      // - finding.Secret
      // - finding.Match
      // - finding.Line
    }))
  };
}

function hashEmail(email) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(email).digest('hex');
}

module.exports = { runGitleaks, extractMetadata };
```

```javascript
// src/reporter.js
const https = require('https');
const core = require('@actions/core');

async function sendToDashboard({ url, apiKey, data }) {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'SecretScan-Action/1.0'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = https.request(`${url}/api/v1/scans`, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`API returned ${res.statusCode}: ${body}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

async function updateGitHubStatus({ context, findings, reportUrl }) {
  const octokit = github.getOctokit(process.env.GITHUB_TOKEN);
  
  await octokit.rest.repos.createCommitStatus({
    owner: context.repo.owner,
    repo: context.repo.repo,
    sha: context.sha,
    state: findings > 0 ? 'failure' : 'success',
    description: findings > 0 
      ? `Found ${findings} secrets` 
      : 'No secrets detected',
    context: 'Secret Scan',
    target_url: reportUrl
  });
}

module.exports = { sendToDashboard, updateGitHubStatus };
```

### Dashboard Backend (FastAPI)

```python
# app/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import uvicorn

from app import models, schemas, crud
from app.database import engine, get_db
from app.auth import verify_api_key, get_current_user

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Secret Scan Dashboard API",
    version="1.0.0",
    description="Privacy-first secret scanning dashboard"
)

security = HTTPBearer()

@app.post("/api/v1/scans", response_model=schemas.ScanResponse)
async def create_scan(
    scan_data: schemas.ScanCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Receive scan report from GitHub Action.
    Only stores metadata, never code or secrets.
    """
    # Verify API key
    user = await verify_api_key(credentials.credentials, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key"
        )
    
    # Validate no code/secrets in payload
    if not validate_privacy_compliance(scan_data):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Request contains prohibited data (code or secrets)"
        )
    
    # Create scan record
    scan = crud.create_scan(db, scan_data, user.organization_id)
    
    # Create findings
    for finding_data in scan_data.findings:
        crud.create_finding(db, finding_data, scan.id)
    
    return {
        "scanId": str(scan.id),
        "reportUrl": f"https://dashboard.example.com/scans/{scan.id}",
        "status": "success"
    }

@app.get("/api/v1/findings", response_model=list[schemas.Finding])
async def list_findings(
    repo_id: str = None,
    status: str = None,
    severity: str = None,
    limit: int = 100,
    offset: int = 0,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List findings with filtering options."""
    findings = crud.get_findings(
        db,
        org_id=current_user.organization_id,
        repo_id=repo_id,
        status=status,
        severity=severity,
        limit=limit,
        offset=offset
    )
    return findings

@app.post("/api/v1/cleanup/generate", response_model=schemas.CleanupScript)
async def generate_cleanup_script(
    request: schemas.CleanupRequest,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generate a safe cleanup script for removing secrets from history.
    """
    findings = crud.get_findings_by_ids(db, request.finding_ids)
    
    # Generate script based on cleanup method
    if request.method == "git-filter-repo":
        script = generate_filter_repo_script(findings)
    elif request.method == "bfg":
        script = generate_bfg_script(findings)
    else:
        raise HTTPException(400, "Invalid cleanup method")
    
    # Store cleanup job
    job = crud.create_cleanup_job(
        db,
        finding_ids=request.finding_ids,
        method=request.method,
        script=script
    )
    
    return {
        "jobId": str(job.id),
        "script": script,
        "safetyChecklist": get_safety_checklist(),
        "rollbackInstructions": get_rollback_instructions()
    }

def validate_privacy_compliance(data):
    """
    Ensure no code snippets or secret values in payload.
    """
    # Check for common code patterns
    prohibited_fields = ['code', 'secret', 'match', 'line_content', 'snippet']
    
    data_str = str(data.dict()).lower()
    for field in prohibited_fields:
        if field in data_str:
            return False
    
    return True

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

```python
# app/schemas.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class FindingBase(BaseModel):
    file_path: str = Field(..., max_length=1000)
    line_number: int
    commit_hash: str = Field(..., max_length=40)
    author_email_hash: str = Field(..., max_length=64)
    secret_type: str
    rule_id: str
    severity: str
    
    @validator('*')
    def no_sensitive_data(cls, v):
        """Ensure no code or secrets in any field"""
        if isinstance(v, str) and len(v) > 1000:
            raise ValueError("Field too long, possible code snippet")
        return v

class FindingCreate(FindingBase):
    pass

class Finding(FindingBase):
    id: UUID
    scan_id: UUID
    status: str
    discovered_at: datetime
    
    class Config:
        orm_mode = True

class ScanCreate(BaseModel):
    repo_name: str
    repo_owner: str
    branch: str
    commit_hash: str
    trigger_type: str
    pr_number: Optional[int]
    findings: List[FindingCreate]

class ScanResponse(BaseModel):
    scan_id: UUID
    report_url: str
    status: str

class CleanupRequest(BaseModel):
    finding_ids: List[UUID]
    method: str  # 'git-filter-repo' or 'bfg'

class CleanupScript(BaseModel):
    job_id: UUID
    script: str
    safety_checklist: List[str]
    rollback_instructions: str
```

---

## Testing Strategy

### Unit Tests
- Scanner metadata extraction
- Privacy validation
- API endpoint logic
- Database operations
- Script generation

### Integration Tests
- GitHub Action workflow
- API authentication
- Database transactions
- External service calls

### End-to-End Tests
- Full scan workflow
- Dashboard user flows
- Cleanup operations
- Rollback scenarios

### Security Tests
- Penetration testing
- SQL injection attempts
- XSS vulnerability checks
- API rate limiting
- Authentication bypass attempts

### Performance Tests
- Large repository scanning
- Concurrent API requests
- Database query optimization
- Frontend load times

---

## Documentation Requirements

### User Documentation
1. **Getting Started Guide**
   - Installation instructions
   - Quick start tutorial
   - Configuration options
   
2. **User Manual**
   - Dashboard features
   - Cleanup workflows
   - Best practices
   
3. **Video Tutorials**
   - Setup walkthrough
   - Finding management
   - Cleanup process

### Developer Documentation
1. **API Reference**
   - OpenAPI specification
   - Authentication guide
   - Example requests
   
2. **Architecture Guide**
   - System design
   - Data flow
   - Technology stack
   
3. **Contributing Guide**
   - Code standards
   - Pull request process
   - Testing requirements

### Operations Documentation
1. **Deployment Guide**
   - Infrastructure setup
   - Configuration management
   - Scaling strategies
   
2. **Monitoring Guide**
   - Key metrics
   - Alert setup
   - Troubleshooting

---

## Success Metrics

### Product Metrics
- **Adoption**: Number of active installations
- **Engagement**: Scans per user per month
- **Retention**: 30-day, 90-day retention rates
- **Conversion**: Free to paid conversion rate

### Technical Metrics
- **Performance**: Average scan time < 2 minutes
- **Reliability**: 99.9% uptime
- **Accuracy**: False positive rate < 5%
- **Speed**: API response time < 200ms (p95)

### Business Metrics
- **MRR**: Monthly Recurring Revenue
- **CAC**: Customer Acquisition Cost
- **LTV**: Customer Lifetime Value
- **Churn**: Monthly churn rate < 3%

### Security Metrics
- **Privacy**: Zero code storage incidents
- **Security**: Zero data breaches
- **Compliance**: 100% audit pass rate
- **Vulnerability**: Time to patch < 24 hours

---

## Conclusion

This project represents a significant opportunity in the DevSecOps space, addressing a critical need for secret detection and remediation with a privacy-first approach. The modular architecture allows for phased development, starting with an MVP that provides immediate value while building toward enterprise-ready features.

### Key Success Factors

1. **Privacy by Design**: Never compromising on data protection
2. **User Experience**: Making security easy and accessible
3. **Community Building**: Open source core for trust and contributions
4. **Continuous Innovation**: Staying ahead of evolving threats
5. **Customer Success**: Ensuring users achieve their security goals

### Next Steps

1. ✅ Review and approve this documentation
2. [ ] Set up development environment
3. [ ] Create project repositories
4. [ ] Assemble development team (or start solo)
5. [ ] Begin Phase 1 implementation
6. [ ] Launch beta program
7. [ ] Iterate based on feedback

---

**Document Version**: 1.0  
**Last Updated**: October 12, 2025  
**Maintained By**: Project Team  
**License**: Proprietary (this document), Open Source (code - TBD)

For questions or contributions, please refer to the project repository or contact the maintainers.
