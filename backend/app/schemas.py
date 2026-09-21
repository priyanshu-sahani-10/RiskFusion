from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict


class TransactionInput(BaseModel):
    Time: float
    V1: float
    V2: float
    V3: float
    V4: float
    V5: float
    V6: float
    V7: float
    V8: float
    V9: float
    V10: float
    V11: float
    V12: float
    V13: float
    V14: float
    V15: float
    V16: float
    V17: float
    V18: float
    V19: float
    V20: float
    V21: float
    V22: float
    V23: float
    V24: float
    V25: float
    V26: float
    V27: float
    V28: float
    Amount: float


class FeatureFactor(BaseModel):
    feature: str
    impact: float


class ExplanationResponse(BaseModel):
    model: str
    fraud_factors: List[FeatureFactor] = []
    legitimate_factors: List[FeatureFactor] = []


class ModelProbabilities(BaseModel):
    logistic_regression: float
    random_forest: float
    xgboost: float


class PredictResponse(BaseModel):
    fraud_probability: float
    prediction: int
    risk_level: str
    model_probabilities: ModelProbabilities
    explanation: ExplanationResponse


class PredictionDetailResponse(PredictResponse):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ErrorResponse(BaseModel):
    detail: str