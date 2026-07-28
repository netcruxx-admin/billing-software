# Billing Software API (Python / FastAPI)

Backend for the billing-software Next.js app. Replaces the old in-memory
`demoDb` + fake cookie auth with a real SQLite-backed API and JWT auth.

## Stack

- FastAPI + Uvicorn
- SQLAlchemy 2.0 (SQLite by default — swap `DATABASE_URL` for Postgres/MySQL later)
- Pydantic v2 (camelCase JSON to match the frontend's existing TypeScript types)
- JWT auth (python-jose) + bcrypt password hashing (passlib)

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
copy .env.example .env         # Windows: copy, macOS/Linux: cp
```

Edit `.env` and set a real `SECRET_KEY` (any long random string) before
running outside of local dev.

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on startup (SQLite file `billing.db` in
this directory). Interactive API docs: http://127.0.0.1:8000/docs

The Next.js app expects this server at `http://127.0.0.1:8000` by default
(see `API_URL` in the project root `.env.local`).

## Data model

- **User** — account holder (owns businesses)
- **Business** — a tenant (restaurant/hotel/store/cafe/etc), scoped to a user
- **Category** — groups products within a business
- **Product** — inventory item (price, cost price, stock quantity, unit)
- **Customer** — a business's customer contact
- **Invoice** / **InvoiceItem** — billing documents with GST-style tax and line items
- **Payment** — payments recorded against an invoice

All business-scoped resources (categories, products, customers, invoices,
payments) are only reachable through their owning business, and every
business is checked against the authenticated user's `user_id` — a request
for another user's business (or its children) returns 404.

## API surface

All routes are prefixed `/api`.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Businesses | `GET/POST /businesses`, `GET/PUT/DELETE /businesses/{id}` |
| Categories | `GET/POST /businesses/{id}/categories`, `GET/PUT/DELETE .../categories/{id}` |
| Products | `GET/POST /businesses/{id}/products`, `GET/PUT/DELETE .../products/{id}` |
| Customers | `GET/POST /businesses/{id}/customers`, `GET/PUT/DELETE .../customers/{id}` |
| Invoices | `GET/POST /businesses/{id}/invoices`, `GET/DELETE .../invoices/{id}`, `POST .../invoices/{id}/mark-paid` |
| Payments | `POST/GET .../invoices/{id}/payments`, `GET /businesses/{id}/payments` |
| Analytics | `GET .../analytics`, `.../analytics/monthly-revenue`, `.../analytics/status-breakdown` |

Creating an invoice deducts stock from any linked products; recording a
payment updates the invoice's `paidAmount`/`status` (auto-flips to
`partial` or `paid`), matching the business rules the frontend already
relies on.
