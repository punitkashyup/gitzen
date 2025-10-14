"""add_email_password_auth_support

Revision ID: 7a80fdf31643
Revises: badd5f08127f
Create Date: 2025-10-14 14:58:25.514166

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7a80fdf31643'
down_revision: Union[str, Sequence[str], None] = 'badd5f08127f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """
    Upgrade schema to support email/password authentication.
    
    Changes:
    - Add password_hash column for email auth
    - Add auth_provider enum column
    - Add email_verified boolean column
    - Add google_id column for future Google OAuth
    - Make github_id nullable (not required for email auth)
    - Add unique constraint on email
    - Add unique constraint on username
    - Update indexes
    """
    # Create auth_provider enum type
    auth_provider_enum = sa.Enum('email', 'github', 'google', name='authprovider')
    auth_provider_enum.create(op.get_bind(), checkfirst=True)
    
    # Add new columns
    op.add_column('users', sa.Column('password_hash', sa.String(length=255), nullable=True, comment='Bcrypt hash of password (only for email auth)'))
    op.add_column('users', sa.Column('auth_provider', auth_provider_enum, nullable=False, server_default='email', comment='Authentication provider (email, github, google)'))
    op.add_column('users', sa.Column('email_verified', sa.Boolean(), nullable=False, server_default='false', comment='Whether email has been verified'))
    op.add_column('users', sa.Column('google_id', sa.String(length=255), nullable=True, comment='Google user ID'))
    
    # Make github_id nullable for email auth users
    op.alter_column('users', 'github_id',
               existing_type=sa.BIGINT(),
               nullable=True)
    
    # Add unique constraint on email
    op.create_unique_constraint('uq_users_email', 'users', ['email'])
    
    # Add unique constraint on username
    op.create_unique_constraint('uq_users_username', 'users', ['username'])
    
    # Add unique constraint on google_id
    op.create_unique_constraint('uq_users_google_id', 'users', ['google_id'])
    
    # Add indexes
    op.create_index('ix_users_email', 'users', ['email'], unique=False)
    op.create_index('ix_users_auth_provider', 'users', ['auth_provider'], unique=False)
    op.create_index('ix_users_google_id', 'users', ['google_id'], unique=False)
    
    # Update existing GitHub OAuth users to have auth_provider='github' and email_verified=true
    op.execute("UPDATE users SET auth_provider = 'github', email_verified = true WHERE github_id IS NOT NULL")


def downgrade() -> None:
    """
    Downgrade schema to remove email/password authentication support.
    """
    # Drop indexes
    op.drop_index('ix_users_google_id', table_name='users')
    op.drop_index('ix_users_auth_provider', table_name='users')
    op.drop_index('ix_users_email', table_name='users')
    
    # Drop unique constraints
    op.drop_constraint('uq_users_google_id', 'users', type_='unique')
    op.drop_constraint('uq_users_username', 'users', type_='unique')
    op.drop_constraint('uq_users_email', 'users', type_='unique')
    
    # Make github_id non-nullable again
    op.alter_column('users', 'github_id',
               existing_type=sa.BIGINT(),
               nullable=False)
    
    # Drop new columns
    op.drop_column('users', 'google_id')
    op.drop_column('users', 'email_verified')
    op.drop_column('users', 'auth_provider')
    op.drop_column('users', 'password_hash')
    
    # Drop enum type
    auth_provider_enum = sa.Enum('email', 'github', 'google', name='authprovider')
    auth_provider_enum.drop(op.get_bind(), checkfirst=True)
