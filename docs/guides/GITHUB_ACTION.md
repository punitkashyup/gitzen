# GitHub Action Usage Guide

Complete guide for using the GitZen GitHub Action to scan for secrets in your repositories.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Inputs](#inputs)
- [Outputs](#outputs)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## 🚀 Quick Start

### Step 1: Create Workflow File

Create `.github/workflows/secret-scan.yml` in your repository:

```yaml
name: Secret Scan

on:
  pull_request:
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
      
      - uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### Step 2: Create Configuration (Optional)

Create `.gitleaks.toml` in your repository root:

```toml
title = "Gitleaks Configuration"

[extend]
useDefault = true

[allowlist]
paths = [
    '''node_modules/''',
    '''vendor/''',
]
```

### Step 3: Commit and Push

```bash
git add .github/workflows/secret-scan.yml .gitleaks.toml
git commit -m "Add secret scanning"
git push
```

That's it! The action will now scan every pull request and push to main.

## ⚙️ Configuration

### Gitleaks Configuration File

The `.gitleaks.toml` file controls what gets scanned and how.

#### Extend Default Rules

```toml
[extend]
useDefault = true  # Use Gitleaks' built-in rules
```

#### Add Custom Rules

```toml
[[rules]]
id = "custom-api-key"
description = "Our internal API key pattern"
regex = '''MYAPP_API_KEY_[a-zA-Z0-9]{32}'''
tags = ["api-key", "custom"]
severity = "high"
```

#### Exclude Paths

```toml
[allowlist]
paths = [
    '''\.git/''',           # Git internals
    '''node_modules/''',    # Node dependencies
    '''vendor/''',          # Go/PHP dependencies
    '''dist/''',            # Build output
    '''build/''',           # Build output
    '''\.min\.js$''',       # Minified files
    '''\.map$''',           # Source maps
    '''package-lock\.json$''',  # Lock files
    '''yarn\.lock$''',
    '''Pipfile\.lock$''',
    '''poetry\.lock$''',
]
```

#### Allow False Positives

```toml
[allowlist]
regexes = [
    '''(?i)example''',
    '''(?i)test[_-]?key''',
    '''(?i)dummy[_-]?secret''',
    '''your[_-]?api[_-]?key[_-]?here''',
]

stopwords = [
    "example",
    "test",
    "dummy",
    "fake",
    "sample",
    "placeholder",
]
```

## 📥 Inputs

### `github_token` (required)

GitHub token for posting comments and statuses.

```yaml
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
```

**Default:** `${{ github.token }}`

### `gitleaks_version` (optional)

Version of Gitleaks to use.

```yaml
with:
  gitleaks_version: 'v8.18.4'
```

**Default:** `v8.18.4`

### `config_path` (optional)

Path to Gitleaks configuration file.

```yaml
with:
  config_path: '.gitleaks.toml'
```

**Default:** `.gitleaks.toml`

### `fail_on_detection` (optional)

Whether to fail the action if secrets are detected.

```yaml
with:
  fail_on_detection: 'true'
```

**Default:** `true`  
**Options:** `'true'` or `'false'`

### `post_comment` (optional)

Whether to post scan results as PR comments.

```yaml
with:
  post_comment: 'true'
```

**Default:** `true`  
**Options:** `'true'` or `'false'`

### `api_endpoint` (optional)

API endpoint to send scan results for dashboard integration.

```yaml
with:
  api_endpoint: 'https://api.gitzen.io'
```

**Default:** `` (disabled)

### `api_key` (optional)

API key for authentication when using `api_endpoint`.

```yaml
with:
  api_key: ${{ secrets.GITZEN_API_KEY }}
```

**Default:** ``

### `scan_path` (optional)

Path to scan (relative to repository root).

```yaml
with:
  scan_path: './src'
```

**Default:** `.` (entire repository)

## 📤 Outputs

### `findings_count`

Number of secrets detected.

```yaml
- name: Check Results
  run: |
    echo "Found ${{ steps.scan.outputs.findings_count }} secrets"
```

### `scan_status`

Scan status: `success` or `failure`.

```yaml
- name: Check Status
  run: |
    if [ "${{ steps.scan.outputs.scan_status }}" == "success" ]; then
      echo "Scan passed!"
    fi
```

### `report_url`

URL to the full scan report (when using API integration).

```yaml
- name: View Report
  run: |
    echo "Report: ${{ steps.scan.outputs.report_url }}"
```

## 💡 Examples

### Scan Only PRs

```yaml
name: Secret Scan

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
```

### Scan Specific Directory

```yaml
- uses: yourorg/gitzen/action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    scan_path: './src'
```

### Don't Fail Build

```yaml
- uses: yourorg/gitzen/action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    fail_on_detection: 'false'
```

### With Dashboard Integration

```yaml
- uses: yourorg/gitzen/action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    api_endpoint: 'https://api.gitzen.io'
    api_key: ${{ secrets.GITZEN_API_KEY }}
```

### Scheduled Scans

```yaml
name: Weekly Secret Scan

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
  workflow_dispatch:

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
          fail_on_detection: 'false'
```

### Multiple Scans

```yaml
jobs:
  scan-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          scan_path: './backend'
  
  scan-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: yourorg/gitzen/action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          scan_path: './frontend'
```

## 🔧 Troubleshooting

### Action Fails to Start

**Problem:** Action doesn't run or fails immediately

**Check:**
1. GitHub token has correct permissions
2. `actions/checkout@v4` runs before GitZen action
3. `fetch-depth: 0` is set for full history

```yaml
permissions:
  contents: read
  pull-requests: write
```

### False Positives

**Problem:** Test data flagged as secrets

**Solution:** Add to `.gitleaks.toml`:

```toml
[allowlist]
regexes = [
    '''test[_-]?secret''',
    '''example[_-]?key''',
]

paths = [
    '''tests/fixtures/''',
    '''**/test-data/''',
]
```

### Slow Scans

**Problem:** Scans take too long

**Solution:**
1. Scan specific directories:
   ```yaml
   scan_path: './src'
   ```

2. Use shallow clone for new commits only:
   ```yaml
   fetch-depth: 1
   ```

3. Exclude large directories:
   ```toml
   [allowlist]
   paths = [
       '''node_modules/''',
       '''dist/''',
   ]
   ```

### Missing PR Comments

**Problem:** Comments don't appear on PR

**Check:**
1. Token has `pull-requests: write` permission
2. `post_comment: 'true'` is set
3. Action runs on `pull_request` event

## ✅ Best Practices

### 1. Run on Every PR

```yaml
on:
  pull_request:
  push:
    branches: [main]
```

### 2. Don't Block PRs (Initially)

```yaml
fail_on_detection: 'false'
```

Start with warnings, then enforce after team is trained.

### 3. Exclude Third-Party Code

```toml
[allowlist]
paths = [
    '''node_modules/''',
    '''vendor/''',
    '''third-party/''',
]
```

### 4. Use Custom Rules for Your Stack

```toml
[[rules]]
id = "our-internal-token"
description = "Internal service token"
regex = '''MYAPP_TOKEN_[a-zA-Z0-9]{40}'''
```

### 5. Keep Configuration in Sync

Commit `.gitleaks.toml` to your repository so all developers use the same rules.

### 6. Rotate Detected Secrets

If secrets are found:
1. Rotate the credentials immediately
2. Remove from code
3. Clean git history if already committed

### 7. Use Environment Variables

```javascript
// ❌ Don't do this
const API_KEY = "sk_live_123...";

// ✅ Do this
const API_KEY = process.env.API_KEY;
```

### 8. Document Allowlist Reasons

```toml
[[rules]]
# Allow our test fixture keys (not real credentials)
[allowlist]
regexes = [
    '''TEST_FIXTURE_KEY_.*''',
]
```

## 📚 Additional Resources

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Secret Management Best Practices](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password)

---

*Last Updated: October 13, 2025*
