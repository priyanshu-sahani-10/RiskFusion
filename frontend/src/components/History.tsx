import { useMemo, useState } from 'react';
import type { PredictionDetail } from '../lib/api';
import { PredictionBadge, RiskBadge } from './badges';
import ExplanationPanel from './ExplanationPanel';

interface TableProps {
  items: PredictionDetail[];
  loading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

type SortKey = 'id' | 'risk_level' | 'fraud_probability' | 'prediction' | 'created_at';

const RISK_ORDER: Record<string, number> = { Low: 0, Medium: 1, High: 2 };

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'risk_level', label: 'Risk' },
  { key: 'fraud_probability', label: 'Probability' },
  { key: 'prediction', label: 'Prediction' },
  { key: 'created_at', label: 'Created' },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function TableSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/60">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="mb-2 h-10 animate-pulse rounded-lg bg-slate-100 last:mb-0"
        />
      ))}
    </div>
  );
}

export function HistoryTable({ items, loading, selectedId, onSelect }: TableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let cmp: number;
      switch (sortKey) {
        case 'risk_level':
          cmp = (RISK_ORDER[a.risk_level] ?? -1) - (RISK_ORDER[b.risk_level] ?? -1);
          break;
        case 'fraud_probability':
          cmp = a.fraud_probability - b.fraud_probability;
          break;
        case 'prediction':
          cmp = a.prediction - b.prediction;
          break;
        case 'created_at':
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        default:
          cmp = a.id - b.id;
      }
      return cmp * sortDir;
    });
    return arr;
  }, [items, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  }

  if (loading) return <TableSkeleton />;
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center shadow-xl shadow-slate-200/60">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="h-10 w-10 text-slate-300"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
        <p className="mt-3 text-sm font-medium text-slate-700">No predictions yet</p>
        <p className="mt-1 text-xs text-slate-500">
          Analyze a transaction above to create the first record.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <table className="w-full min-w-[600px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-4 py-3 font-semibold">
                <button
                  type="button"
                  onClick={() => toggleSort(col.key)}
                  className="inline-flex items-center gap-1 uppercase transition hover:text-sky-600"
                  aria-label={`Sort by ${col.label}`}
                >
                  {col.label}
                  <span className={sortKey === col.key ? 'text-sky-600' : 'text-slate-300'}>
                    {sortKey === col.key && sortDir === 1 ? '▲' : '▼'}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`cursor-pointer border-b border-slate-100 transition last:border-0 hover:bg-slate-50 ${
                selectedId === p.id ? 'bg-sky-50 hover:bg-sky-50' : ''
              }`}
            >
              <td className="px-4 py-2.5 font-mono text-slate-600">#{p.id}</td>
              <td className="px-4 py-2.5">
                <RiskBadge value={p.risk_level} />
              </td>
              <td className="px-4 py-2.5 font-mono tabular-nums text-slate-900">
                {(p.fraud_probability * 100).toFixed(2)}%
              </td>
              <td className="px-4 py-2.5">
                <PredictionBadge value={p.prediction} />
              </td>
              <td className="px-4 py-2.5 text-slate-500">{formatTime(p.created_at)}</td>
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
      <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
        Loading detail…
      </div>
    );
  }
  if (!detail) return null;
  return (
    <div className="animate-fade-up space-y-4">
      <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-xl shadow-slate-200/60">
        <h3 className="mb-1 text-sm font-semibold text-slate-800">
          Prediction #{detail.id}
        </h3>
        <p className="mb-3 text-xs text-slate-500">
          Full record from GET /predictions/{detail.id} · {formatTime(detail.created_at)}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <RiskBadge value={detail.risk_level} />
          <PredictionBadge value={detail.prediction} />
          <span className="font-mono text-2xl font-bold tabular-nums text-slate-900">
            {(detail.fraud_probability * 100).toFixed(2)}%
          </span>
          <span className="text-xs text-slate-500">fraud probability</span>
        </div>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-xs text-slate-500">Logistic Regression</div>
            <div className="font-mono tabular-nums text-slate-900">
              {detail.model_probabilities.logistic_regression.toFixed(4)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-xs text-slate-500">Random Forest</div>
            <div className="font-mono tabular-nums text-slate-900">
              {detail.model_probabilities.random_forest.toFixed(4)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <div className="text-xs text-slate-500">XGBoost</div>
            <div className="font-mono tabular-nums text-slate-900">
              {detail.model_probabilities.xgboost.toFixed(4)}
            </div>
          </div>
        </div>
      </div>
      <ExplanationPanel result={detail} />
    </div>
  );
}
