"""merge_heads

Revision ID: e3526242039c
Revises: cab150a1594d
Create Date: 2026-03-17 13:03:05.882859

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e3526242039c'
down_revision: Union[str, Sequence[str], None] = 'cab150a1594d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
