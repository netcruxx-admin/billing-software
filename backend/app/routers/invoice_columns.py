import re

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}/invoice-columns", tags=["invoice-columns"])

FIELD_TYPES = {"text", "number"}


def _slugify(label: str) -> str:
    key = re.sub(r"[^a-z0-9]+", "_", label.strip().lower()).strip("_")
    return key or "field"


def _get_column(db: Session, business_id: str, column_id: str) -> models.InvoiceColumn:
    column = (
        db.query(models.InvoiceColumn)
        .filter(models.InvoiceColumn.id == column_id, models.InvoiceColumn.business_id == business_id)
        .first()
    )
    if column is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Column not found")
    return column


@router.get("", response_model=list[schemas.InvoiceColumnOut])
def list_invoice_columns(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    return (
        db.query(models.InvoiceColumn)
        .filter(models.InvoiceColumn.business_id == business.id)
        .order_by(models.InvoiceColumn.sort_order, models.InvoiceColumn.created_at)
        .all()
    )


@router.post("", response_model=schemas.InvoiceColumnOut, status_code=status.HTTP_201_CREATED)
def create_invoice_column(
    data: schemas.InvoiceColumnCreate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    label = data.label.strip()
    if not label:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Column name is required")
    if data.field_type not in FIELD_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid field type")

    existing = db.query(models.InvoiceColumn).filter(models.InvoiceColumn.business_id == business.id).all()
    existing_keys = {c.key for c in existing}
    base_key = _slugify(label)
    key = base_key
    suffix = 2
    while key in existing_keys:
        key = f"{base_key}_{suffix}"
        suffix += 1

    column = models.InvoiceColumn(
        business_id=business.id,
        key=key,
        label=label,
        field_type=data.field_type,
        sort_order=len(existing),
    )
    db.add(column)
    db.commit()
    db.refresh(column)
    return column


@router.put("/{column_id}", response_model=schemas.InvoiceColumnOut)
def update_invoice_column(
    column_id: str,
    data: schemas.InvoiceColumnUpdate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    column = _get_column(db, business.id, column_id)
    updates = data.model_dump(exclude_unset=True)
    if "label" in updates:
        label = (updates["label"] or "").strip()
        if not label:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Column name is required")
        updates["label"] = label
    if "field_type" in updates and updates["field_type"] not in FIELD_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid field type")
    for field, value in updates.items():
        setattr(column, field, value)
    db.commit()
    db.refresh(column)
    return column


@router.delete("/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice_column(
    column_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    column = _get_column(db, business.id, column_id)
    db.delete(column)
    db.commit()
