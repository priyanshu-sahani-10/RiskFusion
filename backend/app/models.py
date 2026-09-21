from datetime import datetime

from sqlalchemy import Column, DateTime, Float, Integer, String
from sqlalchemy.dialects.postgresql import JSONB

from backend.app.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)

    fraud_probability = Column(Float, nullable=False)
    prediction = Column(Integer, nullable=False)
    risk_level = Column(String, nullable=False)

    logistic_probability = Column(Float, nullable=False)
    random_forest_probability = Column(Float, nullable=False)
    xgboost_probability = Column(Float, nullable=False)

    explanation = Column(JSONB, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )