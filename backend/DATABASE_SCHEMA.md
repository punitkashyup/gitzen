# Gitzen Database Schema Design

## Overview

PostgreSQL 15+ database schema for storing scan results, findings, and user data with privacy-first design principles.

## Design Principles

1. **Privacy-First**: Never store actual secrets, only SHA-256 hashes
2. **UUIDs**: Use UUIDs for all primary keys for better distribution and security
3. **Timestamps**: Track created_at and updated_at for all tables
4. **Soft Deletes**: Support soft deletion with deleted_at timestamp
5. **Indexing**: Optimize for common query patterns
6. **Relationships**: Enforce referential integrity with foreign keys

## Tables

### 1. users

Stores user authentication and profile information.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    avatar_url TEXT,
    access_token_hash VARCHAR(64),  -- SHA-256 hash of access token
    role VARCHAR(50) DEFAULT 'user',  -- 'user', 'admin'
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_github_id ON users(github_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

### 2. repositories

Stores repository metadata linked to users.

```sql
CREATE TABLE repositories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    github_repo_id BIGINT UNIQUE NOT NULL,
    owner VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(512) NOT NULL,  -- owner/repo
    description TEXT,
    is_private BOOLEAN DEFAULT false,
    default_branch VARCHAR(255) DEFAULT 'main',
    language VARCHAR(100),
    stars_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMP WITH TIME ZONE,
    scan_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_repo_per_user UNIQUE(user_id, github_repo_id)
);

CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX idx_repositories_full_name ON repositories(full_name);
CREATE INDEX idx_repositories_deleted_at ON repositories(deleted_at) WHERE deleted_at IS NULL;
```

### 3. scans

Stores scan execution metadata and results.

```sql
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    commit_sha VARCHAR(40) NOT NULL,
    branch VARCHAR(255) NOT NULL,
    pr_number INTEGER,  -- NULL for non-PR scans
    scan_type VARCHAR(50) NOT NULL,  -- 'push', 'pull_request', 'manual'
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'running', 'completed', 'failed'
    total_files_scanned INTEGER DEFAULT 0,
    total_findings INTEGER DEFAULT 0,
    high_severity_count INTEGER DEFAULT 0,
    medium_severity_count INTEGER DEFAULT 0,
    low_severity_count INTEGER DEFAULT 0,
    scan_duration_ms INTEGER,  -- Duration in milliseconds
    error_message TEXT,
    github_action_run_id BIGINT,
    triggered_by VARCHAR(255),  -- GitHub username who triggered the scan
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_scans_repository_id ON scans(repository_id);
CREATE INDEX idx_scans_commit_sha ON scans(commit_sha);
CREATE INDEX idx_scans_status ON scans(status);
CREATE INDEX idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX idx_scans_pr_number ON scans(pr_number) WHERE pr_number IS NOT NULL;
CREATE INDEX idx_scans_deleted_at ON scans(deleted_at) WHERE deleted_at IS NULL;
```

### 4. findings

Stores individual secret detection findings.

**CRITICAL**: Never stores actual secrets, only SHA-256 hashes!

```sql
CREATE TABLE findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    
    -- Location information
    file_path TEXT NOT NULL,
    line_number INTEGER NOT NULL,
    start_column INTEGER,
    end_column INTEGER,
    
    -- Secret information (PRIVACY-SAFE)
    secret_type VARCHAR(100) NOT NULL,  -- 'aws_access_key', 'github_token', etc.
    match_text_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of the matched text
    rule_id VARCHAR(255),  -- Gitleaks rule ID
    entropy FLOAT,  -- Entropy score if calculated
    
    -- Context (sanitized)
    context_before TEXT,  -- Sanitized line before
    context_after TEXT,   -- Sanitized line after
    commit_sha VARCHAR(40),
    commit_author VARCHAR(255),
    commit_date TIMESTAMP WITH TIME ZONE,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'active',  -- 'active', 'resolved', 'false_positive', 'ignored'
    severity VARCHAR(20) DEFAULT 'high',  -- 'high', 'medium', 'low'
    
    -- Resolution tracking
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES users(id),
    resolution_note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_finding_per_scan UNIQUE(scan_id, file_path, line_number, match_text_hash)
);

CREATE INDEX idx_findings_scan_id ON findings(scan_id);
CREATE INDEX idx_findings_repository_id ON findings(repository_id);
CREATE INDEX idx_findings_file_path ON findings(file_path);
CREATE INDEX idx_findings_secret_type ON findings(secret_type);
CREATE INDEX idx_findings_status ON findings(status);
CREATE INDEX idx_findings_severity ON findings(severity);
CREATE INDEX idx_findings_match_hash ON findings(match_text_hash);
CREATE INDEX idx_findings_created_at ON findings(created_at DESC);
CREATE INDEX idx_findings_deleted_at ON findings(deleted_at) WHERE deleted_at IS NULL;
```

### 5. false_positives

Stores user-marked false positives for pattern learning.

```sql
CREATE TABLE false_positives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Pattern information
    secret_type VARCHAR(100) NOT NULL,
    pattern_hash VARCHAR(64) NOT NULL,  -- SHA-256 hash of the pattern
    file_path_pattern TEXT,  -- Optional: glob pattern for file paths
    reason TEXT,  -- User's reason for marking as false positive
    
    -- Scope
    scope VARCHAR(50) DEFAULT 'repository',  -- 'repository', 'global'
    is_active BOOLEAN DEFAULT true,
    
    -- Usage tracking
    times_matched INTEGER DEFAULT 0,
    last_matched_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT unique_false_positive UNIQUE(repository_id, pattern_hash)
);

CREATE INDEX idx_false_positives_repository_id ON false_positives(repository_id);
CREATE INDEX idx_false_positives_user_id ON false_positives(user_id);
CREATE INDEX idx_false_positives_pattern_hash ON false_positives(pattern_hash);
CREATE INDEX idx_false_positives_secret_type ON false_positives(secret_type);
CREATE INDEX idx_false_positives_scope ON false_positives(scope);
CREATE INDEX idx_false_positives_deleted_at ON false_positives(deleted_at) WHERE deleted_at IS NULL;
```

## Relationships

```
users (1) ────< (N) repositories
users (1) ────< (N) false_positives
users (1) ────< (N) findings (resolved_by)

repositories (1) ────< (N) scans
repositories (1) ────< (N) findings
repositories (1) ────< (N) false_positives

scans (1) ────< (N) findings
```

## Common Queries & Optimization

### 1. Get active findings for a repository
```sql
SELECT * FROM findings 
WHERE repository_id = ? 
  AND status = 'active' 
  AND deleted_at IS NULL
ORDER BY severity DESC, created_at DESC;
```

### 2. Get scan history for a repository
```sql
SELECT * FROM scans 
WHERE repository_id = ? 
  AND deleted_at IS NULL
ORDER BY created_at DESC 
LIMIT 50;
```

### 3. Get statistics by secret type
```sql
SELECT secret_type, severity, COUNT(*) as count
FROM findings 
WHERE repository_id = ? 
  AND status = 'active' 
  AND deleted_at IS NULL
GROUP BY secret_type, severity;
```

### 4. Check if pattern is a false positive
```sql
SELECT id FROM false_positives 
WHERE (repository_id = ? OR scope = 'global')
  AND pattern_hash = ? 
  AND is_active = true 
  AND deleted_at IS NULL
LIMIT 1;
```

## Data Retention & Privacy

1. **Secret Hashing**: All `match_text_hash` and `pattern_hash` fields use SHA-256
2. **Soft Deletes**: Use `deleted_at` timestamp instead of hard deletes
3. **Token Hashing**: User access tokens stored as `access_token_hash` (SHA-256)
4. **Context Sanitization**: `context_before` and `context_after` must be sanitized
5. **Audit Trail**: All tables have `created_at` and `updated_at` timestamps

## Migration Strategy

1. **Version Control**: Use Alembic for Python (SQLAlchemy)
2. **Rollback Support**: Every migration has an `upgrade()` and `downgrade()` function
3. **Testing**: Test migrations on dev/staging before production
4. **Backups**: Always backup before running migrations

## Future Enhancements

- **notifications** table for user alerts
- **scan_configs** table for custom scan configurations
- **audit_logs** table for compliance tracking
- **teams** table for organization support
- **webhooks** table for integration events
