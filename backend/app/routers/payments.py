from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}", tags=["payments"])


def _get_invoice(db: Session, business_id: str, invoice_id: str) -> models.Invoice:
    invoice = (
        db.query(models.Invoice)
        .filter(models.Invoice.id == invoice_id, models.Invoice.business_id == business_id)
        .first()
    )
    if invoice is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return invoice


@router.post("/invoices/{invoice_id}/payments", response_model=schemas.PaymentOut, status_code=status.HTTP_201_CREATED)
def record_payment(
    invoice_id: str,
    data: schemas.PaymentCreate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    invoice = _get_invoice(db, business.id, invoice_id)
    if data.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment amount must be greater than zero")

    payment = models.Payment(
        business_id=business.id,
        invoice_id=invoice_id,
        amount=data.amount,
        method=data.method,
        status="completed",
    )
    db.add(payment)

    new_paid_amount = (invoice.paid_amount or 0) + data.amount
    invoice.paid_amount = new_paid_amount
    invoice.status = "paid" if new_paid_amount >= invoice.total else "partial"

    db.commit()
    db.refresh(payment)
    return payment


@router.get("/invoices/{invoice_id}/payments", response_model=list[schemas.PaymentOut])
def get_payment_history(
    invoice_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    _get_invoice(db, business.id, invoice_id)
    return (
        db.query(models.Payment)
        .filter(models.Payment.invoice_id == invoice_id)
        .order_by(models.Payment.created_at.desc())
        .all()
    )


@router.get("/payments", response_model=list[schemas.PaymentListOut])
def get_business_payments(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    payments = (
        db.query(models.Payment)
        .filter(models.Payment.business_id == business.id)
        .order_by(models.Payment.created_at.desc())
        .all()
    )
    result = []
    for p in payments:
        out = schemas.PaymentListOut.model_validate(p)
        out.invoice_number = p.invoice.invoice_number if p.invoice else "Unknown"
        result.append(out)
    return result
