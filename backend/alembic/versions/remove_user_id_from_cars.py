"""remove user_id from cars

Revision ID: d4e2f1a83c91
Revises: 6d57ab4ebee8
Create Date: 2026-03-06 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = 'd4e2f1a83c91'
down_revision: Union[str, Sequence[str], None] = '6d57ab4ebee8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # user_id was added by a previous migration but ownership is now handled
    # via the garages/garage_cars tables — remove it from cars
    op.drop_index('ix_cars_user_id', table_name='cars', if_exists=True)
    op.drop_constraint('fk_cars_user_id', 'cars', type_='foreignkey')
    op.drop_column('cars', 'user_id')


def downgrade() -> None:
    op.add_column('cars', sa.Column('user_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_cars_user_id', 'cars', 'users', ['user_id'], ['id'], ondelete='CASCADE')
    op.create_index('ix_cars_user_id', 'cars', ['user_id'])
