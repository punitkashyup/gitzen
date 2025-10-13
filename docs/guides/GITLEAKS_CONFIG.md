# Gitleaks Configuration Guide

This guide explains how GitZen's `.gitleaks.toml` configuration prevents false positives while maintaining high detection accuracy.

## Table of Contents

- [Overview](#overview)
- [Path Exclusions](#path-exclusions)
- [Regex Allowlist](#regex-allowlist)
- [Stopwords](#stopwords)
- [Custom Rules](#custom-rules)
- [Hash-Based Allowlisting](#hash-based-allowlisting)
- [Common Use Cases](#common-use-cases)
- [Troubleshooting](#troubleshooting)

## Overview

The `.gitleaks.toml` file configures Gitleaks to:

1. **Exclude paths** that commonly contain false positives (dependencies, build artifacts, etc.)
2. **Allow regex patterns** for test/example data
3. **Filter stopwords** that indicate non-production secrets
4. **Add custom rules** for organization-specific secret patterns
5. **Allowlist specific secrets** by hash (for known false positives)

## Path Exclusions

Path exclusions prevent Gitleaks from scanning files that are unlikely to contain real secrets.

### Configuration Format

```toml
[allowlist]
paths = [
    '''pattern1''',
    '''pattern2''',
]
```

### Supported Patterns

GitZen excludes 50+ common patterns by default:

#### Dependency Directories

```toml
'''node_modules/'''      # Node.js packages
'''vendor/'''            # Go/PHP dependencies
'''bower_components/'''  # Bower packages
'''jspm_packages/'''     # JSPM packages
'''.pnpm-store/'''       # pnpm cache
'''.yarn/'''             # Yarn v2+ cache
'''go/pkg/mod/'''        # Go modules cache
'''venv/'''              # Python virtual env
'''env/'''               # Python virtual env (alt)
'''.virtualenv/'''       # Python virtual env (alt)
```

#### Build Artifacts

```toml
'''dist/'''              # Distribution builds
'''build/'''             # Build output
'''out/'''               # Output directory
'''target/'''            # Rust/Java builds
'''.next/'''             # Next.js build cache
'''.nuxt/'''             # Nuxt.js build cache
'''\.min\.js$'''         # Minified JavaScript
'''\.min\.css$'''        # Minified CSS
'''\.bundle\.js$'''      # Webpack bundles
'''\.chunk\.js$'''       # Code-split chunks
'''coverage/'''          # Test coverage reports
'''.nyc_output/'''       # NYC coverage data
```

#### IDE and Editor Files

```toml
'''.vscode/'''           # VS Code settings
'''.idea/'''             # JetBrains IDE settings
'''\.swp$'''             # Vim swap files
'''\.swo$'''             # Vim swap files
'''\.swn$'''             # Vim swap files
'''\.DS_Store$'''        # macOS metadata
'''Thumbs\.db$'''        # Windows thumbnails
'''desktop\.ini$'''      # Windows folder settings
```

#### Version Control

```toml
'''.git/'''              # Git internal files
'''.svn/'''              # Subversion files
'''.hg/'''               # Mercurial files
```

#### Lock Files

```toml
'''\.lock$'''            # Generic lock files
'''package-lock\.json$''' # npm lock
'''yarn\.lock$'''        # Yarn lock
'''Pipfile\.lock$'''     # Python Pipenv lock
'''poetry\.lock$'''      # Python Poetry lock
'''Gemfile\.lock$'''     # Ruby Bundler lock
'''composer\.lock$'''    # PHP Composer lock
'''Cargo\.lock$'''       # Rust Cargo lock
'''go\.sum$'''           # Go checksums
```

#### Generated Code

```toml
'''__pycache__/'''       # Python bytecode cache
'''\.pyc$'''             # Python compiled files
'''\.pyo$'''             # Python optimized files
'''\.class$'''           # Java bytecode
'''\.o$'''               # Object files
'''\.so$'''              # Shared objects (Linux)
'''\.dylib$'''           # Dynamic libraries (macOS)
'''\.dll$'''             # Dynamic libraries (Windows)
'''.output/'''           # Nitro output
```

#### Test Fixtures

```toml
'''fixtures/'''          # Test fixtures
'''__fixtures__/'''      # Test fixtures (alt)
'''test/fixtures/'''     # Test fixtures in test dir
'''mocks/'''             # Mock data
'''__mocks__/'''         # Mock data (alt)
'''stubs/'''             # Test stubs
'''\.fixture\.js$'''     # Fixture files
'''\.mock\.json$'''      # Mock JSON files
'''\.stub\.'''           # Stub files
```

#### Documentation

```toml
'''\.md$'''              # Markdown files
'''docs/api/'''          # API documentation
'''docs/generated/'''    # Generated docs
'''.docusaurus/'''       # Docusaurus cache
'''.vuepress/dist/'''    # VuePress build
```

**Note:** Markdown files are excluded by default. If you store secrets in docs (don't!), remove this pattern.

#### Media Files

```toml
'''\.jpg$'''             # JPEG images
'''\.jpeg$'''            # JPEG images
'''\.png$'''             # PNG images
'''\.gif$'''             # GIF images
'''\.svg$'''             # SVG images
'''\.ico$'''             # Icons
'''\.mp4$'''             # MP4 videos
'''\.avi$'''             # AVI videos
'''\.mov$'''             # MOV videos
'''\.webm$'''            # WebM videos
'''\.mp3$'''             # MP3 audio
'''\.wav$'''             # WAV audio
'''\.woff$'''            # Web fonts
'''\.woff2$'''           # Web fonts v2
'''\.ttf$'''             # TrueType fonts
'''\.eot$'''             # Embedded OpenType fonts
```

#### Archives

```toml
'''\.zip$'''             # ZIP archives
'''\.tar$'''             # TAR archives
'''\.tar\.gz$'''         # Gzipped TAR archives
'''\.tgz$'''             # Gzipped TAR (short)
'''\.rar$'''             # RAR archives
'''\.7z$'''              # 7-Zip archives
```

#### Temporary Files

```toml
'''tmp/'''               # Temporary directory
'''temp/'''              # Temporary directory (alt)
'''\.tmp$'''             # Temporary files
'''.cache/'''            # Cache directory
'''.parcel-cache/'''     # Parcel bundler cache
'''\.log$'''             # Log files
'''\.pid$'''             # Process ID files
```

### Adding Custom Path Exclusions

Add project-specific exclusions to the `paths` array:

```toml
[allowlist]
paths = [
    # ... existing patterns ...
    
    # Custom exclusions for your project
    '''my-custom-lib/'''        # Custom library
    '''generated-schemas/'''    # Generated code
    '''legacy-code/'''          # Legacy codebase (temporary)
]
```

## Regex Allowlist

Regex patterns match secret-like strings that are actually test data or documentation.

### Configuration Format

```toml
[allowlist]
regexes = [
    '''pattern1''',
    '''pattern2''',
]
```

### Default Patterns

#### Test/Example Secrets

```toml
# AWS keys with "test" indicator
'''(?i)(AKIA|ghp_|glpat-).*test'''
'''(?i)test.*(AKIA|ghp_|glpat-)'''
```

#### Localhost and Development

```toml
'''localhost'''
'''127\.0\.0\.1'''
'''0\.0\.0\.0'''
'''http://localhost'''
'''https://localhost'''
'''localhost:\d+'''
```

#### Example Domains

```toml
'''example\.(com|org|net)'''
'''(test|demo)\.com'''
'''yoursite\.com'''
'''yourcompany\.(com|org)'''
```

#### Placeholder Patterns

```toml
# Common placeholder text
'''(?i)your[_-]?api[_-]?key[_-]?here'''
'''(?i)replace[_-]?with[_-]?actual'''
'''(?i)INSERT[_-]?[A-Z]+[_-]?HERE'''
'''(?i)enter[_-]?your[_-]?[a-z]+[_-]?here'''

# Environment variable syntax
'''\$\{[A-Z_]+\}'''          # ${API_KEY}
'''%ENV_[A-Z_]+%'''          # %ENV_API_KEY%
'''\$[A-Z_]+'''              # $API_KEY
```

#### Documentation Placeholders

```toml
'''<YOUR_[A-Z_]+>'''         # <YOUR_API_KEY>
'''\[YOUR_[A-Z_]+\]'''       # [YOUR_API_KEY]
'''<INSERT_[A-Z_]+>'''       # <INSERT_KEY>
'''\{YOUR_[A-Z_]+\}'''       # {YOUR_TOKEN}
```

#### Test Data

```toml
'''(?i)(test|dummy|fake|sample|mock)[_-]?(secret|token|password|key|api)'''
'''(?i)(secret|token|password|key|api)[_-]?(test|dummy|fake|sample|mock)'''
```

#### Base64 Test Data

```toml
'''dGVzdA=='''               # base64("test")
'''ZXhhbXBsZQ=='''           # base64("example")
'''ZHVtbXk='''               # base64("dummy")
'''c2FtcGxl'''               # base64("sample")
```

### Adding Custom Regex Patterns

```toml
[allowlist]
regexes = [
    # ... existing patterns ...
    
    # Company-specific patterns
    '''(?i)acme-corp-test-token-[a-z0-9]+''',
    '''(?i)staging\.mycompany\.com''',
]
```

## Stopwords

Stopwords are strings that, when found in a secret, indicate it's not production data.

### Configuration Format

```toml
[allowlist]
stopwords = [
    "word1",
    "word2",
]
```

### Default Stopwords (30+)

```toml
stopwords = [
    # Test indicators
    "example",
    "test",
    "dummy",
    "fake",
    "sample",
    "placeholder",
    "mock",
    "fixture",
    "stub",
    "template",
    "demo",
    
    # Environment indicators
    "development",
    "dev",
    "local",
    "staging",
    
    # Placeholder patterns
    "xxx",
    "yyy",
    "zzz",
    "abc123",
    "password123",
    "changeme",
    "fixme",
    "temporary",
    "temp",
    
    # Documentation markers
    "redacted",
    "censored",
    "hidden",
    "not-a-real-secret",
    "please-change",
    "insert-key-here",
    "add-your-key",
]
```

### How Stopwords Work

If any stopword appears in a secret value, Gitleaks will skip it. For example:

- `API_KEY="test-123"` → Skipped (contains "test")
- `TOKEN="example_token"` → Skipped (contains "example")
- `SECRET="dummy-password"` → Skipped (contains "dummy")
- `REAL_KEY="prod-abc-xyz"` → **DETECTED** (no stopwords)

### Adding Custom Stopwords

```toml
[allowlist]
stopwords = [
    # ... existing stopwords ...
    
    # Company-specific stopwords
    "acme-test",
    "internal-dev",
    "sandbox",
]
```

## Custom Rules

Define organization-specific secret patterns.

### Rule Format

```toml
[[rules]]
id = "unique-rule-id"
description = "What this rule detects"
regex = '''pattern'''
tags = ["tag1", "tag2"]
keywords = ["keyword1", "keyword2"]
entropy = 3.5  # Optional: minimum entropy threshold
```

### Default Custom Rules

#### API Key Pattern

```toml
[[rules]]
id = "custom-api-key-pattern"
description = "Custom API key format"
regex = '''(?i)(api[_-]?key|apikey)["\s:=]+([a-z0-9]{32,})'''
tags = ["api-key", "high"]
keywords = ["api_key", "apikey", "api-key"]
```

#### Bearer Token

```toml
[[rules]]
id = "custom-bearer-token"
description = "Bearer token in Authorization header"
regex = '''(?i)Bearer\s+([a-zA-Z0-9\-_\.]+)'''
tags = ["bearer-token", "high"]
keywords = ["Bearer"]
```

#### Private Key Header

```toml
[[rules]]
id = "custom-private-key-header"
description = "Private key file headers"
regex = '''-----BEGIN\s+(RSA|EC|OPENSSH|DSA|PGP)\s+PRIVATE\s+KEY-----'''
tags = ["private-key", "critical"]
keywords = ["PRIVATE KEY"]
```

### Adding Your Own Rules

```toml
[[rules]]
id = "company-internal-token"
description = "Company's internal service token format"
regex = '''(?i)ACME-[A-Z]{3}-[0-9]{10}-[a-f0-9]{32}'''
tags = ["internal-token", "high"]
keywords = ["ACME-"]
entropy = 4.0
```

## Hash-Based Allowlisting

For specific known false positives that can't be filtered by regex or path.

### Step 1: Calculate Secret Hash

```bash
echo -n "your_secret_value" | sha256sum | cut -d' ' -f1
# Output: 5f4dcc3b5aa765d61d8327deb882cf99...
```

### Step 2: Add to Allowlist

#### By Commit (Recommended)

```toml
[allowlist.commits]
commits = [
    "abc123def456...",  # Commit hash with known false positive
]
```

This allowlists all findings in that specific commit.

#### By Regex (For Hash Matching)

```toml
[allowlist.regexes]
regexes = [
    # ... other patterns ...
    
    # Allowlist specific secret hash
    '''5f4dcc3b5aa765d61d8327deb882cf99''',
]
```

### Example: Allowlisting a Test Secret

```bash
# 1. Find the secret in Gitleaks output
cat results.json | jq '.[] | select(.File == "test/data.js")'

# 2. Calculate hash of the secret value
echo -n "test_secret_12345" | sha256sum
# Output: abc123def456...

# 3. Add to .gitleaks.toml
[allowlist.regexes]
regexes = [
    '''abc123def456789...''',  # Hash of test_secret_12345
]
```

## Common Use Cases

### Monorepo with Multiple Languages

```toml
[allowlist]
paths = [
    # Node.js app
    '''apps/frontend/node_modules/''',
    '''apps/frontend/dist/''',
    
    # Python service
    '''services/api/venv/''',
    '''services/api/__pycache__/''',
    
    # Go microservice
    '''services/worker/vendor/''',
    '''services/worker/target/''',
    
    # Shared packages
    '''packages/*/dist/''',
]
```

### Documentation Site with Examples

```toml
[allowlist]
paths = [
    '''docs/examples/'''     # All examples
    '''.docusaurus/'''       # Docusaurus cache
]

regexes = [
    '''docs\.example\.com''',
    '''(?i)code-example-[0-9]+''',
]

stopwords = [
    "documentation",
    "code-sample",
]
```

### Open Source Project

```toml
[allowlist]
paths = [
    '''examples/'''          # Example code
    '''samples/'''           # Sample code
    '''.example$'''          # .env.example, etc.
]

regexes = [
    '''(?i)replace-with-your''',
    '''(?i)enter-your''',
]

stopwords = [
    "example",
    "sample",
    "demo",
    "your-key-here",
]
```

## Troubleshooting

### False Positives Not Being Filtered

**Problem:** Secrets in test files are still detected.

**Solutions:**

1. Check if path is excluded:
   ```bash
   grep -r "fixtures/" .gitleaks.toml
   ```

2. Add more specific path exclusion:
   ```toml
   '''test/unit/fixtures/'''
   ```

3. Add regex pattern for the specific format:
   ```toml
   '''(?i)test-data-[a-z0-9]+'''
   ```

4. Add stopword if there's a common indicator:
   ```toml
   stopwords = ["test-data"]
   ```

### Real Secrets Not Being Detected

**Problem:** Known secrets are not being found.

**Solutions:**

1. Check if path is accidentally excluded:
   ```bash
   # View all excluded paths
   grep "paths = \[" -A 100 .gitleaks.toml
   ```

2. Check if secret matches an allowlist regex:
   ```bash
   # View all regex patterns
   grep "regexes = \[" -A 100 .gitleaks.toml
   ```

3. Check if secret contains a stopword:
   ```bash
   # View all stopwords
   grep "stopwords = \[" -A 50 .gitleaks.toml
   ```

4. Test with a simple scan:
   ```bash
   echo 'const KEY = "AKIAIOSFODNN7EXAMPLE";' > test.js
   gitleaks detect --source . --config .gitleaks.toml --no-git
   ```

### Entropy-Based False Positives

**Problem:** Base64-encoded data or hashes are detected as secrets.

**Solutions:**

1. Increase entropy threshold for specific rules:
   ```toml
   [[rules]]
   id = "generic-api-key"
   entropy = 4.5  # Increase from default 3.5
   ```

2. Exclude specific file types:
   ```toml
   [allowlist]
   paths = [
       '''\.hash$'''        # Hash files
       '''\.b64$'''         # Base64 files
   ]
   ```

3. Add regex for known hash formats:
   ```toml
   [allowlist]
   regexes = [
       '''[a-f0-9]{64}''',  # SHA-256 hashes
       '''[a-f0-9]{40}''',  # SHA-1 hashes
   ]
   ```

### Testing Your Configuration

Run the exclusion test suite:

```bash
./scripts/test-exclusions.sh
```

This validates that:
- Common paths are excluded
- Stopwords work correctly
- Real secrets are still detected

## Best Practices

1. **Start Broad, Then Narrow**
   - Use default exclusions first
   - Add custom patterns as needed
   - Don't over-exclude

2. **Document Custom Rules**
   - Add comments explaining why patterns exist
   - Link to tickets/issues
   - Note expected secret format

3. **Test Changes**
   - Run `./scripts/test-exclusions.sh` after changes
   - Test on real repositories
   - Verify no regressions

4. **Review Regularly**
   - Audit allowlist quarterly
   - Remove obsolete patterns
   - Update for new frameworks/tools

5. **Use Hash-Based Allowlisting Sparingly**
   - Prefer regex/stopwords over hash allowlisting
   - Only use for specific, known false positives
   - Document why each hash is allowlisted

6. **Keep Secrets Out of Examples**
   - Use placeholders in documentation
   - Use `.example` files for configs
   - Never commit real secrets, even in tests

## Additional Resources

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [TOML Specification](https://toml.io/)
- [Regular Expressions Guide](https://regex101.com/)
- [GitZen Privacy Guide](../README.md#privacy--security)

## Support

For issues with GitZen configuration:
- Open an issue on GitHub
- Check existing issues for solutions
- Review test suite output for hints
