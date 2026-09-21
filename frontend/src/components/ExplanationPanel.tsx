import type { FeatureFactor, PredictResponse } from '../lib/api';

function byAbsImpactDesc(a: FeatureFactor, b: FeatureFactor): number {
  return Math.abs(b.impact) - Math.abs(a.impact);
}

function FactorBars({
  factors,
  color,
  emptyText,
}: {
  factors: FeatureFactor[];
  color: 'red' | 'green';
  emptyText: string;
}) {
  const sorted = [...factors].sort(byAbsImpactDesc);
  const max = Math.max(0.0001, ...sorted.map((f) => Math.abs(f.impact)));
  const bar =
    color === 'red'
      ? 'bg-gradient-to-r from-orange-500 to-red-500'
      : 'bg-gradient-to-r from-emerald-500 to-cyan-400';
  const text = color === 'red' ? 'text-red-300' : 'text-emerald-300';

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {sorted.map((f) => (
        <li key={f.feature} className="flex items-center gap-2.5 text-sm">
          <span className="w-12 shrink-0 font-mono text-slate-300">{f.feature}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <div
              className={`bar-anim h-full rounded-full ${bar}`}
              style={{ width: `${(Math.abs(f.impact) / max) * 100}%` }}
            />
          </div>
          <span className={`w-20 shrink-0 text-right font-mono text-xs tabular-nums ${text}`}>
            {f.impact >= 0 ? '+' : ''}
            {f.impact.toFixed(4)}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ExplanationPanel({ result }: { result: PredictResponse }) {
  return (
    <div
      key={`shap-${result.fraud_probability}`}
      className="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur transition duration-200 hover:border-white/20 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-100">
          Why this decision?
        </h2>
        <span className="text-xs text-slate-500">
          SHAP explanation for the XGBoost component
        </span>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-red-400/15 bg-red-500/[0.04] p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-red-300">
            Factors increasing fraud risk
          </h3>
          <FactorBars
            factors={result.explanation.fraud_factors}
            color="red"
            emptyText="No fraud-driving factors."
          />
        </div>
        <div className="rounded-xl border border-emerald-400/15 bg-emerald-500/[0.04] p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-300">
            Factors reducing fraud risk
          </h3>
          <FactorBars
            factors={result.explanation.legitimate_factors}
            color="green"
            emptyText="No legitimacy-driving factors."
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2.5 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.05] p-3.5 text-xs leading-relaxed text-slate-400">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <p>
          <span className="font-semibold text-slate-300">How to read this: </span>
          positive SHAP values push the XGBoost prediction toward fraud.
          Negative values push it toward legitimate.
        </p>
      </div>
    </div>
  );
}
