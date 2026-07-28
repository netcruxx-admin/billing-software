from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


# --- Auth ---------------------------------------------------------------

class RegisterRequest(CamelModel):
    name: str
    email: EmailStr
    password: str


class LoginRequest(CamelModel):
    email: EmailStr
    password: str


class UserOut(CamelModel):
    id: str
    name: str
    email: str


class TokenResponse(CamelModel):
    access_token: str
    user: UserOut


# --- Business -------------------------------------------------------------

class BusinessCreate(CamelModel):
    name: str
    type: str
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    tax_id: str | None = None
    fssai_no: str | None = None
    cst_date: datetime | None = None


class BusinessUpdate(CamelModel):
    name: str | None = None
    type: str | None = None
    address: str | None = None
    phone: str | None = None
    email: str | None = None
    tax_id: str | None = None
    fssai_no: str | None = None
    cst_date: datetime | None = None


class BusinessOut(CamelModel):
    id: str
    user_id: str
    name: str
    type: str
    address: str | None
    phone: str | None
    email: str | None
    tax_id: str | None
    logo: str | None
    fssai_no: str | None
    cst_date: datetime | None
    created_at: datetime
    updated_at: datetime


# --- Category ---------------------------------------------------------------

class CategoryCreate(CamelModel):
    name: str
    description: str | None = None


class CategoryUpdate(CamelModel):
    name: str | None = None
    description: str | None = None


class CategoryOut(CamelModel):
    id: str
    business_id: str
    name: str
    description: str | None
    created_at: datetime
    updated_at: datetime


# --- Product ---------------------------------------------------------------

class ProductVariantInput(CamelModel):
    # Present -> update that existing variant; absent -> create a new one.
    # Any id that doesn't match an existing variant on the product is
    # treated as a new variant (its value is ignored, a fresh id is issued).
    id: str | None = None
    # A specific pack size (e.g. "50g", "1kg") — leave blank for a product
    # that doesn't distinguish pack sizes and just has one default variant.
    pack_size: str | None = None
    sku: str | None = None
    price: float
    cost_price: float | None = None
    mrp: float | None = None
    quantity: float | None = 0
    # True for a bulk item sold loose by weight (invoice quantity entered in
    # grams); false (default) for a fixed pack sold by count.
    is_loose: bool | None = False


class ProductVariantOut(CamelModel):
    id: str
    product_id: str
    pack_size: str | None
    sku: str | None
    price: float
    cost_price: float | None
    mrp: float | None
    quantity: float
    is_loose: bool
    created_at: datetime
    updated_at: datetime


class ProductCreate(CamelModel):
    name: str
    description: str | None = None
    category_id: str
    unit: str | None = "pcs"
    gst_rate: float | None = 18
    hsn_code: str | None = None
    # At least one pack size/variant is required — this is what actually
    # carries price and stock.
    variants: list[ProductVariantInput]


class ProductUpdate(CamelModel):
    name: str | None = None
    description: str | None = None
    category_id: str | None = None
    unit: str | None = None
    gst_rate: float | None = None
    hsn_code: str | None = None
    # When provided, replaces the product's variant set: existing variants
    # matched by id are updated in place (preserving their id and thus any
    # invoice/purchase history and stock), unmatched existing variants are
    # deleted, and entries without an id are created new.
    variants: list[ProductVariantInput] | None = None


class ProductOut(CamelModel):
    id: str
    business_id: str
    category_id: str | None
    name: str
    description: str | None
    unit: str
    gst_rate: float
    hsn_code: str | None
    created_at: datetime
    updated_at: datetime
    variants: list[ProductVariantOut] = []


# --- Customer ---------------------------------------------------------------

class CustomerCreate(CamelModel):
    name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    tax_id: str | None = None


class CustomerUpdate(CamelModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    tax_id: str | None = None


class CustomerOut(CamelModel):
    id: str
    business_id: str
    name: str
    email: str | None
    phone: str | None
    address: str | None
    tax_id: str | None
    created_at: datetime
    updated_at: datetime


# --- Invoice ---------------------------------------------------------------

class InvoiceItemCreate(CamelModel):
    product_id: str | None = None
    variant_id: str | None = None
    description: str
    quantity: float | None = None
    unit: str | None = "pcs"
    unit_price: float
    # Per-line GST rate. If omitted and the item is linked to a product, the
    # product's own gst_rate is used; otherwise it defaults to 0.
    tax_rate: float | None = None
    # Retail-format extras. hsn_code/mrp/pack_size fall back to the linked
    # product's values when omitted; cd_rate/td_rate (cash/trade discount %)
    # default to 0, which makes the line-item math identical to before this
    # was added.
    hsn_code: str | None = None
    mrp: float | None = None
    pack_size: str | None = None
    cd_rate: float | None = 0
    td_rate: float | None = 0
    # A non-blank note (e.g. "Free sample spoon") marks the line as a
    # complimentary gift — billed at zero price/tax regardless of
    # unit_price, though unit_price is still stored/shown as entered.
    gift_note: str | None = None


class InvoiceCreate(CamelModel):
    customer_id: str | None = None
    invoice_date: datetime
    due_date: datetime | None = None
    items: list[InvoiceItemCreate]
    notes: str | None = None
    # Free-text reference shown on the invoice header — meaning depends on
    # the business type (e.g. table/order no. for a restaurant, room no.
    # for a hotel).
    reference_note: str | None = None
    delivery_date: datetime | None = None
    payment_mode: str | None = None


class InvoiceItemOut(CamelModel):
    id: str
    invoice_id: str
    product_id: str | None
    variant_id: str | None
    description: str
    quantity: float | None
    unit: str
    unit_price: float
    amount: float
    tax_rate: float
    tax_amount: float
    hsn_code: str | None
    mrp: float | None
    pack_size: str | None
    category_name: str | None
    cd_rate: float
    td_rate: float
    discount_amount: float
    gift_note: str | None
    created_at: datetime


class TaxBreakdownItem(CamelModel):
    rate: float
    taxable_amount: float
    tax_amount: float


class InvoiceOut(CamelModel):
    id: str
    business_id: str
    customer_id: str | None
    invoice_number: str
    invoice_date: datetime
    due_date: datetime | None
    subtotal: float
    tax: float | None
    total: float
    status: str
    notes: str | None
    reference_note: str | None
    paid_amount: float | None
    delivery_date: datetime | None
    payment_mode: str | None
    created_at: datetime
    updated_at: datetime


class InvoiceListOut(InvoiceOut):
    customer_name: str | None = None


class InvoiceDetailOut(InvoiceOut):
    items: list[InvoiceItemOut] = []
    tax_breakdown: list[TaxBreakdownItem] = []


class MarkPaidRequest(CamelModel):
    paid_amount: float | None = None


# --- Supplier ---------------------------------------------------------------

class SupplierCreate(CamelModel):
    name: str
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    tax_id: str | None = None


class SupplierUpdate(CamelModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    tax_id: str | None = None


class SupplierOut(CamelModel):
    id: str
    business_id: str
    name: str
    email: str | None
    phone: str | None
    address: str | None
    tax_id: str | None
    created_at: datetime
    updated_at: datetime


# --- Purchase ---------------------------------------------------------------

class PurchaseItemCreate(CamelModel):
    product_id: str | None = None
    variant_id: str | None = None
    description: str
    quantity: float
    unit: str | None = "pcs"
    unit_price: float
    # Per-line GST rate. If omitted and the item is linked to a product, the
    # product's own gst_rate is used; otherwise it defaults to 0.
    tax_rate: float | None = None
    hsn_code: str | None = None


class PurchaseCreate(CamelModel):
    supplier_id: str | None = None
    purchase_date: datetime
    challan_number: str | None = None
    items: list[PurchaseItemCreate]
    notes: str | None = None


class PurchaseItemOut(CamelModel):
    id: str
    purchase_id: str
    product_id: str | None
    variant_id: str | None
    description: str
    quantity: float
    unit: str
    unit_price: float
    amount: float
    tax_rate: float
    tax_amount: float
    hsn_code: str | None
    created_at: datetime


class PurchaseOut(CamelModel):
    id: str
    business_id: str
    supplier_id: str | None
    purchase_number: str
    challan_number: str | None
    purchase_date: datetime
    subtotal: float
    tax: float
    total: float
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PurchaseListOut(PurchaseOut):
    supplier_name: str | None = None


class PurchaseDetailOut(PurchaseOut):
    items: list[PurchaseItemOut] = []
    tax_breakdown: list[TaxBreakdownItem] = []


# --- Payment ---------------------------------------------------------------

class PaymentCreate(CamelModel):
    amount: float
    method: str


class PaymentOut(CamelModel):
    id: str
    business_id: str
    invoice_id: str
    amount: float
    method: str
    status: str
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PaymentListOut(PaymentOut):
    invoice_number: str | None = None


# --- Analytics ---------------------------------------------------------------

class AnalyticsMetrics(CamelModel):
    total_revenue: float
    total_paid: float
    outstanding_amount: float
    total_invoices: int
    paid_invoices: int
    unpaid_invoices: int


class AnalyticsOut(CamelModel):
    metrics: AnalyticsMetrics
    recent_invoices: list[InvoiceOut]


class MonthlyRevenueOut(CamelModel):
    month: str
    revenue: float


class StatusBreakdownOut(CamelModel):
    draft: int = 0
    sent: int = 0
    partial: int = 0
    paid: int = 0
