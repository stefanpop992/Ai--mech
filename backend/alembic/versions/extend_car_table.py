"""extend cars table with biluppgifter data

Revision ID: extend_cars_table
Revises: add_car_documents
Create Date: 2026-03-19
"""

import sqlalchemy as sa
from alembic import op

revision = "extend_cars_table"
down_revision = "add_car_documents"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("cars", sa.Column("variant", sa.String(128), nullable=True))
    op.add_column("cars", sa.Column("vin", sa.String(32), nullable=True))
    op.add_column("cars", sa.Column("color", sa.String(64), nullable=True))
    op.add_column("cars", sa.Column("status", sa.String(32), nullable=True))
    op.add_column("cars", sa.Column("transmission", sa.String(32), nullable=True))
    op.add_column("cars", sa.Column("fuel", sa.String(32), nullable=True))
    op.add_column("cars", sa.Column("power_hp", sa.Integer(), nullable=True))
    op.add_column("cars", sa.Column("power_kw", sa.Integer(), nullable=True))
    op.add_column("cars", sa.Column("kerb_weight", sa.Integer(), nullable=True))
    op.add_column("cars", sa.Column("length", sa.Integer(), nullable=True))
    op.add_column("cars", sa.Column("width", sa.Integer(), nullable=True))
    op.add_column("cars", sa.Column("meter", sa.Integer(), nullable=True))
    op.add_column("cars", sa.Column("inspection", sa.String(16), nullable=True))
    op.add_column(
        "cars", sa.Column("inspection_valid_until", sa.String(16), nullable=True)
    )
    op.add_column("cars", sa.Column("manufactured", sa.String(16), nullable=True))
    op.add_column(
        "cars", sa.Column("manufactured_country", sa.String(64), nullable=True)
    )
    op.add_column("cars", sa.Column("registered", sa.String(16), nullable=True))
    op.add_column("cars", sa.Column("tyre_front", sa.String(64), nullable=True))
    op.add_column("cars", sa.Column("tyre_rear", sa.String(64), nullable=True))
    op.add_column("cars", sa.Column("raw_data", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("cars", "raw_data")
    op.drop_column("cars", "tyre_rear")
    op.drop_column("cars", "tyre_front")
    op.drop_column("cars", "registered")
    op.drop_column("cars", "manufactured_country")
    op.drop_column("cars", "manufactured")
    op.drop_column("cars", "inspection_valid_until")
    op.drop_column("cars", "inspection")
    op.drop_column("cars", "meter")
    op.drop_column("cars", "width")
    op.drop_column("cars", "length")
    op.drop_column("cars", "kerb_weight")
    op.drop_column("cars", "power_kw")
    op.drop_column("cars", "power_hp")
    op.drop_column("cars", "fuel")
    op.drop_column("cars", "transmission")
    op.drop_column("cars", "status")
    op.drop_column("cars", "color")
    op.drop_column("cars", "vin")
    op.drop_column("cars", "variant")
