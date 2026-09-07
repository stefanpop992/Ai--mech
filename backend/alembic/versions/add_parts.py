"""add parts table

Revision ID: add_parts
Revises: add_service_logs
Create Date: 2026-08-31
"""

import sqlalchemy as sa
from alembic import op

revision = "add_parts"
down_revision = "add_service_logs"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "parts",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column(
            "car_id",
            sa.Integer,
            sa.ForeignKey("cars.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        ),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        ),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("brand", sa.String(128), nullable=True),
        sa.Column("part_number", sa.String(128), nullable=True),
        sa.Column("quantity", sa.Integer, nullable=False, server_default="1"),
        sa.Column("vendor", sa.String(256), nullable=True),
        sa.Column("cost", sa.Numeric(10, 2), nullable=True),
        sa.Column("purchased_date", sa.Date, nullable=True),
        sa.Column("installed_date", sa.Date, nullable=True),
        sa.Column("mileage", sa.Integer, nullable=True),
        sa.Column(
            "status", sa.String(16), nullable=False, server_default="installed"
        ),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("parts")
