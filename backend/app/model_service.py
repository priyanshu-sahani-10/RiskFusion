from pathlib import Path

import joblib
import pandas as pd


# RiskFusion project root
BASE_DIR = Path(__file__).resolve().parents[2]
MODEL_DIR = BASE_DIR / "models"


# Load trained artifacts
lr_model = joblib.load(MODEL_DIR / "logistic_regression.pkl")
rf_model = joblib.load(MODEL_DIR / "random_forest.pkl")
xgb_model = joblib.load(MODEL_DIR / "xgboost.pkl")

scaler = joblib.load(MODEL_DIR / "scaler.pkl")
shap_explainer = joblib.load(MODEL_DIR / "shap_explainer.pkl")

ensemble_weights = joblib.load(MODEL_DIR / "ensemble_weights.pkl")
threshold = joblib.load(MODEL_DIR / "threshold.pkl")


def predict_transaction(transaction: dict):
    # Convert input into DataFrame
    data = pd.DataFrame([transaction])

    # Scale input for Logistic Regression
    data_scaled = scaler.transform(data)

    # Individual model probabilities
    prob_lr = lr_model.predict_proba(data_scaled)[0, 1]
    prob_rf = rf_model.predict_proba(data)[0, 1]
    prob_xgb = xgb_model.predict_proba(data)[0, 1]

    # Weighted ensemble probability
    fraud_probability = (
        ensemble_weights[0] * prob_lr
        + ensemble_weights[1] * prob_rf
        + ensemble_weights[2] * prob_xgb
    )

    # Final prediction using validation-selected threshold
    prediction = int(fraud_probability >= threshold)

    # Risk level
    if fraud_probability >= 0.8:
        risk_level = "High"
    elif fraud_probability >= 0.4:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "fraud_probability": float(fraud_probability),
        "prediction": prediction,
        "risk_level": risk_level,
        "model_probabilities": {
            "logistic_regression": float(prob_lr),
            "random_forest": float(prob_rf),
            "xgboost": float(prob_xgb),
        },
    }