import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}/invoices", tags=["invoices"])


def _get_invoice(db: Session, business_id: str, invoice_id: str) -> models.Invoice:
    invoice = (
        db.query(models.Invoice)
        .filter(models.Invoice.id == invoice_id, models.Invoice.business_id == business_id)
        .first()
    )
    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice


def _tax_breakdown(items: list[models.InvoiceItem]) -> list[schemas.TaxBreakdownItem]:
    groups: dict[float, dict[str, float]] = {}
    for item in items:
        if item.tax_rate <= 0:
            continue
        bucket = groups.setdefault(item.tax_rate, {"taxable_amount": 0.0, "tax_amount": 0.0})
        bucket["taxable_amount"] += item.amount
        bucket["tax_amount"] += item.tax_amount
    return [
        schemas.TaxBreakdownItem(
            rate=rate,
            taxable_amount=round(v["taxable_amount"] * 100) / 100,
            tax_amount=round(v["tax_amount"] * 100) / 100,
        )
        for rate, v in sorted(groups.items())
    ]


def _detail_out(invoice: models.Invoice) -> schemas.InvoiceDetailOut:
    out = schemas.InvoiceDetailOut.model_validate(invoice)
    out.tax_breakdown = _tax_breakdown(invoice.items)
    return out


@router.get("", response_model=list[schemas.InvoiceListOut])
def list_invoices(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    invoices = (
        db.query(models.Invoice)
        .filter(models.Invoice.business_id == business.id)
        .order_by(models.Invoice.created_at.desc())
        .all()
    )
    result = []
    for inv in invoices:
        out = schemas.InvoiceListOut.model_validate(inv)
        out.customer_name = inv.customer.name if inv.customer else None
        result.append(out)
    return result


@router.post("", response_model=schemas.InvoiceDetailOut, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: schemas.InvoiceCreate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    if not data.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An invoice needs at least one item")

    for item in data.items:
        if item.variant_id and item.quantity is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Quantity is required for items linked to an inventory product",
            )

    # Pre-fetch linked products once — used as the GST-rate/HSN fallback for
    # items that don't specify their own value.
    product_ids = {item.product_id for item in data.items if item.product_id}
    products_by_id: dict[str, models.Product] = {}
    if product_ids:
        products_by_id = {
            p.id: p
            for p in db.query(models.Product).filter(
                models.Product.id.in_(product_ids), models.Product.business_id == business.id
            )
        }

    # Pre-fetch linked variants — the MRP/pack-size fallback and stock
    # deduction happen at the variant level, since price and stock are
    # per-pack-size, not per-product.
    variant_ids = {item.variant_id for item in data.items if item.variant_id}
    variants_by_id: dict[str, models.ProductVariant] = {}
    if variant_ids:
        variants_by_id = {
            v.id: v
            for v in db.query(models.ProductVariant)
            .join(models.Product, models.ProductVariant.product_id == models.Product.id)
            .filter(models.ProductVariant.id.in_(variant_ids), models.Product.business_id == business.id)
        }

    # (source item, effective quantity, taxable amount, effective tax rate,
    # tax amount, hsn code, mrp, pack size, category name, cd rate, td rate,
    # discount amount, gift note)
    line_items: list[tuple[schemas.InvoiceItemCreate, float, float, float, float, str | None, float | None, str | None, str | None, float, float, float, str | None]] = []
    for item in data.items:
        effective_qty = item.quantity if item.quantity is not None else 1
        linked_product = products_by_id.get(item.product_id) if item.product_id else None
        linked_variant = variants_by_id.get(item.variant_id) if item.variant_id else None
        # Purely informational (e.g. "free sample from company") — does not
        # affect pricing; the line is billed normally either way.
        gift_note = item.gift_note.strip() if item.gift_note else None

        gross = effective_qty * item.unit_price
        cd_rate = item.cd_rate or 0
        td_rate = item.td_rate or 0
        discount_amount = round(gross * ((cd_rate + td_rate) / 100) * 100) / 100
        # `amount` keeps its original meaning — the tax-exclusive taxable
        # base — so subtotal/tax/total below are unchanged when cd/td are 0.
        amount = gross - discount_amount

        if item.tax_rate is not None:
            effective_rate = item.tax_rate
        elif linked_product:
            effective_rate = linked_product.gst_rate
        else:
            effective_rate = 0
        tax_amount = round(amount * (effective_rate / 100) * 100) / 100

        hsn_code = item.hsn_code if item.hsn_code is not None else (linked_product.hsn_code if linked_product else None)
        mrp = item.mrp if item.mrp is not None else (linked_variant.mrp if linked_variant else None)
        pack_size = item.pack_size if item.pack_size is not None else (linked_variant.pack_size if linked_variant else None)
        category_name = linked_product.category.name if linked_product and linked_product.category else None

        line_items.append((item, effective_qty, amount, effective_rate, tax_amount, hsn_code, mrp, pack_size, category_name, cd_rate, td_rate, discount_amount, gift_note))

    subtotal = sum(li[2] for li in line_items)
    tax = round(sum(li[4] for li in line_items) * 100) / 100
    total = subtotal + tax

    invoice = models.Invoice(
        business_id=business.id,
        customer_id=data.customer_id,
        invoice_number=f"INV-{int(time.time() * 1000)}",
        invoice_date=data.invoice_date,
        due_date=data.due_date,
        subtotal=subtotal,
        tax=tax,
        total=total,
        notes=data.notes,
        reference_note=data.reference_note,
        delivery_date=data.delivery_date,
        payment_mode=data.payment_mode,
        status="draft",
        paid_amount=0,
    )
    db.add(invoice)
    db.flush()

    for item, effective_qty, amount, effective_rate, tax_amount, hsn_code, mrp, pack_size, category_name, cd_rate, td_rate, discount_amount, gift_note in line_items:
        db.add(
            models.InvoiceItem(
                invoice_id=invoice.id,
                product_id=item.product_id,
                variant_id=item.variant_id,
                description=item.description,
                quantity=item.quantity,
                unit=item.unit or "pcs",
                unit_price=item.unit_price,
                amount=amount,
                tax_rate=effective_rate,
                tax_amount=tax_amount,
                hsn_code=hsn_code,
                mrp=mrp,
                pack_size=pack_size,
                category_name=category_name,
                cd_rate=cd_rate,
                td_rate=td_rate,
                discount_amount=discount_amount,
                gift_note=gift_note,
            )
        )
        if item.variant_id and item.variant_id in variants_by_id:
            variant = variants_by_id[item.variant_id]
            variant.quantity = max(0, variant.quantity - item.quantity)

    db.commit()
    db.refresh(invoice)
    return _detail_out(invoice)


@router.get("/{invoice_id}", response_model=schemas.InvoiceDetailOut)
def get_invoice(
    invoice_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    invoice = _get_invoice(db, business.id, invoice_id)
    return _detail_out(invoice)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    invoice = _get_invoice(db, business.id, invoice_id)
    db.delete(invoice)
    db.commit()


@router.post("/{invoice_id}/mark-paid", response_model=schemas.InvoiceDetailOut)
def mark_invoice_paid(
    invoice_id: str,
    data: schemas.MarkPaidRequest,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    invoice = _get_invoice(db, business.id, invoice_id)
    invoice.paid_amount = data.paid_amount if data.paid_amount is not None else invoice.total
    invoice.status = "paid"
    db.commit()
    db.refresh(invoice)
    return _detail_out(invoice)
