# GitZen GitHub Action

[![GitHub Action](https://img.shields.io/badge/GitHub-Action-blue.svg)](https://github.com/marketplace/actions/gitzen-secret-scanner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Automatically scan your repositories and pull requests for exposed secrets using Gitleaks.

## 🚀 Features

- ✅ **Automatic Secret Detection** - Powered by Gitleaks v8.18+
- 🔒 **Privacy-First** - Only extracts metadata, never code or secret values
- 💬 **PR Comments** - Posts scan results directly on pull requests
- 📊 **Dashboard Integration** - Optional API reporting
- ⚡ **Fast Scans** - Typically completes in < 2 minutes
- 🎯 **Customizable** - Configure exclusions, rules, and severity levels
- 🔐 **Comprehensive Coverage** - AWS keys, API tokens, passwords, private keys, and more

## 📦 Usage

### Basic Setup

Add the following workflow to your repository at `.github/workflows/secret-scan.yml`:

```yaml
name: Secret Scan

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Run GitZen Secret Scanner
        uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Configuration

```yaml
      - name: Run GitZen Secret Scanner
        uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          gitleaks_version: 'v8.18.4'
          config_path: '.gitleaks.toml'
          fail_on_detection: 'true'
          post_comment: 'true'
          api_endpoint: 'https://api.gitzen.io'
          api_key: ${{ secrets.GITZEN_API_KEY }}
          scan_path: '.'
```

## ⚙️ Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `github_token` | GitHub token for posting comments | Yes | `${{ github.token }}` |
| `gitleaks_version` | Version of Gitleaks to use | No | `v8.18.4` |
| `config_path` | Path to Gitleaks configuration | No | `.gitleaks.toml` |
| `fail_on_detection` | Fail action if secrets found | No | `true` |
| `post_comment` | Post results as PR comment | No | `true` |
| `api_endpoint` | API endpoint for reporting | No | `` |
| `api_key` | API key for authentication | No | `` |
| `scan_path` | Path to scan | No | `.` |

## 📤 Outputs

| Output | Description |
|--------|-------------|
| `findings_count` | Number of secrets detected |
| `scan_status` | Scan status (`success`/`failure`) |
| `report_url` | URL to full scan report (if API configured) |

## � Pull Request Comments

GitZen automatically posts detailed scan results as comments on pull requests. The comments are **intelligently updated** rather than creating duplicates.

### Comment Features

✅ **Smart Updates** - Updates existing comments instead of creating duplicates  
✅ **New Findings Badge** - Shows 🆕 badge for newly detected secrets  
✅ **Resolved Tracking** - Shows ✅ badge for resolved secrets from previous scans  
✅ **Severity Indicators** - Color-coded icons (🔴 Critical, 🟡 High, 🟢 Medium, 🔵 Low)  
✅ **Collapsible Sections** - Long finding lists are collapsed by default  
✅ **Detailed Context** - Shows file path, line number, commit hash, and secret type  
✅ **Remediation Guidance** - Provides actionable next steps and resources

### Example: Clean Scan

```markdown
## 🔐 GitZen Secret Scan Results

✅ **No secrets detected!**

Your pull request passed the security scan. Great job! 🎉

**Scan Details:**
- Files Scanned: 42
- Gitleaks Version: v8.18.4
- Scan Time: 2024-10-13 14:23:45 UTC
```

### Example: With Findings

```markdown
## 🔐 GitZen Secret Scan Results

⚠️ **3 potential secrets detected**

### 📊 Severity Breakdown
- 🔴 Critical: 1
- 🟡 High: 1
- 🟢 Medium: 1

### 🆕 New Findings (2)
<details>
<summary>Click to expand findings</summary>

#### 🔴 AWS Access Token 🆕
**File:** `src/config/aws.js` (Line 24)  
**Commit:** `a1b2c3d`  
**Rule:** `aws-access-token`

#### 🟡 GitHub Token 🆕
**File:** `scripts/deploy.sh` (Line 15)  
**Commit:** `b3c4d5e`  
**Rule:** `github-pat`

</details>

### ✅ Resolved Findings (1)
<details>
<summary>Click to expand</summary>

#### 🔴 API Key ✅
**File:** `api/keys.py` (Line 42)  
**Rule:** `generic-api-key`

</details>

### 🔧 Remediation Steps
1. **Never commit secrets** - Remove them immediately
2. **Rotate credentials** - Assume exposed secrets are compromised
3. **Use environment variables** - Store secrets securely
4. **Clean Git history** - Use `git-filter-repo` if needed

### 📚 Resources
- [Removing Secrets Guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [Secret Management Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---
*This scan is privacy-preserving and does not store your code or secret values.*
```

### Comment Comparison Logic

The PR comment system tracks changes between scans:

- **🆕 New Findings**: Secrets detected in current scan but not previous
- **✅ Resolved Findings**: Secrets from previous scan no longer detected  
- **Persistent Findings**: Secrets in both scans (no special badge)

This helps you track remediation progress over time.

## �🔧 Configuration

### Quick Start

GitZen comes with **50+ pre-configured exclusion patterns** and comprehensive allowlists to minimize false positives while maintaining high detection accuracy.

Create a `.gitleaks.toml` file in your repository root. GitZen automatically provides sensible defaults:

```toml
title = "Gitleaks Configuration"

# Use Gitleaks' built-in rules plus GitZen's enhancements
[extend]
useDefault = true

# Pre-configured with 50+ exclusion patterns
[allowlist]
paths = [
    '''node_modules/''',      # Dependencies
    '''vendor/''',
    '''dist/''',              # Build artifacts
    '''build/''',
    '''\.min\.js$''',         # Minified files
    '''fixtures/''',          # Test data
    '''\.lock$''',            # Lock files
    # ... and 40+ more patterns
]

# Comprehensive regex patterns for false positives
regexes = [
    '''(?i)(test|example|dummy)''',    # Test indicators
    '''localhost''',                    # Development URLs
    '''your[_-]?api[_-]?key[_-]?here''', # Placeholders
    # ... and 20+ more patterns
]

# 30+ stopwords for test data
stopwords = [
    "example", "test", "dummy", "fake", "sample",
    "placeholder", "mock", "template", "demo",
    # ... and 20+ more stopwords
]
```

### Path Exclusions

GitZen automatically excludes **50+ common patterns** that typically contain false positives:

#### Dependencies & Build Artifacts
```toml
'''node_modules/'''        # Node.js packages
'''vendor/'''              # Go/PHP dependencies
'''dist/''', '''build/'''  # Build output
'''\.min\.js$'''           # Minified JavaScript
'''coverage/'''            # Test coverage
```

#### IDE & Version Control
```toml
'''.vscode/''', '''.idea/'''  # IDE settings
'''.git/''', '''.svn/'''      # Version control
'''\.swp$''', '''\.DS_Store$''' # Editor files
```

#### Lock Files & Generated Code
```toml
'''\.lock$'''              # All lock files
'''package-lock\.json$'''  # npm lock
'''__pycache__/'''         # Python cache
'''\.pyc$''', '''\.class$''' # Compiled files
```

#### Test Fixtures & Documentation
```toml
'''fixtures/'''            # Test data
'''__mocks__/'''           # Mock data
'''\.md$'''                # Markdown files
'''docs/generated/'''      # Generated docs
```

#### Media & Archives
```toml
'''\.png$''', '''\.jpg$'''  # Images
'''\.mp4$''', '''\.mp3$'''  # Media
'''\.zip$''', '''\.tar\.gz$''' # Archives
```

**👉 See the complete list:** [Gitleaks Configuration Guide](../docs/guides/GITLEAKS_CONFIG.md)

### Allowlist for False Positives

GitZen includes comprehensive allowlist patterns for common false positives:

#### Test/Example Secrets
```toml
[allowlist]
regexes = [
    '''(?i)(AKIA|ghp_|glpat-).*test''',  # AWS/GitHub test keys
    '''(?i)test.*(secret|token|key)''',  # Test secrets
]
```

#### Development URLs
```toml
'''localhost''',
'''127\.0\.0\.1''',
'''example\.(com|org|net)''',
```

#### Placeholder Patterns
```toml
'''(?i)your[_-]?api[_-]?key[_-]?here''',
'''(?i)replace[_-]?with[_-]?actual''',
'''\$\{[A-Z_]+\}''',       # ${API_KEY}
```

#### Documentation Markers
```toml
'''<YOUR_[A-Z_]+>''',      # <YOUR_API_KEY>
'''(?i)insert[_-]?[a-z]+[_-]?here''',
```

### Stopwords

Stopwords automatically filter out secrets containing test indicators:

```toml
[allowlist]
stopwords = [
    # Test indicators
    "example", "test", "dummy", "fake", "sample",
    "placeholder", "mock", "fixture", "stub",
    
    # Environment indicators
    "development", "dev", "local", "staging",
    
    # Common placeholders
    "xxx", "abc123", "changeme", "fixme",
    
    # Documentation markers
    "redacted", "not-a-real-secret", "insert-key-here",
]
```

### Custom Rules

Add organization-specific secret patterns:

```toml
[[rules]]
id = "company-internal-token"
description = "Company's internal service token format"
regex = '''(?i)ACME-[A-Z]{3}-[0-9]{10}-[a-f0-9]{32}'''
tags = ["internal-token", "high"]
keywords = ["ACME-"]
entropy = 4.0
```

### Monorepo Configuration

For monorepos with multiple apps/services:

```toml
[allowlist]
paths = [
    # Frontend app
    '''apps/frontend/node_modules/''',
    '''apps/frontend/dist/''',
    
    # Backend service
    '''services/api/venv/''',
    '''services/api/__pycache__/''',
    
    # Shared packages
    '''packages/*/dist/''',
]
```

### Hash-Based Allowlisting

For specific known false positives that can't be filtered by regex:

```bash
# 1. Calculate SHA-256 hash of the secret
echo -n "test_secret_12345" | sha256sum

# 2. Add hash to allowlist
[allowlist.regexes]
regexes = [
    '''abc123def456789...''',  # Hash of test_secret_12345
]
```

### Testing Your Configuration

GitZen includes a test script to validate your exclusion patterns:

```bash
./scripts/test-exclusions.sh
```

This verifies that:
- ✅ Common paths are properly excluded
- ✅ Stopwords filter test data correctly
- ✅ Real secrets are still detected

### Complete Configuration Guide

For detailed explanations, examples, and troubleshooting:

**📖 [Read the Full Gitleaks Configuration Guide](../docs/guides/GITLEAKS_CONFIG.md)**

Topics covered:
- All 50+ default exclusion patterns explained
- Regex pattern syntax and examples
- Hash-based allowlisting walkthrough
- Common use cases (monorepo, open source, docs sites)
- Troubleshooting false positives/negatives
- Best practices and testing strategies

## 📊 Example Output

### Clean Scan ✅

```
✅ No secrets detected!

Your pull request passed the security scan. Great job! 🎉

Scan Details:
- Status: Clean
- Gitleaks Version: v8.18.4
- Commit: a1b2c3d
```

### Findings Detected ⚠️

```
⚠️ Found 2 potential secret(s)

Action Required: Please review and remediate the findings below.

Findings:
1. 🔴 aws-access-token
   - File: `src/config.js`
   - Line: 15
   - Type: AWS Access Key
   - Commit: a1b2c3d

2. 🟡 generic-api-key
   - File: `api/keys.py`
   - Line: 42
   - Type: API Key
   - Commit: a1b2c3d

Remediation Steps:
1. Never commit secrets - Remove them from code
2. Rotate credentials - Assume they are compromised
3. Use environment variables - Store secrets securely
4. Clean history - Use tools like git-filter-repo if needed
```

## 🔒 Privacy & Security

GitZen is designed with privacy-first principles. **Your source code and actual secret values NEVER leave your repository.**

### Privacy-Safe Metadata Extraction

When secrets are detected, GitZen extracts ONLY the following metadata:

#### ✅ What We Extract
- **File paths** - Relative paths within your repository (e.g., `src/config.js`)
- **Line numbers** - Where the secret was found (e.g., line 15)
- **Commit hashes** - Git commit SHA where the secret was introduced
- **Secret types** - Rule ID/category (e.g., `aws-access-token`, `github-pat`)
- **SHA-256 hashes** - One-way hash of the secret value (for deduplication, NOT reversible)
- **Author hashes** - SHA-256 hash of commit author email (privacy-preserving)
- **Severity levels** - Risk classification (critical, high, medium, low)
- **Entropy scores** - Randomness measurement of the detected string
- **Timestamps** - When the scan was performed

#### ❌ What We NEVER Extract
- ❌ **Source code** - No code snippets or file contents
- ❌ **Actual secret values** - The real API keys, tokens, passwords, etc.
- ❌ **Code context** - No surrounding lines or code structure
- ❌ **File contents** - No full or partial file data
- ❌ **Email addresses** - Only irreversible SHA-256 hashes
- ❌ **Commit messages** - No git commit details beyond SHA

### SHA-256 Hashing

All sensitive values are hashed using SHA-256 before being stored or transmitted:

```bash
# Example: Email address hashing
Input: "developer@company.com"
Output: "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b"

# Example: Secret value hashing
Input: "AKIAIOSFODNN7EXAMPLE"
Output: "sha256:1a5d44a2dca19669d72edf4c4f1c27c4c1ca4b4408fbb17f6ce4ad452d78ddb3"
```

**Why SHA-256?**
- ✅ One-way function (cannot be reversed)
- ✅ Deterministic (same input = same hash)
- ✅ Collision-resistant (virtually impossible to find two inputs with same hash)
- ✅ Industry standard for cryptographic hashing

### Metadata JSON Schema

GitZen follows a strict JSON schema that validates metadata structure and ensures no prohibited fields (like `Secret`, `Match`, `Email`, `code`) are included.

**Schema Location:** `schemas/metadata-schema.json`

**Example metadata structure:**

```json
{
  "version": "1.0.0",
  "scan_context": {
    "repo_name": "yourorg/yourrepo",
    "repo_owner": "yourorg",
    "branch": "main",
    "commit_hash": "abc123...",
    "trigger_type": "pull_request",
    "pr_number": 42,
    "scan_timestamp": "2025-10-13T10:30:00Z"
  },
  "findings": [
    {
      "finding_id": "ae78f0bd945095...",
      "file_path": "src/config.js",
      "line_number": 15,
      "commit_hash": "a1b2c3d",
      "author_hash": "973dfe463ec857...",
      "secret_type": "aws-access-token",
      "secret_hash": "sha256:1a5d44a2dca196...",
      "entropy": 3.5,
      "severity": "high",
      "tags": ["high", "aws"]
    }
  ],
  "summary": {
    "total_findings": 1,
    "by_severity": {"critical": 0, "high": 1, "medium": 0, "low": 0},
    "by_type": {"aws-access-token": 1},
    "unique_files": 1
  }
}
```

### Privacy Validation

Every metadata extraction is automatically validated to ensure privacy compliance:

1. **Prohibited Field Check** - Verifies no sensitive fields exist
2. **Schema Validation** - Confirms structure matches expected format
3. **Hash Format Validation** - Ensures all hashes are proper SHA-256
4. **Automated Tests** - 7 comprehensive privacy tests run on every build

**Test Script:** `scripts/test-privacy.sh`

### API Reporting (Optional)

When configured with `api_endpoint` and `api_key`, the action sends ONLY the privacy-safe metadata shown above. The API integration is optional and disabled by default.

**Key Points:**
- 🔒 HTTPS only (enforced)
- 🔐 API key authentication
- ⚠️ Failed API calls don't block PRs
- 📊 Full metadata visibility (logged before sending)

## 🛠️ Troubleshooting

### Action Fails to Run

**Problem:** Action doesn't start or fails immediately

**Solutions:**
1. Check GitHub token has correct permissions
2. Verify `actions/checkout@v4` is before GitZen action
3. Ensure `fetch-depth: 0` for full history

### False Positives

**Problem:** Test data or examples flagged as secrets

**Solutions:**
1. Add patterns to `allowlist.regexes` in `.gitleaks.toml`
2. Use `stopwords` to filter common false positives
3. Exclude test directories in `allowlist.paths`

### Slow Scans

**Problem:** Scans take longer than 2 minutes

**Solutions:**
1. Reduce `scan_path` to specific directories
2. Add more patterns to `allowlist.paths`
3. Use `fetch-depth: 1` if only scanning new commits

### API Reporting Fails

**Problem:** Results don't appear in dashboard

**Solutions:**
1. Verify `api_endpoint` is correct
2. Check `api_key` is valid
3. Ensure API endpoint is accessible from GitHub Actions
4. Review action logs for HTTP error codes

## 📚 Examples

### Scan Only on PRs

```yaml
on:
  pull_request:
    branches: [main, develop]

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          fail_on_detection: 'true'
```

### Scan Specific Directory

```yaml
      - uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          scan_path: './src'
```

### Don't Fail Build, Just Report

```yaml
      - uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          fail_on_detection: 'false'
          post_comment: 'true'
```

### Scan with Dashboard Integration

```yaml
      - uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          api_endpoint: 'https://api.gitzen.io'
          api_key: ${{ secrets.GITZEN_API_KEY }}
```

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](../docs/guides/CONTRIBUTING.md) for details.

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details.

## 📞 Support

- **Documentation:** [docs.gitzen.io](https://docs.gitzen.io)
- **Issues:** [GitHub Issues](https://github.com/yourorg/gitzen/issues)
- **Discussions:** [GitHub Discussions](https://github.com/yourorg/gitzen/discussions)

## 🙏 Acknowledgments

- [Gitleaks](https://github.com/gitleaks/gitleaks) - Excellent secret detection engine
- [GitHub Actions](https://github.com/features/actions) - CI/CD platform

---

**Built with ❤️ for developer security**

*Last Updated: October 13, 2025*
