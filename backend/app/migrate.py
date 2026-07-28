import uuid

from sqlalchemy import Engine

# Columns added after the initial schema — SQLite's `Base.metadata.create_all`
# only creates missing tables, it never alters existing ones, so any column
# added to a model after the database file already exists needs an explicit
# ALTER TABLE here. Keep this list in sync with app/models.py.
NEW_COLUMNS: dict[str, list[tuple[str, str]]] = {
    "businesses": [
        ("fssai_no", "VARCHAR"),
        ("cst_date", "DATETIME"),
    ],
    "products": [
        ("hsn_code", "VARCHAR"),
        ("mrp", "FLOAT"),
        ("pack_size", "VARCHAR"),
    ],
    "invoices": [
        ("delivery_date", "DATETIME"),
        ("payment_mode", "VARCHAR"),
    ],
    "invoice_items": [
        ("hsn_code", "VARCHAR"),
        ("mrp", "FLOAT"),
        ("pack_size", "VARCHAR"),
        ("category_name", "VARCHAR"),
        ("cd_rate", "FLOAT DEFAULT 0"),
        ("td_rate", "FLOAT DEFAULT 0"),
        ("discount_amount", "FLOAT DEFAULT 0"),
        ("gift_note", "VARCHAR"),
        ("variant_id", "VARCHAR"),
    ],
    "purchase_items": [
        ("variant_id", "VARCHAR"),
    ],
    "product_variants": [
        ("is_loose", "BOOLEAN DEFAULT 0"),
    ],
}


def backfill_product_variants(engine: Engine) -> None:
    """One-time backfill for products created before per-pack-size variants
    existed: give each of them a single variant carrying over its own
    (now-legacy) price/cost_price/quantity/sku/mrp/pack_size columns, so
    existing inventory data keeps showing up instead of disappearing behind
    an empty variant list."""
    with engine.connect() as conn:
        rows = conn.exec_driver_sql(
            "SELECT id, pack_size, sku, price, cost_price, mrp, quantity FROM products "
            "WHERE id NOT IN (SELECT DISTINCT product_id FROM product_variants)"
        ).fetchall()
        for product_id, pack_size, sku, price, cost_price, mrp, quantity in rows:
            conn.exec_driver_sql(
                "INSERT INTO product_variants "
                "(id, product_id, pack_size, sku, price, cost_price, mrp, quantity, created_at, updated_at) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
                (uuid.uuid4().hex, product_id, pack_size, sku, price or 0, cost_price, mrp, quantity or 0),
            )
        conn.commit()


def run_migrations(engine: Engine) -> None:
    with engine.connect() as conn:
        for table, columns in NEW_COLUMNS.items():
            existing = {row[1] for row in conn.exec_driver_sql(f"PRAGMA table_info({table})")}
            for name, ddl_type in columns:
                if name not in existing:
                    conn.exec_driver_sql(f"ALTER TABLE {table} ADD COLUMN {name} {ddl_type}")
        conn.commit()
    backfill_product_variants(engine)
