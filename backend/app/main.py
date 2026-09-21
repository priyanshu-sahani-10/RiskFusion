from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from backend.app import models
from backend.app.database import Base, engine, get_db
from backend.app.model_service import predict_transaction
from backend.app.schemas import TransactionInput


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


@app.post("/predict")
def predict(
    transaction: TransactionInput,
    db: Session = Depends(get_db),
):
    # Run ML prediction
    result = predict_transaction(transaction.model_dump())

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
    db.add(prediction_record)
    db.commit()
    db.refresh(prediction_record)

    return result


@app.get("/predictions")
def get_predictions(
    db: Session = Depends(get_db),
):
    predictions = (
        db.query(models.Prediction)
        .order_by(models.Prediction.created_at.desc())
        .all()
    )

    return [
        {
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
        for prediction in predictions
    ]