interface BadgeProps {
  value: string;
}

const RISK_STYLES: Record<string, string> = {
  High: 'bg-red-500/15 text-red-300 ring-red-400/30',
  Medium: 'bg-amber-500/15 text-amber-300 ring-amber-400/30',
  Low: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
};

export function RiskBadge({ value }: BadgeProps) {
  const style = RISK_STYLES[value] ?? 'bg-slate-500/15 text-slate-300 ring-slate-400/30';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${style}`}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

export function PredictionBadge({ value }: { value: number }) {
  const fraud = value === 1;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ring-1 ring-inset ${
        fraud
          ? 'bg-red-500/15 text-red-300 ring-red-400/30'
          : 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30'
      }`}
    >
      {fraud ? 'Fraud' : 'Legitimate'}
    </span>
  );
}
