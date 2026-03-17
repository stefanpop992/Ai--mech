"""add profile_picture and plan to users

Revision ID: add_user_settings
Revises: cab150a1594d
Create Date: 2026-03-17
"""

import sqlalchemy as sa
from alembic import op

revision = "add_user_settings"
down_revision = "e3526242039c"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_picture", sa.String(512), nullable=True))
    op.add_column(
        "users",
        sa.Column("plan", sa.String(20), nullable=False, server_default="free"),
    )


def downgrade() -> None:
    op.drop_column("users", "plan")
    op.drop_column("users", "profile_picture")
