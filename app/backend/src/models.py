from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String, default="User")
    height_cm     = Column(Float, nullable=True)
    chair_type    = Column(String, default="office")
    mode          = Column(String, default="office")  # office/gaming/study/relax
    created_at    = Column(DateTime, default=datetime.utcnow)
    calibrations  = relationship("Calibration", back_populates="user")
    sessions      = relationship("PostureSession", back_populates="user")

class Calibration(Base):
    __tablename__ = "calibrations"
    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"))
    spine_angle_0   = Column(Float)   # "natural sit" baseline
    shoulder_width  = Column(Float)   # for normalizing forward-head offset
    lateral_angle_0 = Column(Float, default=0.0) # "natural sit" baseline lateral lean
    neck_angle_0    = Column(Float, default=15.0)# "natural sit" baseline neck inclination
    torso_length    = Column(Float, default=0.3) # "natural sit" torso length for scale invariance
    created_at      = Column(DateTime, default=datetime.utcnow)
    user            = relationship("User", back_populates="calibrations")

class PostureSession(Base):
    __tablename__ = "posture_sessions"
    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"))
    started_at    = Column(DateTime, default=datetime.utcnow)
    ended_at      = Column(DateTime, nullable=True)
    score_avg     = Column(Float, default=0)    # 0–100
    pct_good      = Column(Float, default=0)    # percentage of frames "good"
    pct_bad       = Column(Float, default=0)
    score_history = Column(JSON, default=list)  # [{"t": epochMs, "score": 0-100}]
    user          = relationship("User", back_populates="sessions")
