import type { FeatureFactor, PredictResponse } from '../lib/api';
import { PredictionBadge, RiskBadge } from './badges';

const MODEL_LABELS: { key: keyof PredictResponse['model_probabilities']; label: string }[] = [
  { key: 'logistic_regression', label: 'Logistic Regression' },
  { key: 'random_forest', label: 'Random Forest' },
  { key: 'xgboost', label: 'XGBoost' },
];

function FactorBars({
  factors,
  color,
  emptyText,
}: {
  factors: FeatureFactor[];
  color: 'red' | 'emerald';
  emptyText: string;
}) {
  const max = Math.max(0.0001, ...factors.map((f) => Math.abs(f.impact)));
  const bar = color === 'red' ? 'bg-red-500' : 'bg-emerald-500';
  const text = color === 'red' ? 'text-red-400' : 'text-emerald-400';

  if (factors.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }
  return (
    <ul className="space-y-1.5">
      {factors.map((f) => (
        <li key={f.feature} className="flex items-center gap-2 text-sm">
          <span className="w-12 shrink-0 font-mono text-slate-300">{f.feature}</span>
          <div className="h-2 flex-1 overflow-hidden rounded bg-slate-800">
            <div
              className={`h-full rounded ${bar}`}
              style={{ width: `${(Math.abs(f.impact) / max) * 100}%` }}
            />
          </div>
          <span className={`w-20 shrink-0 text-right font-mono text-xs ${text}`}>
            {f.impact >= 0 ? '+' : ''}
            {f.impact.toFixed(4)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ResultCard({ result }: { result: PredictResponse }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h2 className="mb-4 text-lg font-semibold text-slate-100">Result</h2>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <div>
          <div className="text-sm text-slate-400">Fraud probability</div>
          <div className="text-4xl font-bold text-slate-100">
            {(result.fraud_probability * 100).toFixed(2)}%
          </div>
        </div>
        <div className="flex gap-2 pb-1">
          <RiskBadge value={result.risk_level} />
          <PredictionBadge value={result.prediction} />
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-sm font-semibold text-slate-300">
          Model probability comparison
        </h3>
        <ul className="space-y-1.5">
          {MODEL_LABELS.map(({ key, label }) => {
            const prob = result.model_probabilities[key];
            return (
              <li key={key} className="flex items-center gap-2 text-sm">
                <span className="w-36 shrink-0 text-slate-400">{label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full rounded bg-sky-500"
                    style={{ width: `${prob * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs text-slate-300">
                  {prob.toFixed(4)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-5 border-t border-slate-800 pt-4">
        <h3 className="text-sm font-semibold text-slate-300">
          Explainability{' '}
          <span className="font-normal text-slate-500">
            (SHAP values from the XGBoost component — not the full ensemble)
          </span>
        </h3>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">
              Top fraud factors
            </h4>
            <FactorBars
              factors={result.explanation.fraud_factors}
              color="red"
              emptyText="No fraud-driving factors."
            />
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">
              Top legitimate factors
            </h4>
            <FactorBars
              factors={result.explanation.legitimate_factors}
              color="emerald"
              emptyText="No legitimacy-driving factors."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
