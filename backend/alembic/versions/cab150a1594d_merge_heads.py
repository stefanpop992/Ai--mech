"""merge_heads

Revision ID: cab150a1594d
Revises: add_car_documents, c5d6e7f8a9b0
Create Date: 2026-03-17 11:55:00.125085

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'cab150a1594d'
down_revision: Union[str, Sequence[str], None] = ('add_car_documents', 'c5d6e7f8a9b0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
