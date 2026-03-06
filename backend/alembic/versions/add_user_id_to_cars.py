"""add user_id to cars

Revision ID: c3a1f8e92d47
Revises: b21ef2e9e4ab
Create Date: 2026-03-06 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'c3a1f8e92d47'
down_revision: Union[str, Sequence[str], None] = 'b21ef2e9e4ab'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add user_id as nullable first so existing rows don't immediately violate NOT NULL
    op.add_column('cars', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_cars_user_id', 'cars', 'users', ['user_id'], ['id'], ondelete='CASCADE')

    # Remove orphaned rows that have no valid user to assign to
    op.execute('DELETE FROM cars WHERE user_id IS NULL')

    # Make user_id non-nullable
    op.alter_column('cars', 'user_id', nullable=False)

    # Index for fast per-user queries
    op.create_index('ix_cars_user_id', 'cars', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_cars_user_id', table_name='cars')
    op.drop_constraint('fk_cars_user_id', 'cars', type_='foreignkey')
    op.drop_column('cars', 'user_id')
