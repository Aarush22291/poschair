from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Calibration
from ..schemas import CalibrationCreate, CalibrationOut

router = APIRouter()

@router.post("/", response_model=CalibrationOut)
def save_calibration(body: CalibrationCreate, db: Session = Depends(get_db)):
    cal = Calibration(**body.dict())
    db.add(cal); db.commit(); db.refresh(cal); return cal

@router.get("/{user_id}", response_model=CalibrationOut)
def get_latest(user_id: int, db: Session = Depends(get_db)):
    cal = db.query(Calibration).filter(
        Calibration.user_id == user_id
    ).order_by(Calibration.created_at.desc()).first()
    if cal is None:
        raise HTTPException(status_code=404, detail="No calibration found")
    return cal
