from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user, get_owned_business

router = APIRouter(prefix="/api/businesses", tags=["businesses"])


@router.get("", response_model=list[schemas.BusinessOut])
def list_businesses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return (
        db.query(models.Business)
        .filter(models.Business.user_id == current_user.id)
        .order_by(models.Business.created_at.desc())
        .all()
    )


@router.post("", response_model=schemas.BusinessOut, status_code=status.HTTP_201_CREATED)
def create_business(
    data: schemas.BusinessCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    business = models.Business(user_id=current_user.id, **data.model_dump())
    db.add(business)
    db.commit()
    db.refresh(business)
    return business


@router.get("/{business_id}", response_model=schemas.BusinessOut)
def get_business(business: models.Business = Depends(get_owned_business)):
    return business


@router.put("/{business_id}", response_model=schemas.BusinessOut)
def update_business(
    data: schemas.BusinessUpdate,
    business: models.Business = Depends(get_owned_business),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(business, field, value)
    db.commit()
    db.refresh(business)
    return business


@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_business(business: models.Business = Depends(get_owned_business), db: Session = Depends(get_db)):
    db.delete(business)
    db.commit()
