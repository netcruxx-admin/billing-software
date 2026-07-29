from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models
from app.config import settings
from app.database import Base, engine
from app.migrate import run_migrations
from app.routers import analytics, auth, businesses, categories, customers, invoice_columns, invoices, payments, products, purchases, suppliers

Base.metadata.create_all(bind=engine)
run_migrations(engine)

app = FastAPI(title="Billing Software API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(businesses.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(invoices.router)
app.include_router(invoice_columns.router)
app.include_router(payments.router)
app.include_router(suppliers.router)
app.include_router(purchases.router)
app.include_router(analytics.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
