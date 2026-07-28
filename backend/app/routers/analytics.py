from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}/analytics", tags=["analytics"])


@router.get("", response_model=schemas.AnalyticsOut)
def get_analytics(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).filter(models.Invoice.business_id == business.id).all()
    payments = db.query(models.Payment).filter(models.Payment.business_id == business.id).all()

    total_revenue = sum(inv.total for inv in invoices)
    total_paid = sum(p.amount for p in payments)
    outstanding_amount = total_revenue - total_paid

    total_invoices = len(invoices)
    paid_invoices = sum(1 for inv in invoices if inv.status == "paid")
    unpaid_invoices = total_invoices - paid_invoices

    recent_invoices = sorted(invoices, key=lambda inv: inv.created_at, reverse=True)[:5]

    return schemas.AnalyticsOut(
        metrics=schemas.AnalyticsMetrics(
            total_revenue=total_revenue,
            total_paid=total_paid,
            outstanding_amount=outstanding_amount,
            total_invoices=total_invoices,
            paid_invoices=paid_invoices,
            unpaid_invoices=unpaid_invoices,
        ),
        recent_invoices=[schemas.InvoiceOut.model_validate(inv) for inv in recent_invoices],
    )


@router.get("/monthly-revenue", response_model=list[schemas.MonthlyRevenueOut])
def get_monthly_revenue(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).filter(models.Invoice.business_id == business.id).all()

    monthly: dict[str, float] = defaultdict(float)
    for inv in invoices:
        key = f"{inv.invoice_date.year}-{inv.invoice_date.month:02d}"
        monthly[key] += inv.total

    return [
        schemas.MonthlyRevenueOut(month=month, revenue=revenue)
        for month, revenue in sorted(monthly.items())
    ]


@router.get("/status-breakdown", response_model=schemas.StatusBreakdownOut)
def get_status_breakdown(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    invoices = db.query(models.Invoice).filter(models.Invoice.business_id == business.id).all()
    breakdown = schemas.StatusBreakdownOut()
    for inv in invoices:
        if hasattr(breakdown, inv.status):
            setattr(breakdown, inv.status, getattr(breakdown, inv.status) + 1)
    return breakdown
