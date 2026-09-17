from datetime import UTC, datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import PostureSession, User
from ..schemas import SessionCreate, SessionOut

router = APIRouter()


@router.post("/", response_model=SessionOut)
def log_session(body: SessionCreate, db: Session = Depends(get_db)):
    if db.get(User, body.user_id) is None:
        raise HTTPException(status_code=404, detail="User not found")

    payload = body.model_dump()
    first_sample = payload["score_history"][0] if payload["score_history"] else None
    started_at = (
        datetime.fromtimestamp(first_sample["t"] / 1000, tz=UTC)
        if first_sample
        else datetime.now(UTC)
    )
    posture_session = PostureSession(
        **payload,
        started_at=started_at,
        ended_at=datetime.now(UTC),
    )
    db.add(posture_session)
    db.commit()
    db.refresh(posture_session)
    return posture_session


@router.get("/{user_id}", response_model=List[SessionOut])
def get_sessions(user_id: int, db: Session = Depends(get_db)):
    return (
        db.query(PostureSession)
        .filter(PostureSession.user_id == user_id)
        .order_by(PostureSession.started_at.desc())
        .limit(30)
        .all()
    )
