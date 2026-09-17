from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


Mode = Literal["office", "gaming", "study", "relax"]


class UserCreate(BaseModel):
    name: str = Field(default="User", min_length=1, max_length=100)
    height_cm: float | None = Field(default=None, ge=80, le=250)
    chair_type: str = Field(default="office", min_length=1, max_length=50)
    mode: Mode = "office"


class UserOut(UserCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class CalibrationCreate(BaseModel):
    user_id: int = Field(gt=0)
    spine_angle_0: float = Field(ge=-90, le=90)
    shoulder_width: float = Field(gt=0, le=2)
    lateral_angle_0: float = Field(default=0.0, ge=-90, le=90)
    neck_angle_0: float = Field(default=15.0, ge=-90, le=90)
    torso_length: float = Field(default=0.3, gt=0, le=2)


class CalibrationOut(CalibrationCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class ScoreSample(BaseModel):
    t: int = Field(ge=0, le=4_102_444_800_000)  # Unix milliseconds through 2100-01-01
    score: float = Field(ge=0, le=100)


class SessionCreate(BaseModel):
    user_id: int = Field(gt=0)
    score_avg: float = Field(ge=0, le=100)
    pct_good: float = Field(ge=0, le=100)
    pct_bad: float = Field(ge=0, le=100)
    score_history: list[ScoreSample] = Field(default_factory=list, max_length=28800)

    @model_validator(mode="after")
    def percentages_total_one_hundred(self):
        if abs((self.pct_good + self.pct_bad) - 100.0) > 0.1:
            raise ValueError("pct_good and pct_bad must total 100")
        return self


class SessionOut(SessionCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    started_at: datetime
    ended_at: datetime | None
