from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}/customers", tags=["customers"])


def _get_customer(db: Session, business_id: str, customer_id: str) -> models.Customer:
    customer = (
        db.query(models.Customer)
        .filter(models.Customer.id == customer_id, models.Customer.business_id == business_id)
        .first()
    )
    if customer is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return customer


@router.get("", response_model=list[schemas.CustomerOut])
def list_customers(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    return db.query(models.Customer).filter(models.Customer.business_id == business.id).all()


@router.post("", response_model=schemas.CustomerOut, status_code=status.HTTP_201_CREATED)
def create_customer(
    data: schemas.CustomerCreate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    customer = models.Customer(business_id=business.id, **data.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=schemas.CustomerOut)
def get_customer(
    customer_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    return _get_customer(db, business.id, customer_id)


@router.put("/{customer_id}", response_model=schemas.CustomerOut)
def update_customer(
    customer_id: str,
    data: schemas.CustomerUpdate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    customer = _get_customer(db, business.id, customer_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(
    customer_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    customer = _get_customer(db, business.id, customer_id)
    db.delete(customer)
    db.commit()
