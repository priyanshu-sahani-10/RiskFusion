interface BadgeProps {
  value: string;
}

const RISK_STYLES: Record<string, string> = {
  High: 'bg-red-500/15 text-red-400 ring-red-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 ring-amber-500/30',
  Low: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30',
};

export function RiskBadge({ value }: BadgeProps) {
  const style = RISK_STYLES[value] ?? 'bg-slate-500/15 text-slate-300 ring-slate-500/30';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${style}`}
    >
      {value}
    </span>
  );
}

export function PredictionBadge({ value }: { value: number }) {
  const fraud = value === 1;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        fraud
          ? 'bg-red-500/15 text-red-400 ring-red-500/30'
          : 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30'
      }`}
    >
      {fraud ? 'Fraud' : 'Legitimate'}
    </span>
  );
}
