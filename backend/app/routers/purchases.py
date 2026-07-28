import time

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}/purchases", tags=["purchases"])


def _get_purchase(db: Session, business_id: str, purchase_id: str) -> models.Purchase:
    purchase = (
        db.query(models.Purchase)
        .filter(models.Purchase.id == purchase_id, models.Purchase.business_id == business_id)
        .first()
    )
    if purchase is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Purchase not found")
    return purchase


def _tax_breakdown(items: list[models.PurchaseItem]) -> list[schemas.TaxBreakdownItem]:
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


def _detail_out(purchase: models.Purchase) -> schemas.PurchaseDetailOut:
    out = schemas.PurchaseDetailOut.model_validate(purchase)
    out.tax_breakdown = _tax_breakdown(purchase.items)
    return out


@router.get("", response_model=list[schemas.PurchaseListOut])
def list_purchases(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    purchases = (
        db.query(models.Purchase)
        .filter(models.Purchase.business_id == business.id)
        .order_by(models.Purchase.created_at.desc())
        .all()
    )
    result = []
    for p in purchases:
        out = schemas.PurchaseListOut.model_validate(p)
        out.supplier_name = p.supplier.name if p.supplier else None
        result.append(out)
    return result


@router.post("", response_model=schemas.PurchaseDetailOut, status_code=status.HTTP_201_CREATED)
def create_purchase(
    data: schemas.PurchaseCreate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    if not data.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A purchase needs at least one item")

    product_ids = {item.product_id for item in data.items if item.product_id}
    products_by_id: dict[str, models.Product] = {}
    if product_ids:
        products_by_id = {
            p.id: p
            for p in db.query(models.Product).filter(
                models.Product.id.in_(product_ids), models.Product.business_id == business.id
            )
        }

    # Stock is received onto the specific pack-size variant purchased, not
    # the product as a whole.
    variant_ids = {item.variant_id for item in data.items if item.variant_id}
    variants_by_id: dict[str, models.ProductVariant] = {}
    if variant_ids:
        variants_by_id = {
            v.id: v
            for v in db.query(models.ProductVariant)
            .join(models.Product, models.ProductVariant.product_id == models.Product.id)
            .filter(models.ProductVariant.id.in_(variant_ids), models.Product.business_id == business.id)
        }

    # (source item, taxable amount, effective tax rate, tax amount, hsn code)
    line_items: list[tuple[schemas.PurchaseItemCreate, float, float, float, str | None]] = []
    for item in data.items:
        linked_product = products_by_id.get(item.product_id) if item.product_id else None
        amount = item.quantity * item.unit_price

        if item.tax_rate is not None:
            effective_rate = item.tax_rate
        elif linked_product:
            effective_rate = linked_product.gst_rate
        else:
            effective_rate = 0
        tax_amount = round(amount * (effective_rate / 100) * 100) / 100

        hsn_code = item.hsn_code if item.hsn_code is not None else (linked_product.hsn_code if linked_product else None)

        line_items.append((item, amount, effective_rate, tax_amount, hsn_code))

    subtotal = sum(li[1] for li in line_items)
    tax = round(sum(li[3] for li in line_items) * 100) / 100
    total = subtotal + tax

    purchase = models.Purchase(
        business_id=business.id,
        supplier_id=data.supplier_id,
        purchase_number=f"PUR-{int(time.time() * 1000)}",
        challan_number=data.challan_number,
        purchase_date=data.purchase_date,
        subtotal=subtotal,
        tax=tax,
        total=total,
        notes=data.notes,
    )
    db.add(purchase)
    db.flush()

    for item, amount, effective_rate, tax_amount, hsn_code in line_items:
        db.add(
            models.PurchaseItem(
                purchase_id=purchase.id,
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
            )
        )
        # Receiving stock is immediate — a purchase is recorded once goods
        # (and their challan) are already in hand, unlike an invoice's stock
        # deduction which happens at time of sale.
        if item.variant_id and item.variant_id in variants_by_id:
            variant = variants_by_id[item.variant_id]
            variant.quantity = variant.quantity + item.quantity

    db.commit()
    db.refresh(purchase)
    return _detail_out(purchase)


@router.get("/{purchase_id}", response_model=schemas.PurchaseDetailOut)
def get_purchase(
    purchase_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    purchase = _get_purchase(db, business.id, purchase_id)
    return _detail_out(purchase)


@router.delete("/{purchase_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase(
    purchase_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    purchase = _get_purchase(db, business.id, purchase_id)
    db.delete(purchase)
    db.commit()
