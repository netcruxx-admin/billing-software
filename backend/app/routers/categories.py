from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_owned_business

router = APIRouter(prefix="/api/businesses/{business_id}/categories", tags=["categories"])


def _get_category(db: Session, business_id: str, category_id: str) -> models.Category:
    category = (
        db.query(models.Category)
        .filter(models.Category.id == category_id, models.Category.business_id == business_id)
        .first()
    )
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.get("", response_model=list[schemas.CategoryOut])
def list_categories(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    return db.query(models.Category).filter(models.Category.business_id == business.id).all()


@router.post("", response_model=schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    data: schemas.CategoryCreate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    category = models.Category(business_id=business.id, **data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("/{category_id}", response_model=schemas.CategoryOut)
def get_category(
    category_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    return _get_category(db, business.id, category_id)


@router.put("/{category_id}", response_model=schemas.CategoryOut)
def update_category(
    category_id: str,
    data: schemas.CategoryUpdate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    category = _get_category(db, business.id, category_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(category, field, value)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: str,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    category = _get_category(db, business.id, category_id)
    has_products = (
        db.query(models.Product)
        .filter(models.Product.category_id == category_id, models.Product.business_id == business.id)
        .first()
    )
    if has_products:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Move or delete the products in this category first")
    db.delete(category)
    db.commit()
