import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def gen_id() -> str:
    return uuid.uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    businesses: Mapped[list["Business"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    user_id: Mapped[str] = mapped_column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String, nullable=True)
    logo: Mapped[str | None] = mapped_column(String, nullable=True)
    fssai_no: Mapped[str | None] = mapped_column(String, nullable=True)
    cst_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    owner: Mapped["User"] = relationship(back_populates="businesses")
    categories: Mapped[list["Category"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    products: Mapped[list["Product"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    customers: Mapped[list["Customer"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    suppliers: Mapped[list["Supplier"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    purchases: Mapped[list["Purchase"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    invoice_columns: Mapped[list["InvoiceColumn"]] = relationship(back_populates="business", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    business: Mapped["Business"] = relationship(back_populates="categories")
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id: Mapped[str | None] = mapped_column(String, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Shared across every pack size of this product.
    unit: Mapped[str] = mapped_column(String, nullable=False, default="pcs")
    gst_rate: Mapped[float] = mapped_column(Float, nullable=False, default=18)
    hsn_code: Mapped[str | None] = mapped_column(String, nullable=True)
    # Legacy per-product price/stock columns — superseded by ProductVariant
    # (a product can have several pack sizes, each with its own price/stock).
    # Kept only so this NOT NULL column stays satisfied on existing
    # databases; the API no longer reads or writes meaningful data here for
    # new products (see migrate.backfill_product_variants for old rows).
    sku: Mapped[str | None] = mapped_column(String, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    cost_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    mrp: Mapped[float | None] = mapped_column(Float, nullable=True)
    pack_size: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    business: Mapped["Business"] = relationship(back_populates="products")
    category: Mapped["Category | None"] = relationship(back_populates="products")
    variants: Mapped[list["ProductVariant"]] = relationship(back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    product_id: Mapped[str] = mapped_column(String, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    # A specific pack size (e.g. "50g", "1kg") — blank for products that
    # don't distinguish pack sizes and just have a single default variant.
    # Free text (may also be a price point like "₹10 Pack") — purely
    # descriptive, not what decides how invoice quantity is entered; see
    # is_loose for that.
    pack_size: Mapped[str | None] = mapped_column(String, nullable=True)
    sku: Mapped[str | None] = mapped_column(String, nullable=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    cost_price: Mapped[float | None] = mapped_column(Float, nullable=True)
    mrp: Mapped[float | None] = mapped_column(Float, nullable=True)
    quantity: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    # True for a bulk/unpackaged item sold by weight at the counter (e.g.
    # loose rice from a sack) — invoice quantity is entered in grams with a
    # per-gram price. False (the common case) means a fixed pack sold by
    # count, however its pack_size label reads.
    is_loose: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    product: Mapped["Product"] = relationship(back_populates="variants")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    business: Mapped["Business"] = relationship(back_populates="customers")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    customer_id: Mapped[str | None] = mapped_column(String, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True)
    invoice_number: Mapped[str] = mapped_column(String, nullable=False)
    invoice_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    due_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    tax: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="draft")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference_note: Mapped[str | None] = mapped_column(String, nullable=True)
    paid_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    delivery_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    payment_mode: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    business: Mapped["Business"] = relationship(back_populates="invoices")
    customer: Mapped["Customer | None"] = relationship()
    items: Mapped[list["InvoiceItem"]] = relationship(back_populates="invoice", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    invoice_id: Mapped[str] = mapped_column(String, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str | None] = mapped_column(String, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    variant_id: Mapped[str | None] = mapped_column(String, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    description: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[float | None] = mapped_column(Float, nullable=True)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="pcs")
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    tax_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    hsn_code: Mapped[str | None] = mapped_column(String, nullable=True)
    mrp: Mapped[float | None] = mapped_column(Float, nullable=True)
    pack_size: Mapped[str | None] = mapped_column(String, nullable=True)
    # Snapshot of the linked product's category name at invoice time (not
    # editable per line — a category is a product classification, not
    # something billed).
    category_name: Mapped[str | None] = mapped_column(String, nullable=True)
    cd_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    td_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    discount_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    # Free-text note naming the gift item when this line is billed as a
    # complimentary gift (e.g. "Free sample spoon"). Presence of a non-blank
    # note is what marks the line as a gift — see create_invoice.
    gift_note: Mapped[str | None] = mapped_column(String, nullable=True)
    # Values for this business's custom invoice columns (see InvoiceColumn),
    # keyed by InvoiceColumn.key — e.g. {"batch_no": "B-2201"}. Stored as a
    # snapshot on the line item itself (not looked up live from
    # InvoiceColumn) so a saved invoice keeps showing its data even after a
    # column is later renamed or deleted.
    custom_fields: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    invoice: Mapped["Invoice"] = relationship(back_populates="items")


class InvoiceColumn(Base):
    __tablename__ = "invoice_columns"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    # Stable machine key derived from the label at creation time (e.g.
    # "batch_no") — this is what InvoiceItem.custom_fields is keyed by, so it
    # stays fixed even if the label is edited later.
    key: Mapped[str] = mapped_column(String, nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    field_type: Mapped[str] = mapped_column(String, nullable=False, default="text")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    business: Mapped["Business"] = relationship(back_populates="invoice_columns")


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    phone: Mapped[str | None] = mapped_column(String, nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    tax_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    business: Mapped["Business"] = relationship(back_populates="suppliers")


class Purchase(Base):
    __tablename__ = "purchases"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    supplier_id: Mapped[str | None] = mapped_column(String, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    purchase_number: Mapped[str] = mapped_column(String, nullable=False)
    # The supplier's own delivery/purchase challan or bill number, kept
    # separate from our generated purchase_number for cross-reference.
    challan_number: Mapped[str | None] = mapped_column(String, nullable=True)
    purchase_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    subtotal: Mapped[float] = mapped_column(Float, nullable=False)
    tax: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    total: Mapped[float] = mapped_column(Float, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    business: Mapped["Business"] = relationship(back_populates="purchases")
    supplier: Mapped["Supplier | None"] = relationship()
    items: Mapped[list["PurchaseItem"]] = relationship(back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    purchase_id: Mapped[str] = mapped_column(String, ForeignKey("purchases.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id: Mapped[str | None] = mapped_column(String, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    variant_id: Mapped[str | None] = mapped_column(String, ForeignKey("product_variants.id", ondelete="SET NULL"), nullable=True)
    description: Mapped[str] = mapped_column(String, nullable=False)
    quantity: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String, nullable=False, default="pcs")
    unit_price: Mapped[float] = mapped_column(Float, nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    tax_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    tax_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    hsn_code: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    purchase: Mapped["Purchase"] = relationship(back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_id)
    business_id: Mapped[str] = mapped_column(String, ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False, index=True)
    invoice_id: Mapped[str] = mapped_column(String, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    method: Mapped[str] = mapped_column(String, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)

    business: Mapped["Business"] = relationship(back_populates="payments")
    invoice: Mapped["Invoice"] = relationship(back_populates="payments")
