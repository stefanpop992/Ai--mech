"""Keep personal vehicle edits on the garage membership."""
from alembic import op
import sqlalchemy as sa

revision = "add_garage_car_overrides"
down_revision = "add_parts"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("garage_cars", sa.Column("overrides", sa.JSON(), nullable=True))


def downgrade():
    op.drop_column("garage_cars", "overrides")
