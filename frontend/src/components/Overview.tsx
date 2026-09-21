import type { PredictionDetail } from '../lib/api';

interface Props {
  predictions: PredictionDetail[];
  loading: boolean;
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className={`text-3xl font-bold ${accent}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}

export default function Overview({ predictions, loading }: Props) {
  const total = predictions.length;
  const fraud = predictions.filter((p) => p.prediction === 1).length;
  const legitimate = total - fraud;
  const highRisk = predictions.filter((p) => p.risk_level === 'High').length;

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-slate-800 bg-slate-900"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Total predictions" value={total} accent="text-slate-100" />
      <StatCard label="Fraud detected" value={fraud} accent="text-red-400" />
      <StatCard label="Legitimate transactions" value={legitimate} accent="text-emerald-400" />
      <StatCard label="High-risk predictions" value={highRisk} accent="text-amber-400" />
    </div>
  );
}
