interface BadgeProps {
  value: string;
}

const RISK_STYLES: Record<string, string> = {
  High: 'bg-red-100 text-red-700 ring-red-200',
  Medium: 'bg-amber-100 text-amber-800 ring-amber-200',
  Low: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

export function RiskBadge({ value }: BadgeProps) {
  const style = RISK_STYLES[value] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
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
          ? 'bg-red-100 text-red-700 ring-red-200'
          : 'bg-emerald-100 text-emerald-700 ring-emerald-200'
      }`}
    >
      {fraud ? 'Fraud' : 'Legitimate'}
    </span>
  );
}
