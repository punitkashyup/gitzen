# Setup Guide - GitHub Secret Scan & Cleanup Tool

Quick start guide for implementing the secret scanning solution in your repository.

---

## Prerequisites

- GitHub repository with admin access
- GitHub Actions enabled
- Basic understanding of Git workflows

---

## Quick Setup (5 minutes)

### Step 1: Register for Dashboard Access

1. Visit [https://dashboard.example.com](https://dashboard.example.com)
2. Sign in with your GitHub account
3. Create or join an organization
4. Navigate to Settings → API Keys
5. Click "Create New API Key"
6. Copy the generated key (you'll need it next)

### Step 2: Add Secrets to GitHub

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click "New repository secret"
4. Add the following secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `DASHBOARD_API_URL` | `https://api.example.com` | Dashboard API endpoint |
| `DASHBOARD_API_KEY` | `gsk_prod_...` | Your API key from Step 1 |

### Step 3: Add Workflow File

1. Create `.github/workflows/secret-scan.yml` in your repository
2. Copy the workflow file from this repository's `.github/workflows/` directory
3. Commit and push the file

```bash
mkdir -p .github/workflows
curl -o .github/workflows/secret-scan.yml \
  https://raw.githubusercontent.com/yourorg/secret-scan/main/.github/workflows/secret-scan.yml
git add .github/workflows/secret-scan.yml
git commit -m "Add secret scanning workflow"
git push
```

### Step 4: (Optional) Add Gitleaks Configuration

1. Create `.gitleaks.toml` in your repository root
2. Copy the configuration template from this repository
3. Customize for your needs

```bash
curl -o .gitleaks.toml \
  https://raw.githubusercontent.com/yourorg/secret-scan/main/.gitleaks.toml
git add .gitleaks.toml
git commit -m "Add Gitleaks configuration"
git push
```

### Step 5: Verify Setup

1. Create a test pull request
2. The secret scan workflow should run automatically
3. Check the Actions tab to see the results
4. Visit your dashboard to see the scan report

---

## Configuration Options

### Workflow Triggers

The default configuration triggers on:
- Pull requests to `main` and `develop` branches
- Pushes to `main` branch
- Weekly schedule (Mondays at 9 AM UTC)
- Manual triggers via GitHub UI

Customize triggers in `.github/workflows/secret-scan.yml`:

```yaml
on:
  pull_request:
    branches: [ main, develop, staging ]  # Add more branches
  
  push:
    branches: [ main ]
  
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM UTC
    # - cron: '0 0 * * *'  # Daily at midnight
  
  workflow_dispatch:  # Manual trigger
```

### Exclude Files and Directories

Edit `.gitleaks.toml` to exclude paths:

```toml
[allowlist]
paths = [
    '''\.git/''',
    '''node_modules/''',
    '''vendor/''',
    '''dist/''',
    '''build/''',
    '''\.test\.js$''',       # Test files
    '''\.spec\.ts$''',       # Spec files
    '''mock-data/''',        # Mock data directory
]
```

### Custom Rules

Add custom secret detection patterns to `.gitleaks.toml`:

```toml
[[rules]]
id = "my-custom-api-key"
description = "My Company API Key"
regex = '''(?i)mycompany[_-]?api[_-]?key['":\s=]+([a-zA-Z0-9]{40})'''
tags = ["api-key", "custom", "mycompany"]
severity = "high"
```

### Fail/Pass Behavior

Control whether the workflow fails when secrets are found:

In `.github/workflows/secret-scan.yml`:

```yaml
- name: Fail on Findings
  if: steps.extract-metadata.outputs.findings_count > 0
  run: |
    echo "❌ Secret scan failed"
    exit 1  # Change to 'exit 0' to only warn
```

Or use workflow inputs for dynamic behavior:

```yaml
inputs:
  fail-on-findings:
    description: 'Fail workflow if secrets found'
    required: false
    default: 'true'
```

---

## Advanced Setup

### Multiple Repositories

To scan multiple repositories in your organization:

1. **Option A: GitHub App (Recommended)**
   - Install the Secret Scan GitHub App
   - Grant access to repositories
   - All repos automatically get scanning

2. **Option B: Workflow Template**
   - Create a `.github` repository in your org
   - Add `workflow-templates/secret-scan.yml`
   - Makes it easy for teams to add scanning

3. **Option C: Manual Per-Repo**
   - Follow the quick setup for each repository
   - Can use the same API key across repos

### Custom Dashboard URL (Self-Hosted)

If you're running the dashboard on your own infrastructure:

```yaml
env:
  DASHBOARD_API_URL: https://secret-scan.yourcompany.com
  DASHBOARD_API_KEY: ${{ secrets.DASHBOARD_API_KEY }}
```

### Integration with GitHub Security

Enable GitHub Security features:

```yaml
permissions:
  contents: read
  security-events: write  # For SARIF upload
  pull-requests: write
  statuses: write

steps:
  - name: Upload to GitHub Security
    if: always()
    uses: github/codeql-action/upload-sarif@v2
    with:
      sarif_file: results.sarif
```

### Monorepo Configuration

For monorepos, scan specific directories:

```yaml
- name: Scan Specific Services
  run: |
    for service in services/*; do
      echo "Scanning $service..."
      gitleaks detect --source "$service" \
        --report-format json \
        --report-path "results-$(basename $service).json"
    done
```

---

## Troubleshooting

### Workflow Not Running

**Problem**: Workflow doesn't trigger on pull requests

**Solutions**:
1. Check that Actions are enabled in repository settings
2. Verify workflow file is in `.github/workflows/` directory
3. Ensure workflow YAML syntax is valid
4. Check branch protection rules

### API Connection Errors

**Problem**: "Failed to send report (HTTP 401)"

**Solutions**:
1. Verify `DASHBOARD_API_KEY` secret is set correctly
2. Check that API key hasn't been revoked
3. Ensure API key has correct permissions
4. Test API connection manually:

```bash
curl -X POST https://api.example.com/api/v1/scans \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### False Positives

**Problem**: Too many false positive findings

**Solutions**:
1. Add patterns to `.gitleaks.toml` allowlist
2. Use stopwords for common test data
3. Mark findings as false positive in dashboard
4. Adjust rule sensitivity

### Performance Issues

**Problem**: Scans take too long for large repositories

**Solutions**:
1. Enable incremental scanning (changed files only)
2. Exclude large binary files or dependencies
3. Reduce history depth for scheduled scans
4. Use caching for dependencies

```yaml
- name: Get changed files
  id: changed-files
  uses: tj-actions/changed-files@v40

- name: Scan only changed files
  if: github.event_name == 'pull_request'
  run: |
    gitleaks detect --no-git \
      --files="${{ steps.changed-files.outputs.all_changed_files }}"
```

### Missing Secrets

**Problem**: Known secrets not being detected

**Solutions**:
1. Check if file is in allowlist/exclude paths
2. Verify Gitleaks rule patterns
3. Test rule manually with `gitleaks detect`
4. Update Gitleaks version
5. Enable verbose logging for debugging

---

## Best Practices

### 1. Security

- ✅ Always use GitHub Secrets for API keys
- ✅ Rotate API keys regularly
- ✅ Use different keys for prod/staging
- ✅ Limit API key permissions
- ❌ Never commit API keys in workflow files

### 2. Team Workflow

- ✅ Notify team about history rewrites
- ✅ Document secret rotation procedures
- ✅ Assign ownership for findings
- ✅ Regular security reviews
- ❌ Don't ignore scan failures

### 3. Configuration

- ✅ Start with default rules
- ✅ Gradually add custom rules
- ✅ Document all allowlist entries
- ✅ Review false positives periodically
- ❌ Don't over-exclude files

### 4. Remediation

- ✅ Rotate credentials immediately
- ✅ Remove from current code first
- ✅ Then clean from history
- ✅ Verify cleanup before force push
- ❌ Don't skip verification steps

---

## Getting Help

### Documentation
- [Full Documentation](./PROJECT_DOCUMENTATION.md)
- [Dashboard Mockups](./dashboard-mockup.md)
- [API Reference](https://docs.example.com/api)

### Support Channels
- **GitHub Discussions**: Ask questions and share tips
- **Slack Community**: Real-time help (#secret-scan)
- **Email Support**: support@example.com (Pro/Enterprise)
- **Issue Tracker**: Bug reports and feature requests

### Community Resources
- [Video Tutorials](https://youtube.com/example)
- [Blog Posts](https://blog.example.com/tag/secret-scan)
- [Example Repositories](https://github.com/secret-scan-examples)

---

## Next Steps

After setup is complete:

1. ✅ Run your first scan
2. ✅ Review findings in dashboard
3. ✅ Configure notifications (Slack/email)
4. ✅ Set up scheduled scans
5. ✅ Train team on remediation workflows
6. ✅ Integrate with CI/CD pipeline
7. ✅ Document your security procedures

---

**Need help?** Join our [community Slack](https://slack.example.com) or check out our [documentation](https://docs.example.com).

**Found a bug?** Report it on [GitHub Issues](https://github.com/yourorg/secret-scan/issues).

**Have a feature request?** Share it in [GitHub Discussions](https://github.com/yourorg/secret-scan/discussions).
