"""create car_documents table

Revision ID: add_car_documents
Revises: 8fe121a037cc
Create Date: 2026-03-16
"""

import sqlalchemy as sa
from alembic import op

revision = "add_car_documents"
down_revision = "8fe121a037cc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "car_documents",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column(
            "car_id",
            sa.Integer(),
            sa.ForeignKey("cars.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("category", sa.String(64), nullable=False),
        sa.Column("filename", sa.String(256), nullable=False),
        sa.Column("stored_path", sa.String(512), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(128), nullable=False),
        sa.Column(
            "uploaded_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("car_documents")
