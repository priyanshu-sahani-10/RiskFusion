from fastapi import Depends, FastAPI, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from backend.app import models
from backend.app.database import Base, engine, get_db
from backend.app.model_service import predict_transaction
from backend.app.schemas import (
    PredictResponse,
    PredictionDetailResponse,
    TransactionInput,
)


# Create database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="RiskFusion API",
    description="Explainable fraud detection and risk scoring API",
    version="1.0.0",
)


@app.get("/")
def root():
    return {
        "message": "RiskFusion API is running"
    }


def _to_detail_response(prediction: models.Prediction) -> dict:
    return {
        "id": prediction.id,
        "fraud_probability": prediction.fraud_probability,
        "prediction": prediction.prediction,
        "risk_level": prediction.risk_level,
        "model_probabilities": {
            "logistic_regression": prediction.logistic_probability,
            "random_forest": prediction.random_forest_probability,
            "xgboost": prediction.xgboost_probability,
        },
        "explanation": prediction.explanation,
        "created_at": prediction.created_at,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(
    transaction: TransactionInput,
    db: Session = Depends(get_db),
):
    # Run ML prediction
    try:
        result = predict_transaction(transaction.model_dump())
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate prediction.",
        )

    # Create database record
    prediction_record = models.Prediction(
        fraud_probability=result["fraud_probability"],
        prediction=result["prediction"],
        risk_level=result["risk_level"],
        logistic_probability=result["model_probabilities"]["logistic_regression"],
        random_forest_probability=result["model_probabilities"]["random_forest"],
        xgboost_probability=result["model_probabilities"]["xgboost"],
        explanation=result["explanation"],
    )

    # Save prediction
    try:
        db.add(prediction_record)
        db.commit()
        db.refresh(prediction_record)
    except SQLAlchemyError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to store prediction.",
        )

    return result


@app.get("/predictions", response_model=list[PredictionDetailResponse])
def get_predictions(
    db: Session = Depends(get_db),
):
    try:
        predictions = (
            db.query(models.Prediction)
            .order_by(models.Prediction.created_at.desc())
            .all()
        )
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch predictions.",
        )

    return [_to_detail_response(prediction) for prediction in predictions]


@app.get(
    "/predictions/{prediction_id}",
    response_model=PredictionDetailResponse,
    responses={404: {"description": "Prediction not found"}},
)
def get_prediction_by_id(
    prediction_id: int,
    db: Session = Depends(get_db),
):
    try:
        prediction = (
            db.query(models.Prediction)
            .filter(models.Prediction.id == prediction_id)
            .first()
        )
    except SQLAlchemyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch prediction.",
        )

    if prediction is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prediction with id {prediction_id} not found.",
        )

    return _to_detail_response(prediction)