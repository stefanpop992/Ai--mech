"""add_email_verification

Revision ID: c5d6e7f8a9b0
Revises: b9c3e2f1a4d7
Create Date: 2026-03-16 00:01:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c5d6e7f8a9b0'
down_revision: Union[str, Sequence[str], None] = 'b9c3e2f1a4d7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'))
    op.add_column('users', sa.Column('verification_token', sa.String(length=128), nullable=True))
    op.create_unique_constraint('uq_users_verification_token', 'users', ['verification_token'])


def downgrade() -> None:
    op.drop_constraint('uq_users_verification_token', 'users', type_='unique')
    op.drop_column('users', 'verification_token')
    op.drop_column('users', 'is_verified')
