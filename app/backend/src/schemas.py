from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    name: str = "User"
    height_cm: Optional[float] = None
    chair_type: str = "office"
    mode: str = "office"

class UserOut(UserCreate):
    id: int
    created_at: datetime
    class Config: from_attributes = True

class CalibrationCreate(BaseModel):
    user_id: int
    spine_angle_0: float
    shoulder_width: float
    lateral_angle_0: float = 0.0
    neck_angle_0: float = 15.0
    torso_length: float = 0.3

class CalibrationOut(CalibrationCreate):
    id: int
    created_at: datetime
    class Config: from_attributes = True

class SessionCreate(BaseModel):
    user_id: int
    score_avg: float
    pct_good: float
    pct_bad: float
    score_history: List[dict] = []

class SessionOut(SessionCreate):
    id: int
    started_at: datetime
    ended_at: Optional[datetime]
    class Config: from_attributes = True
