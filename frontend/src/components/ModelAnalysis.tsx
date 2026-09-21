import type { PredictResponse } from '../lib/api';

const MODELS: {
  key: keyof PredictResponse['model_probabilities'];
  name: string;
  short: string;
  caption: string;
}[] = [
  { key: 'logistic_regression', name: 'Logistic Regression', short: 'LR', caption: 'Linear baseline' },
  { key: 'random_forest', name: 'Random Forest', short: 'RF', caption: 'Tree ensemble' },
  { key: 'xgboost', name: 'XGBoost', short: 'XGB', caption: 'Gradient boosting' },
];

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
      className="h-5 w-5 shrink-0 rotate-90 self-center text-sky-500 md:rotate-0"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M21 12H3" />
    </svg>
  );
}

export default function ModelAnalysis({ result }: { result: PredictResponse }) {
  return (
    <div
      key={`models-${result.fraud_probability}`}
      className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 transition duration-200 hover:border-slate-300 sm:p-6"
    >
      <h2 className="text-lg font-semibold text-slate-900">Model Analysis</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Individual models feed the weighted ensemble, which produces the final
        decision probability.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {MODELS.map((m) => {
          const prob = result.model_probabilities[m.key];
          return (
            <div
              key={m.key}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-sky-300"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-sky-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-sky-700">
                  {m.short}
                </span>
                <span className="text-[11px] text-slate-500">{m.caption}</span>
              </div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                {m.name}
              </div>
              <div className="mt-1 font-mono text-2xl font-bold tabular-nums text-slate-900">
                {(prob * 100).toFixed(2)}%
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="bar-anim h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600"
                  style={{ width: `${prob * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 to-blue-50 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-xs font-bold uppercase tracking-[0.15em] text-sky-700">
            Ensemble · final decision probability
          </div>
          <div className="font-mono text-2xl font-bold tabular-nums text-slate-900">
            {(result.fraud_probability * 100).toFixed(2)}%
          </div>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-sky-100">
          <div
            className="bar-anim h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600"
            style={{ width: `${result.fraud_probability * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
          Ensemble pipeline
        </div>
        <div className="flex flex-col items-stretch gap-2 md:flex-row md:items-center">
          <div className="flex flex-1 flex-col gap-2">
            {MODELS.map((m) => (
              <div
                key={m.key}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-center font-mono text-xs text-slate-700"
              >
                {m.name}
              </div>
            ))}
          </div>
          <Arrow />
          <div className="rounded-lg border border-sky-300 bg-sky-50 px-4 py-3 text-center md:w-40">
            <div className="text-xs font-bold uppercase tracking-wider text-sky-700">
              Weighted ensemble
            </div>
            <div className="mt-0.5 font-mono text-sm font-bold tabular-nums text-slate-900">
              {(result.fraud_probability * 100).toFixed(2)}%
            </div>
          </div>
          <Arrow />
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-center md:w-40">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Risk decision
            </div>
            <div className="mt-0.5 text-sm font-bold uppercase text-slate-900">
              {result.risk_level} · {result.prediction === 1 ? 'Fraud' : 'Legitimate'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
