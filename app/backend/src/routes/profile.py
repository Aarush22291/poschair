from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserCreate, UserOut

router = APIRouter()

@router.post("/", response_model=UserOut)
def create_user(body: UserCreate, db: Session = Depends(get_db)):
    user = User(**body.dict())
    db.add(user); db.commit(); db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=UserOut)
def update_user(user_id: int, body: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    for k, v in body.dict().items(): setattr(user, k, v)
    db.commit(); db.refresh(user); return user
