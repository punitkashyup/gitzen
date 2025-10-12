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

## 🔧 Configuration

### Create `.gitleaks.toml`

Create a `.gitleaks.toml` file in your repository root:

```toml
title = "Gitleaks Configuration"

[extend]
useDefault = true

[allowlist]
paths = [
    '''node_modules/''',
    '''vendor/''',
    '''dist/''',
]

stopwords = [
    "example",
    "test",
    "dummy",
]
```

### Exclude Paths

Common paths to exclude from scanning:

```toml
[allowlist]
paths = [
    '''\.git/''',
    '''node_modules/''',
    '''vendor/''',
    '''dist/''',
    '''build/''',
    '''\.min\.js$''',
    '''\.map$''',
    '''package-lock\.json$''',
]
```

### Custom Rules

Add custom secret detection patterns:

```toml
[[rules]]
id = "custom-api-key"
description = "Custom API Key Pattern"
regex = '''(?i)api[_-]?key['":\s=]+([a-zA-Z0-9_\-]{32,})'''
tags = ["api-key", "custom"]
severity = "high"
```

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

### What We Scan
- ✅ File paths and line numbers
- ✅ Commit hashes
- ✅ Secret types (e.g., "AWS Key")
- ✅ SHA-256 hashes of detected secrets

### What We DON'T Collect
- ❌ Source code
- ❌ Actual secret values
- ❌ Code context around secrets
- ❌ File contents

### API Reporting (Optional)

When configured with `api_endpoint` and `api_key`, the action sends only privacy-safe metadata:

```json
{
  "repo_name": "yourorg/yourrepo",
  "commit_hash": "abc123...",
  "findings": [
    {
      "file_path": "src/config.js",
      "line_number": 15,
      "secret_type": "aws-access-token",
      "secret_hash": "sha256:...",
      "severity": "high"
    }
  ]
}
```

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
