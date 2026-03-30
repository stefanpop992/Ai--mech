"""add service log tables

Revision ID: add_service_logs
Revises: cab150a1594d
Create Date: 2026-03-30
"""

import sqlalchemy as sa
from alembic import op

revision = "add_service_logs"
down_revision = "cab150a1594d"  # ← ändra om du har nyare migrations
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "service_logs",
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
        sa.Column("service_date", sa.Date, nullable=False),
        sa.Column("mileage", sa.Integer, nullable=True),
        sa.Column("workshop", sa.String(256), nullable=True),
        sa.Column("cost", sa.Numeric(10, 2), nullable=True),
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

    op.create_table(
        "service_log_items",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column(
            "service_log_id",
            sa.Integer,
            sa.ForeignKey("service_logs.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        ),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("label", sa.String(128), nullable=False),
        sa.Column("checked", sa.Boolean, default=True),
    )

    op.create_table(
        "service_log_images",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column(
            "service_log_id",
            sa.Integer,
            sa.ForeignKey("service_logs.id", ondelete="CASCADE"),
            index=True,
            nullable=False,
        ),
        sa.Column("filename", sa.String(256), nullable=False),
        sa.Column("stored_path", sa.String(512), nullable=False),
        sa.Column("file_size", sa.Integer, nullable=False),
        sa.Column("mime_type", sa.String(128), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("service_log_images")
    op.drop_table("service_log_items")
    op.drop_table("service_logs")
