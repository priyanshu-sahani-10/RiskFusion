import type { PredictionDetail } from '../lib/api';
import { PredictionBadge, RiskBadge } from './badges';

interface TableProps {
  items: PredictionDetail[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function HistoryTable({ items, loading, selectedId, onSelect }: TableProps) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Loading predictions…
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        No predictions yet. Analyze a transaction above to create the first record.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-2.5">ID</th>
            <th className="px-4 py-2.5">Risk</th>
            <th className="px-4 py-2.5">Fraud prob.</th>
            <th className="px-4 py-2.5">Prediction</th>
            <th className="px-4 py-2.5">Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50 ${
                selectedId === p.id ? 'bg-sky-50' : ''
              }`}
            >
              <td className="px-4 py-2 font-mono text-slate-700">#{p.id}</td>
              <td className="px-4 py-2">
                <RiskBadge value={p.risk_level} />
              </td>
              <td className="px-4 py-2 font-mono text-slate-900">
                {(p.fraud_probability * 100).toFixed(2)}%
              </td>
              <td className="px-4 py-2">
                <PredictionBadge value={p.prediction} />
              </td>
              <td className="px-4 py-2 text-slate-500">{formatTime(p.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetailCard({
  detail,
  loading,
}: {
  detail: PredictionDetail | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Loading detail…
      </div>
    );
  }
  if (!detail) return null;
  return (
    <div className="rounded-xl border border-sky-200 bg-white p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">
        Prediction #{detail.id}{' '}
        <span className="font-normal text-slate-500">
          — full record from GET /predictions/{detail.id}
        </span>
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <RiskBadge value={detail.risk_level} />
        <PredictionBadge value={detail.prediction} />
        <span className="font-mono text-sm text-slate-900">
          {(detail.fraud_probability * 100).toFixed(2)}%
        </span>
        <span className="text-xs text-slate-500">{formatTime(detail.created_at)}</span>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-md bg-slate-100 p-2.5">
          <div className="text-xs text-slate-500">Logistic Regression</div>
          <div className="font-mono text-slate-900">
            {detail.model_probabilities.logistic_regression.toFixed(4)}
          </div>
        </div>
        <div className="rounded-md bg-slate-100 p-2.5">
          <div className="text-xs text-slate-500">Random Forest</div>
          <div className="font-mono text-slate-900">
            {detail.model_probabilities.random_forest.toFixed(4)}
          </div>
        </div>
        <div className="rounded-md bg-slate-100 p-2.5">
          <div className="text-xs text-slate-500">XGBoost</div>
          <div className="font-mono text-slate-900">
            {detail.model_probabilities.xgboost.toFixed(4)}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        SHAP explanation model: {detail.explanation.model} —{' '}
        {detail.explanation.fraud_factors.length} fraud /{' '}
        {detail.explanation.legitimate_factors.length} legitimate factors stored.
      </p>
    </div>
  );
}
