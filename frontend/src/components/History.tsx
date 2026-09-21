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

function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-xl">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-2 h-10 animate-pulse rounded-lg bg-white/5 last:mb-0"
        />
      ))}
    </div>
  );
}

export function HistoryTable({ items, loading, selectedId, onSelect }: TableProps) {
  if (loading) return <TableSkeleton />;
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center shadow-xl">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-10 w-10 text-slate-600"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
        <p className="mt-3 text-sm font-medium text-slate-300">No predictions yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Analyze a transaction above to create the first record.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] shadow-xl backdrop-blur">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3 font-semibold">ID</th>
            <th className="px-4 py-3 font-semibold">Risk</th>
            <th className="px-4 py-3 font-semibold">Fraud prob.</th>
            <th className="px-4 py-3 font-semibold">Prediction</th>
            <th className="px-4 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`cursor-pointer border-b border-white/5 transition last:border-0 hover:bg-white/5 ${
                selectedId === p.id ? 'bg-cyan-400/10 hover:bg-cyan-400/10' : ''
              }`}
            >
              <td className="px-4 py-2.5 font-mono text-slate-300">#{p.id}</td>
              <td className="px-4 py-2.5">
                <RiskBadge value={p.risk_level} />
              </td>
              <td className="px-4 py-2.5 font-mono tabular-nums text-slate-100">
                {(p.fraud_probability * 100).toFixed(2)}%
              </td>
              <td className="px-4 py-2.5">
                <PredictionBadge value={p.prediction} />
              </td>
              <td className="px-4 py-2.5 text-slate-400">{formatTime(p.created_at)}</td>
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
      <div className="animate-pulse rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-500">
        Loading detail…
      </div>
    );
  }
  if (!detail) return null;
  return (
    <div className="animate-fade-up rounded-2xl border border-cyan-400/20 bg-white/[0.04] p-5 shadow-xl backdrop-blur">
      <h3 className="mb-3 text-sm font-semibold text-slate-200">
        Prediction #{detail.id}{' '}
        <span className="font-normal text-slate-500">
          — full record from GET /predictions/{detail.id}
        </span>
      </h3>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <RiskBadge value={detail.risk_level} />
        <PredictionBadge value={detail.prediction} />
        <span className="font-mono text-sm tabular-nums text-slate-100">
          {(detail.fraud_probability * 100).toFixed(2)}%
        </span>
        <span className="text-xs text-slate-500">{formatTime(detail.created_at)}</span>
      </div>
      <div className="grid gap-2 text-sm sm:grid-cols-3">
        <div className="rounded-lg border border-white/5 bg-slate-950/50 p-2.5">
          <div className="text-xs text-slate-500">Logistic Regression</div>
          <div className="font-mono tabular-nums text-slate-100">
            {detail.model_probabilities.logistic_regression.toFixed(4)}
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-950/50 p-2.5">
          <div className="text-xs text-slate-500">Random Forest</div>
          <div className="font-mono tabular-nums text-slate-100">
            {detail.model_probabilities.random_forest.toFixed(4)}
          </div>
        </div>
        <div className="rounded-lg border border-white/5 bg-slate-950/50 p-2.5">
          <div className="text-xs text-slate-500">XGBoost</div>
          <div className="font-mono tabular-nums text-slate-100">
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
