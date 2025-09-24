from alembic import op
import sqlalchemy as sa

revision = "20250921_init"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    status_enum = sa.Enum("pending","processing","ready","failed", name="status")
    status_enum.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "diagnostics",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.String(length=128), nullable=False, index=True),
        sa.Column("status", status_enum, nullable=False, server_default="pending"),
        sa.Column("gcs_path", sa.String(length=512)),
        sa.Column("created_at", sa.DateTime, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, server_default=sa.func.now()),
    )
    op.create_index("ix_diagnostics_user_id", "diagnostics", ["user_id"])

def downgrade():
    op.drop_index("ix_diagnostics_user_id", table_name="diagnostics")
    op.drop_table("diagnostics")
    sa.Enum(name="status").drop(op.get_bind(), checkfirst=True)