import { useEffect, useState } from 'react';
import type { PredictResponse } from '../lib/api';
import { PredictionBadge } from './badges';

const MODEL_LABELS: { key: keyof PredictResponse['model_probabilities']; label: string; short: string }[] = [
  { key: 'logistic_regression', label: 'Logistic Regression', short: 'LR' },
  { key: 'random_forest', label: 'Random Forest', short: 'RF' },
  { key: 'xgboost', label: 'XGBoost', short: 'XGB' },
];

const RISK_COLOR: Record<string, string> = {
  High: '#f87171',
  Medium: '#fbbf24',
  Low: '#34d399',
};

function useAnimatedNumber(target: number, duration = 700): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function ProbabilityGauge({ probability, risk }: { probability: number; risk: string }) {
  const animated = useAnimatedNumber(probability);
  const color = RISK_COLOR[risk] ?? '#22d3ee';
  const r = 60;
  const c = 2 * Math.PI * r;

  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="11" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - animated)}
          style={{ filter: `drop-shadow(0 0 6px ${color}66)`, transition: 'stroke 0.3s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-3xl font-bold tabular-nums text-slate-100">
          {(animated * 100).toFixed(1)}%
        </div>
        <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
          Fraud probability
        </div>
      </div>
    </div>
  );
}

export default function ResultCard({ result }: { result: PredictResponse }) {
  const riskColor = RISK_COLOR[result.risk_level] ?? '#22d3ee';

  return (
    <div
      key={`${result.fraud_probability}-${result.risk_level}`}
      className="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur transition duration-200 hover:border-white/20 sm:p-6"
    >
      <h2 className="text-lg font-semibold text-slate-100">Risk Result</h2>

      <div className="mt-4 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <ProbabilityGauge probability={result.fraud_probability} risk={result.risk_level} />
        <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Risk level
          </div>
          <div
            className="text-4xl font-extrabold uppercase tracking-wide"
            style={{ color: riskColor, textShadow: `0 0 24px ${riskColor}44` }}
          >
            {result.risk_level}
          </div>
          <div className="mt-1">
            <PredictionBadge value={result.prediction} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">
          Ensemble input probabilities
        </h3>
        <ul className="space-y-2.5">
          {MODEL_LABELS.map(({ key, label, short }) => {
            const prob = result.model_probabilities[key];
            return (
              <li key={key} className="flex items-center gap-2 text-sm">
                <span className="hidden w-36 shrink-0 text-slate-400 sm:block">{label}</span>
                <span className="w-10 shrink-0 font-mono text-xs text-slate-400 sm:hidden">
                  {short}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="bar-anim h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    style={{ width: `${prob * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-slate-300">
                  {prob.toFixed(4)}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Final risk is calculated using the weighted ensemble of Logistic
          Regression, Random Forest, and XGBoost.
        </p>
      </div>
    </div>
  );
}
