from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}/suppliers", tags=["suppliers"])


def _get_supplier(db: Session, business_id: str, supplier_id: str) -> models.Supplier:
    supplier = (
        db.query(models.Supplier)
        .filter(models.Supplier.id == supplier_id, models.Supplier.business_id == business_id)
        .first()
    )
    if supplier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Supplier not found")
    return supplier


@router.get("", response_model=list[schemas.SupplierOut])
def list_suppliers(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    return db.query(models.Supplier).filter(models.Supplier.business_id == business.id).all()


@router.post("", response_model=schemas.SupplierOut, status_code=status.HTTP_201_CREATED)
def create_supplier(
    data: schemas.SupplierCreate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    supplier = models.Supplier(business_id=business.id, **data.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/{supplier_id}", response_model=schemas.SupplierOut)
def get_supplier(
    supplier_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    return _get_supplier(db, business.id, supplier_id)


@router.put("/{supplier_id}", response_model=schemas.SupplierOut)
def update_supplier(
    supplier_id: str,
    data: schemas.SupplierUpdate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    supplier = _get_supplier(db, business.id, supplier_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    supplier = _get_supplier(db, business.id, supplier_id)
    db.delete(supplier)
    db.commit()
