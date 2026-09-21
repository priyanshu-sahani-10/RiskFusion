import type { ReactNode } from 'react';
import type { PredictionDetail } from '../lib/api';

interface Props {
  predictions: PredictionDetail[];
  loading: boolean;
}

function StatCard({
  label,
  caption,
  value,
  accent,
  dot,
}: {
  label: string;
  caption: string;
  value: ReactNode;
  accent: string;
  dot: string;
}) {
  return (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-white/20">
      <div className="flex items-center gap-2">
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </div>
      </div>
      <div className={`mt-2 text-4xl font-bold tabular-nums ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{caption}</div>
    </div>
  );
}

export default function Overview({ predictions, loading }: Props) {
  const total = predictions.length;
  const fraud = predictions.filter((p) => p.prediction === 1).length;
  const highRisk = predictions.filter((p) => p.risk_level === 'High').length;
  const fraudRate = total > 0 ? `${((fraud / total) * 100).toFixed(1)}%` : '—';

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-2xl border border-white/10 bg-white/[0.04]"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Total analyzed"
        caption="Transactions scored via API"
        value={total}
        accent="text-slate-100"
        dot="bg-cyan-400"
      />
      <StatCard
        label="Fraud detected"
        caption="Predicted as fraud"
        value={fraud}
        accent="text-red-300"
        dot="bg-red-400"
      />
      <StatCard
        label="Fraud rate"
        caption="Share of analyzed volume"
        value={fraudRate}
        accent="text-amber-300"
        dot="bg-amber-400"
      />
      <StatCard
        label="High risk"
        caption="High risk level"
        value={highRisk}
        accent="text-orange-300"
        dot="bg-orange-400"
      />
    </div>
  );
}
