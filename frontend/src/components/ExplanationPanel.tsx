import type { FeatureFactor, PredictResponse } from '../lib/api';

function byAbsImpactDesc(a: FeatureFactor, b: FeatureFactor): number {
  return Math.abs(b.impact) - Math.abs(a.impact);
}

/**
 * Diverging contribution bars on a shared center axis.
 * Positive impacts extend right (red/orange), negative extend left (green).
 */
function DivergingBars({
  factors,
  direction,
  emptyText,
}: {
  factors: FeatureFactor[];
  direction: 'positive' | 'negative';
  emptyText: string;
}) {
  const sorted = [...factors]
    .filter((f) => (direction === 'positive' ? f.impact >= 0 : f.impact < 0))
    .sort(byAbsImpactDesc);
  const max = Math.max(0.0001, ...sorted.map((f) => Math.abs(f.impact)));
  const positive = direction === 'positive';
  const bar = positive
    ? 'bg-gradient-to-r from-orange-500 to-red-500'
    : 'bg-gradient-to-l from-emerald-500 to-teal-400';
  const text = positive ? 'text-red-600' : 'text-emerald-600';

  if (sorted.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {sorted.map((f) => {
        const widthPct = (Math.abs(f.impact) / max) * 50;
        const style = positive
          ? { left: '50%', width: `${widthPct}%` }
          : { right: '50%', width: `${widthPct}%` };
        return (
          <li key={f.feature} className="flex items-center gap-2.5 text-sm">
            <span className="w-12 shrink-0 font-mono text-slate-600">{f.feature}</span>
            <div className="relative h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
              <div className="absolute left-1/2 top-0 h-full w-px bg-slate-400/60" />
              <div className={`bar-anim absolute top-0 h-full rounded-full ${bar}`} style={style} />
            </div>
            <span className={`w-20 shrink-0 text-right font-mono text-xs tabular-nums ${text}`}>
              {f.impact >= 0 ? '+' : ''}
              {f.impact.toFixed(4)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default function ExplanationPanel({ result }: { result: PredictResponse }) {
  const flagged = result.prediction === 1;

  return (
    <div
      key={`shap-${result.fraud_probability}`}
      className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 transition duration-200 hover:border-slate-300 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          {flagged ? 'Why was this transaction flagged?' : 'Why was this transaction cleared?'}
        </h2>
        <span className="text-xs text-slate-500">
          SHAP explanation for the XGBoost component
        </span>
      </div>

      <div className="mt-4 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-red-600">
            Increased fraud risk
          </h3>
          <DivergingBars
            factors={result.explanation.fraud_factors}
            direction="positive"
            emptyText="No fraud-driving factors."
          />
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-emerald-600">
            Decreased fraud risk
          </h3>
          <DivergingBars
            factors={result.explanation.legitimate_factors}
            direction="negative"
            emptyText="No legitimacy-driving factors."
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-xs leading-relaxed text-slate-600">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mt-0.5 h-4 w-4 shrink-0 text-sky-500"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <div className="space-y-1">
          <p>
            <span className="font-semibold text-slate-800">How to read this: </span>
            positive values push the XGBoost prediction toward fraud. Negative
            values push it toward legitimate.
          </p>
          <p>
            V1–V28 are anonymized PCA features from the source dataset.
            Explanation provided by XGBoost; final probability comes from the
            ensemble.
          </p>
        </div>
      </div>
    </div>
  );
}
