# 🛡️ RiskFusion — Explainable Multi-Model Fraud Detection

**RiskFusion** is a full-stack, explainable credit-card fraud detection system that fuses three ML models into a weighted ensemble, explains every prediction with SHAP, persists prediction history in PostgreSQL, and visualizes everything in a modern fintech analytics dashboard.

> Built on the [Kaggle Credit Card Fraud Detection dataset](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) (284,807 European cardholder transactions, 0.17% fraud).

---

## ✨ Key Features

- **Weighted Ensemble Scoring** — Logistic Regression + Random Forest + XGBoost, combined with validation-tuned weights and decision threshold (`0.731588`)
- **Explainable AI** — SHAP values on the XGBoost component, split into *fraud factors* (push toward fraud) vs *legitimate factors* (push toward legitimate), top-5 each
- **Risk Tiers** — `Low (< 0.40)` · `Medium (0.40–0.80)` · `High (≥ 0.80)`
- **FastAPI Backend** — typed Pydantic schemas, CORS, clean error handling, auto-created Postgres tables
- **Prediction History** — every `/predict` call stored in PostgreSQL (`predictions` table with per-model probabilities + JSONB explanation); `GET /predictions` + `GET /predictions/{id}`
- **Fintech Dashboard (React + Tailwind v4 + Vite)** — light-mode analytics UI with:
  - 📊 Overview metrics (total scored, fraud rate, avg risk, high-risk count)
  - 🔍 Transaction Explorer (22 curated real rows from `creditcard.csv` with ground-truth labels)
  - 🎯 Risk Assessment hero (fraud probability gauge, verdict, risk badge)
  - 🧠 Model Analysis (per-model bars, ensemble pipeline visualization, threshold marker)
  - 💡 Explainability panel (SHAP waterfall-style factor lists)
  - 🕘 Prediction History table + detail drill-down
  - 🟢 Live API health indicator
- **Reproducible ML workflow** — EDA notebook, pinned dependencies, serialized artifacts in `models/`

---

## 🏗️ Architecture

```
┌─────────────────────┐      ┌────────────────────────────┐      ┌──────────────┐
│  React Dashboard    │      │        FastAPI Backend      │      │  PostgreSQL  │
│  (Vite + Tailwind)  │─────▶│  /predict  /predictions    │─────▶│ predictions  │
│                     │◀─────│  model_service (ensemble)   │      │   table      │
└─────────────────────┘ JSON └────────────┬───────────────┘      └──────────────┘
                                          │ loads .pkl
                               ┌──────────▼──────────┐
                               │  models/*.pkl       │
                               │  LR / RF / XGB      │
                               │  scaler / SHAP /    │
                               │  weights / threshold│
                               └─────────────────────┘
```

**Inference flow (`backend/app/model_service.py`):**

1. Input `Time, V1–V28, Amount` → DataFrame
2. `scaler` transforms input for Logistic Regression; RF/XGB use raw features
3. Each model outputs `P(fraud)` → weighted average via `ensemble_weights.pkl`
4. Compare against `threshold.pkl` (`0.731588`) → `prediction ∈ {0, 1}`
5. Map probability → risk tier (High/Medium/Low)
6. `shap_explainer.shap_values()` → top fraud / legitimate factors
7. Persist + return full response

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| ML | scikit-learn 1.9.1, XGBoost 3.2.0, SHAP 0.51.0, pandas, numpy, scipy, joblib |
| Backend | FastAPI 0.141.1, Uvicorn, SQLAlchemy 2.0.54, psycopg 3.3.6, Pydantic v2, python-dotenv |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS v4, Fetch API |
| Database | PostgreSQL (JSONB for SHAP explanations) |
| Data | Kaggle `creditcard.csv` — `Time, V1–V28 (PCA-anonymized), Amount, Class` |
| Tooling | Jupyter EDA notebook, pinned `requirements.txt` |

---

## 📁 Project Structure

```
RiskFusion/
├── backend/app/
│   ├── main.py           # FastAPI app: /, /predict, /predictions, /predictions/{id}
│   ├── model_service.py  # Loads .pkl artifacts, ensemble + SHAP inference
│   ├── models.py         # SQLAlchemy Prediction model (JSONB explanation)
│   ├── schemas.py        # Pydantic: TransactionInput, PredictResponse, ...
│   ├── database.py       # Engine / SessionLocal / Base (DATABASE_URL)
│   └── __init__.py
├── frontend/src/
│   ├── App.tsx                        # Dashboard layout + state orchestration
│   ├── lib/api.ts                     # Typed API client (FEATURES, DECISION_THRESHOLD)
│   ├── lib/samples.ts                 # 22 real sample transactions from creditcard.csv
│   └── components/
│       ├── Overview.tsx               # Aggregate metrics cards
│       ├── TransactionExplorer.tsx    # Sample selector + "Analyze" trigger
│       ├── RiskAssessment.tsx         # Risk hero + analyzing skeleton
│       ├── ModelAnalysis.tsx          # Per-model comparison + ensemble pipeline
│       ├── ExplanationPanel.tsx       # SHAP fraud/legitimate factors
│       ├── History.tsx                # History table + detail card
│       └── badges.tsx                 # Risk / verdict badges
├── models/               # Trained artifacts (gitignored *.pkl — see note below)
│   ├── logistic_regression.pkl
│   ├── random_forest.pkl
│   ├── xgboost.pkl
│   ├── scaler.pkl
│   ├── shap_explainer.pkl
│   ├── ensemble_weights.pkl
│   └── threshold.pkl     # 0.731588
├── notebooks/
│   └── 01_eda.ipynb      # Class imbalance, Amount/Time distributions, correlations
├── data/
│   ├── raw/creditcard.csv        # (gitignored, download from Kaggle)
│   └── processed/                # (empty placeholder for cleaned outputs)
├── requirements.txt
├── .env.example
├── frontend/.env.example
└── README.md
```

> ⚠️ **Note on `models/*.pkl`:** `*.pkl` / `*.joblib` are in `.gitignore`, so trained artifacts are **not** pushed to GitHub. Clone the repo and either (a) copy your local `models/` folder, or (b) retrain on `creditcard.csv` and save the 7 artifacts with the exact filenames above. The backend fails fast at import time if they are missing.

---

## 📊 Dataset

- **Source:** Kaggle — *Credit Card Fraud Detection* (ULB, 2013, 2 days of European transactions)
- **Shape:** 284,807 rows × 31 columns
- **Features:** `Time` (seconds since first txn) · `V1–V28` (PCA, anonymized) · `Amount` · `Class` (`0` = legitimate, `1` = fraud)
- **Imbalance:** ~492 frauds (0.17%) — the reason for a validation-tuned threshold instead of naive 0.5
- **EDA (`notebooks/01_eda.ipynb`):** class distribution, missing/duplicates check, Amount & Time histograms by class, `Class` correlation ranking

Place the CSV at `data/raw/creditcard.csv` (this path is gitignored). The dashboard's 22 sample transactions in `frontend/src/lib/samples.ts` are real rows (by CSV row id + ground-truth `actual` label) so you can demo without the full file.

---

## 🔌 API Reference

Base URL: `http://localhost:8000` · Interactive docs: `http://localhost:8000/docs`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check → `{ "message": "RiskFusion API is running" }` |
| `POST` | `/predict` | Score one transaction, persist it, return ensemble + SHAP result |
| `GET` | `/predictions` | List all stored predictions (newest first) |
| `GET` | `/predictions/{id}` | Fetch one prediction by id (404 if missing) |

### Example request

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "Time": 406.0, "V1": -2.31, "V2": 1.95, "V3": -1.60, "V4": 3.99,
    "V5": -0.52, "V6": -1.42, "V7": -2.53, "V8": 1.39, "V9": -2.77,
    "V10": -2.77, "V11": 3.20, "V12": -2.89, "V13": -0.59, "V14": -4.28,
    "V15": 0.38, "V16": -1.14, "V17": -2.83, "V18": -0.01, "V19": 0.41,
    "V20": 0.12, "V21": 0.51, "V22": -0.03, "V23": -0.46, "V24": 0.32,
    "V25": 0.04, "V26": 0.17, "V27": 0.26, "V28": -0.14, "Amount": 0.0
  }'
```

### Example response

```json
{
  "fraud_probability": 0.94,
  "prediction": 1,
  "risk_level": "High",
  "model_probabilities": {
    "logistic_regression": 0.91,
    "random_forest": 0.96,
    "xgboost": 0.95
  },
  "explanation": {
    "model": "XGBoost",
    "fraud_factors": [{ "feature": "V14", "impact": 1.82 }],
    "legitimate_factors": [{ "feature": "V22", "impact": -0.31 }]
  }
}
```

Error shape: `{ "detail": "<message>" }` with `500` on inference/store failures, `404` on unknown prediction id.

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+ · Node.js 18+ · PostgreSQL 14+ · Git

### 1. Clone

```bash
git clone https://github.com/priyanshu-sahani-10/RiskFusion.git
cd RiskFusion
```

### 2. Dataset (optional but recommended)

Download `creditcard.csv` from [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud) into:

```
data/raw/creditcard.csv
```

### 3. Backend

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Edit .env:
# DATABASE_URL=postgresql+psycopg://postgres:<password>@localhost:5432/riskfusion
# ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# Create the database (Postgres must be running):
# createdb riskfusion
# or: psql -U postgres -c "CREATE DATABASE riskfusion;"

uvicorn backend.app.main:app --reload --port 8000
# → http://localhost:8000/docs
```

Tables are auto-created on startup via `Base.metadata.create_all(bind=engine)`.

### 4. Frontend

```bash
cd frontend
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
# → http://localhost:5173
```

### 5. Try it

1. Open `http://localhost:5173`
2. Pick a transaction in **Transaction Explorer** (fraud rows are tagged `FRAUD`, legit rows `LEGIT`)
3. Click **Analyze** → watch the **Risk Assessment**, **Model Analysis**, and **Explainability** panels populate
4. Scroll to **Prediction History**, click any row for the full stored detail

---

## ⚙️ Configuration

| File | Variable | Default | Purpose |
|---|---|---|---|
| `.env` | `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/riskfusion` | SQLAlchemy + psycopg connection string |
| `.env` | `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | CORS allowlist for the Vite dev server |
| `frontend/.env` | `VITE_API_BASE_URL` | `http://localhost:8000` | Backend URL used by `lib/api.ts` |

---

## 🗄️ Database Schema (`predictions`)

| Column | Type | Notes |
|---|---|---|
| `id` | Integer PK | Auto-increment |
| `fraud_probability` | Float | Weighted ensemble output |
| `prediction` | Integer | `0` / `1` via threshold |
| `risk_level` | String | `Low` / `Medium` / `High` |
| `logistic_probability` | Float | LR component |
| `random_forest_probability` | Float | RF component |
| `xgboost_probability` | Float | XGB component |
| `explanation` | JSONB | `{ model, fraud_factors[], legitimate_factors[] }` |
| `created_at` | DateTime | `datetime.utcnow` default |

---

## 🧪 Key Design Decisions

- **Why an ensemble?** LR captures linear signal (on scaled features), RF/XGB capture non-linear interactions; weighting smooths individual-model variance on a 0.17%-fraud dataset.
- **Why threshold 0.73 instead of 0.5?** Selected on validation data to trade off precision/recall for extreme imbalance — mirrored in both `models/threshold.pkl` and `frontend/src/lib/api.ts:DECISION_THRESHOLD` for UI display.
- **Why SHAP on XGBoost only?** XGBoost is typically the strongest tabular-fraud model; explaining one consistent component keeps attributions stable and fast.
- **Why JSONB?** SHAP factor lists are variable-length nested data — JSONB stores them without a separate table while remaining queryable.

---

## 🔮 Roadmap

- [ ] Model retraining script (`src/` is currently empty) + MLflow tracking
- [ ] Pagination / filtering on `GET /predictions`
- [ ] Auth + per-user history, rate limiting
- [ ] Batch CSV scoring endpoint
- [ ] Docker Compose (API + Postgres + frontend) for one-command demo
- [ ] CI (pytest + tsc + build) via GitHub Actions

---

## 🤝 Contributing

PRs welcome! Please: (1) never commit `.env` or `data/raw/`, (2) keep `requirements.txt` pinned, (3) run the backend + `npm run dev` smoke test before pushing.

## 📄 License

No license file is included yet — all rights reserved by default. Add a `LICENSE` (e.g. MIT) if you want to open-source contributions.

## 👤 Author

**Priyanshu Sahani** — [RiskFusion on GitHub](https://github.com/priyanshu-sahani-10/RiskFusion)
