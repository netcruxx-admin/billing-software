from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}/products", tags=["products"])


def _get_product(db: Session, business_id: str, product_id: str) -> models.Product:
    product = (
        db.query(models.Product)
        .filter(models.Product.id == product_id, models.Product.business_id == business_id)
        .first()
    )
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


def _validate_category(db: Session, business_id: str, category_id: str) -> None:
    category = (
        db.query(models.Category)
        .filter(models.Category.id == category_id, models.Category.business_id == business_id)
        .first()
    )
    if category is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select a valid category before adding a product")


def _build_variant(data: schemas.ProductVariantInput) -> models.ProductVariant:
    return models.ProductVariant(
        pack_size=data.pack_size,
        sku=data.sku,
        price=data.price,
        cost_price=data.cost_price,
        mrp=data.mrp,
        quantity=data.quantity or 0,
        is_loose=data.is_loose or False,
    )


def _apply_variants(product: models.Product, variants: list[schemas.ProductVariantInput]) -> None:
    existing_by_id = {v.id: v for v in product.variants}
    keep_ids: set[str] = set()

    for v in variants:
        if v.id and v.id in existing_by_id:
            variant = existing_by_id[v.id]
            variant.pack_size = v.pack_size
            variant.sku = v.sku
            variant.price = v.price
            variant.cost_price = v.cost_price
            variant.mrp = v.mrp
            variant.quantity = v.quantity if v.quantity is not None else variant.quantity
            variant.is_loose = v.is_loose if v.is_loose is not None else variant.is_loose
            keep_ids.add(v.id)
        else:
            product.variants.append(_build_variant(v))

    for variant in list(product.variants):
        if variant.id in existing_by_id and variant.id not in keep_ids:
            product.variants.remove(variant)


@router.get("", response_model=list[schemas.ProductOut])
def list_products(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    return db.query(models.Product).filter(models.Product.business_id == business.id).all()


@router.post("", response_model=schemas.ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    data: schemas.ProductCreate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    if not data.variants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A product needs at least one pack size")
    _validate_category(db, business.id, data.category_id)

    product = models.Product(
        business_id=business.id,
        category_id=data.category_id,
        name=data.name,
        description=data.description,
        unit=data.unit or "pcs",
        gst_rate=data.gst_rate if data.gst_rate is not None else 18,
        hsn_code=data.hsn_code,
        # Legacy NOT NULL columns superseded by variants — see models.Product.
        price=0,
        quantity=0,
    )
    for v in data.variants:
        product.variants.append(_build_variant(v))

    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("/{product_id}", response_model=schemas.ProductOut)
def get_product(
    product_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    return _get_product(db, business.id, product_id)


@router.put("/{product_id}", response_model=schemas.ProductOut)
def update_product(
    product_id: str,
    data: schemas.ProductUpdate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    product = _get_product(db, business.id, product_id)
    updates = data.model_dump(exclude_unset=True, exclude={"variants"})
    if "category_id" in updates and updates["category_id"]:
        _validate_category(db, business.id, updates["category_id"])
    for field, value in updates.items():
        setattr(product, field, value)

    if data.variants is not None:
        if not data.variants:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A product needs at least one pack size")
        _apply_variants(product, data.variants)

    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    product = _get_product(db, business.id, product_id)
    db.delete(product)
    db.commit()
