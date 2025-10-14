"""Initial schema: users, repositories, scans, findings, false_positives

Revision ID: badd5f08127f
Revises: 
Create Date: 2025-10-14 12:00:36.789500

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'badd5f08127f'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema - Create all tables."""
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, comment='Primary key'),
        sa.Column('github_id', sa.BigInteger(), nullable=False, unique=True, comment='GitHub user ID'),
        sa.Column('username', sa.String(255), nullable=False, comment='GitHub username'),
        sa.Column('email', sa.String(255), nullable=True, comment='User email address'),
        sa.Column('avatar_url', sa.String(), nullable=True, comment='GitHub avatar URL'),
        sa.Column('access_token_hash', sa.String(64), nullable=True, comment='SHA-256 hash of access token'),
        sa.Column('role', sa.String(50), nullable=False, server_default='user', comment='User role (user, admin)'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true', comment='Whether user account is active'),
        sa.Column('last_login_at', sa.DateTime(timezone=True), nullable=True, comment='Last login timestamp'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record last update timestamp'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (NULL if active)'),
    )
    op.create_index('idx_users_github_id', 'users', ['github_id'])
    op.create_index('idx_users_username', 'users', ['username'])
    op.create_index('idx_users_deleted_at', 'users', ['deleted_at'])
    
    # Create repositories table
    op.create_table(
        'repositories',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, comment='Primary key'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to users table'),
        sa.Column('github_repo_id', sa.BigInteger(), nullable=False, unique=True, comment='GitHub repository ID'),
        sa.Column('owner', sa.String(255), nullable=False, comment='Repository owner username'),
        sa.Column('name', sa.String(255), nullable=False, comment='Repository name'),
        sa.Column('full_name', sa.String(512), nullable=False, comment='Full repository name (owner/repo)'),
        sa.Column('description', sa.String(), nullable=True, comment='Repository description'),
        sa.Column('is_private', sa.Boolean(), nullable=False, server_default='false', comment='Whether repository is private'),
        sa.Column('default_branch', sa.String(255), nullable=False, server_default='main', comment='Default branch name'),
        sa.Column('language', sa.String(100), nullable=True, comment='Primary programming language'),
        sa.Column('stars_count', sa.Integer(), nullable=False, server_default='0', comment='Number of stars'),
        sa.Column('last_scanned_at', sa.DateTime(timezone=True), nullable=True, comment='Last scan timestamp'),
        sa.Column('scan_enabled', sa.Boolean(), nullable=False, server_default='true', comment='Whether scanning is enabled'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record last update timestamp'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (NULL if active)'),
        sa.UniqueConstraint('user_id', 'github_repo_id', name='unique_repo_per_user'),
    )
    op.create_index('idx_repositories_user_id', 'repositories', ['user_id'])
    op.create_index('idx_repositories_github_repo_id', 'repositories', ['github_repo_id'])
    op.create_index('idx_repositories_full_name', 'repositories', ['full_name'])
    op.create_index('idx_repositories_deleted_at', 'repositories', ['deleted_at'])
    
    # Create scans table
    op.create_table(
        'scans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, comment='Primary key'),
        sa.Column('repository_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('repositories.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to repositories table'),
        sa.Column('commit_sha', sa.String(40), nullable=False, comment='Git commit SHA'),
        sa.Column('branch', sa.String(255), nullable=False, comment='Branch name'),
        sa.Column('pr_number', sa.Integer(), nullable=True, comment='Pull request number (NULL for non-PR scans)'),
        sa.Column('scan_type', sa.String(50), nullable=False, comment='Type of scan (push, pull_request, manual)'),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending', comment='Scan status (pending, running, completed, failed)'),
        sa.Column('total_files_scanned', sa.Integer(), nullable=False, server_default='0', comment='Number of files scanned'),
        sa.Column('total_findings', sa.Integer(), nullable=False, server_default='0', comment='Total number of findings'),
        sa.Column('high_severity_count', sa.Integer(), nullable=False, server_default='0', comment='Count of high severity findings'),
        sa.Column('medium_severity_count', sa.Integer(), nullable=False, server_default='0', comment='Count of medium severity findings'),
        sa.Column('low_severity_count', sa.Integer(), nullable=False, server_default='0', comment='Count of low severity findings'),
        sa.Column('scan_duration_ms', sa.Integer(), nullable=True, comment='Scan duration in milliseconds'),
        sa.Column('error_message', sa.String(), nullable=True, comment='Error message if scan failed'),
        sa.Column('github_action_run_id', sa.BigInteger(), nullable=True, comment='GitHub Action run ID'),
        sa.Column('triggered_by', sa.String(255), nullable=True, comment='Username who triggered the scan'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True, comment='Scan start timestamp'),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True, comment='Scan completion timestamp'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record last update timestamp'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (NULL if active)'),
    )
    op.create_index('idx_scans_repository_id', 'scans', ['repository_id'])
    op.create_index('idx_scans_commit_sha', 'scans', ['commit_sha'])
    op.create_index('idx_scans_status', 'scans', ['status'])
    op.create_index('idx_scans_created_at', 'scans', [sa.text('created_at DESC')])
    op.create_index('idx_scans_pr_number', 'scans', ['pr_number'])
    op.create_index('idx_scans_deleted_at', 'scans', ['deleted_at'])
    
    # Create findings table
    op.create_table(
        'findings',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, comment='Primary key'),
        sa.Column('scan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('scans.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to scans table'),
        sa.Column('repository_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('repositories.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to repositories table'),
        sa.Column('file_path', sa.String(), nullable=False, comment='Path to file containing the finding'),
        sa.Column('line_number', sa.Integer(), nullable=False, comment='Line number where secret was found'),
        sa.Column('start_column', sa.Integer(), nullable=True, comment='Starting column position'),
        sa.Column('end_column', sa.Integer(), nullable=True, comment='Ending column position'),
        sa.Column('secret_type', sa.String(100), nullable=False, comment='Type of secret detected'),
        sa.Column('match_text_hash', sa.String(64), nullable=False, comment='SHA-256 hash of the matched text (NEVER the actual secret)'),
        sa.Column('rule_id', sa.String(255), nullable=True, comment='Gitleaks rule ID that detected the secret'),
        sa.Column('entropy', sa.Float(), nullable=True, comment='Entropy score of the match'),
        sa.Column('context_before', sa.String(), nullable=True, comment='Sanitized line before the match (no secrets)'),
        sa.Column('context_after', sa.String(), nullable=True, comment='Sanitized line after the match (no secrets)'),
        sa.Column('commit_sha', sa.String(40), nullable=True, comment='Git commit SHA where secret was found'),
        sa.Column('commit_author', sa.String(255), nullable=True, comment='Author of the commit'),
        sa.Column('commit_date', sa.DateTime(timezone=True), nullable=True, comment='Date of the commit'),
        sa.Column('status', sa.String(50), nullable=False, server_default='active', comment='Finding status (active, resolved, false_positive, ignored)'),
        sa.Column('severity', sa.String(20), nullable=False, server_default='high', comment='Severity level (high, medium, low)'),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True, comment='Timestamp when finding was resolved'),
        sa.Column('resolved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True, comment='User ID who resolved the finding'),
        sa.Column('resolution_note', sa.String(), nullable=True, comment='Note explaining the resolution'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record last update timestamp'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (NULL if active)'),
        sa.UniqueConstraint('scan_id', 'file_path', 'line_number', 'match_text_hash', name='unique_finding_per_scan'),
    )
    op.create_index('idx_findings_scan_id', 'findings', ['scan_id'])
    op.create_index('idx_findings_repository_id', 'findings', ['repository_id'])
    op.create_index('idx_findings_file_path', 'findings', ['file_path'])
    op.create_index('idx_findings_secret_type', 'findings', ['secret_type'])
    op.create_index('idx_findings_status', 'findings', ['status'])
    op.create_index('idx_findings_severity', 'findings', ['severity'])
    op.create_index('idx_findings_match_hash', 'findings', ['match_text_hash'])
    op.create_index('idx_findings_created_at', 'findings', [sa.text('created_at DESC')])
    op.create_index('idx_findings_deleted_at', 'findings', ['deleted_at'])
    
    # Create false_positives table
    op.create_table(
        'false_positives',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, comment='Primary key'),
        sa.Column('repository_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('repositories.id', ondelete='CASCADE'), nullable=True, comment='Foreign key to repositories table (NULL for global scope)'),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, comment='Foreign key to users table (who marked it)'),
        sa.Column('secret_type', sa.String(100), nullable=False, comment='Type of secret'),
        sa.Column('pattern_hash', sa.String(64), nullable=False, comment='SHA-256 hash of the pattern'),
        sa.Column('file_path_pattern', sa.String(), nullable=True, comment='Optional glob pattern for file paths'),
        sa.Column('reason', sa.String(), nullable=True, comment="User's reason for marking as false positive"),
        sa.Column('scope', sa.String(50), nullable=False, server_default='repository', comment='Scope of the false positive (repository, global)'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true', comment='Whether this false positive is active'),
        sa.Column('times_matched', sa.Integer(), nullable=False, server_default='0', comment='Number of times this pattern has been matched'),
        sa.Column('last_matched_at', sa.DateTime(timezone=True), nullable=True, comment='Last time this pattern was matched'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record creation timestamp'),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False, comment='Record last update timestamp'),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True, comment='Soft delete timestamp (NULL if active)'),
        sa.UniqueConstraint('repository_id', 'pattern_hash', name='unique_false_positive'),
    )
    op.create_index('idx_false_positives_repository_id', 'false_positives', ['repository_id'])
    op.create_index('idx_false_positives_user_id', 'false_positives', ['user_id'])
    op.create_index('idx_false_positives_pattern_hash', 'false_positives', ['pattern_hash'])
    op.create_index('idx_false_positives_secret_type', 'false_positives', ['secret_type'])
    op.create_index('idx_false_positives_scope', 'false_positives', ['scope'])
    op.create_index('idx_false_positives_deleted_at', 'false_positives', ['deleted_at'])


def downgrade() -> None:
    """Downgrade schema - Drop all tables in reverse order."""
    op.drop_table('false_positives')
    op.drop_table('findings')
    op.drop_table('scans')
    op.drop_table('repositories')
    op.drop_table('users')
