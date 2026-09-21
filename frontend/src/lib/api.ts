export const FEATURES: string[] = [
  'Time',
  ...Array.from({ length: 28 }, (_, i) => `V${i + 1}`),
  'Amount',
];

export interface FeatureFactor {
  feature: string;
  impact: number;
}

export interface Explanation {
  model: string;
  fraud_factors: FeatureFactor[];
  legitimate_factors: FeatureFactor[];
}

export interface ModelProbabilities {
  logistic_regression: number;
  random_forest: number;
  xgboost: number;
}

export interface PredictResponse {
  fraud_probability: number;
  prediction: number;
  risk_level: string;
  model_probabilities: ModelProbabilities;
  explanation: Explanation;
}

export interface PredictionDetail extends PredictResponse {
  id: number;
  created_at: string;
}

export type TransactionInput = Record<string, number>;

const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: unknown };
      if (typeof body.detail === 'string' && body.detail.length > 0) {
        detail = body.detail;
      }
    } catch {
      // keep default message
    }
    throw new Error(detail);
  }
  return (await res.json()) as T;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`);
    return res.ok;
  } catch {
    return false;
  }
}

export async function predictTransaction(
  transaction: TransactionInput,
): Promise<PredictResponse> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction),
  });
  return handleResponse<PredictResponse>(res);
}

export async function listPredictions(): Promise<PredictionDetail[]> {
  const res = await fetch(`${API_BASE}/predictions`);
  return handleResponse<PredictionDetail[]>(res);
}

export async function getPrediction(id: number): Promise<PredictionDetail> {
  const res = await fetch(`${API_BASE}/predictions/${id}`);
  return handleResponse<PredictionDetail>(res);
}
