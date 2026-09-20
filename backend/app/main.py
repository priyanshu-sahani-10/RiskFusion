from fastapi import FastAPI

from backend.app.schemas import TransactionInput
from backend.app.model_service import predict_transaction


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
def predict(transaction: TransactionInput):
    return predict_transaction(transaction.model_dump())