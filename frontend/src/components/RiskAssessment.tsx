import { useEffect, useState } from 'react';
import { DECISION_THRESHOLD } from '../lib/api';
import type { PredictResponse } from '../lib/api';
import type { SampleTransaction } from '../lib/samples';
import { PredictionBadge } from './badges';

const RISK_COLOR: Record<string, string> = {
  High: '#f87171',
  Medium: '#fbbf24',
  Low: '#34d399',
};

const ANALYZING_STEPS = ['Running ensemble', 'Generating explanation'];

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
    <div className="relative h-44 w-44 shrink-0">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
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

export function AnalyzingPanel() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setStep(1), 600);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center shadow-xl backdrop-blur">
      <svg
        className="h-10 w-10 animate-spin text-cyan-300"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.2" strokeWidth="4" />
        <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <p className="mt-4 text-sm font-semibold text-slate-200">Analyzing transaction…</p>
      <ul className="mt-3 space-y-1.5 text-xs">
        {ANALYZING_STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-2 ${i <= step ? 'text-cyan-300' : 'text-slate-600'}`}
          >
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${i <= step ? 'bg-cyan-300' : 'bg-slate-700'}`}
            />
            {label}
            {i === step ? '…' : i < step ? ' ✓' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BreakdownCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/50 px-3 py-2.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={`mt-0.5 font-mono text-sm font-bold tabular-nums ${accent ?? 'text-slate-100'}`}>
        {value}
      </div>
    </div>
  );
}

export default function RiskAssessment({
  result,
  sample,
}: {
  result: PredictResponse;
  sample: SampleTransaction | null;
}) {
  const riskColor = RISK_COLOR[result.risk_level] ?? '#22d3ee';
  const marginPts = (result.fraud_probability - DECISION_THRESHOLD) * 100;
  const above = marginPts >= 0;

  return (
    <div
      key={`${result.fraud_probability}-${result.risk_level}`}
      className="animate-fade-up rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur transition duration-200 hover:border-white/20 sm:p-6"
    >
      <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
        Risk assessment
      </div>

      <div className="mt-3 flex flex-col items-center gap-5 sm:flex-row sm:gap-6">
        <ProbabilityGauge probability={result.fraud_probability} risk={result.risk_level} />
        <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          <div
            className="text-4xl font-extrabold uppercase leading-none tracking-wide sm:text-5xl"
            style={{ color: riskColor, textShadow: `0 0 28px ${riskColor}44` }}
          >
            {result.risk_level}
            <span className="block text-2xl sm:text-3xl">risk</span>
          </div>
          <div className="mt-1">
            <PredictionBadge value={result.prediction} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <BreakdownCell
          label="Fraud probability"
          value={`${(result.fraud_probability * 100).toFixed(2)}%`}
        />
        <BreakdownCell
          label="Decision threshold"
          value={`${(DECISION_THRESHOLD * 100).toFixed(2)}%`}
        />
        <BreakdownCell
          label={above ? 'Above threshold' : 'Below threshold'}
          value={`${above ? '+' : ''}${marginPts.toFixed(2)} pts`}
          accent={above ? 'text-red-300' : 'text-emerald-300'}
        />
        <BreakdownCell
          label="Prediction"
          value={result.prediction === 1 ? 'FRAUD' : 'LEGITIMATE'}
          accent={result.prediction === 1 ? 'text-red-300' : 'text-emerald-300'}
        />
      </div>

      {sample && (
        <div className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-3.5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
            Transaction profile
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-slate-500">Transaction</dt>
              <dd className="font-mono font-semibold text-slate-200">#{sample.id}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-slate-500">Amount</dt>
              <dd className="font-mono font-semibold text-slate-200">
                ${sample.transaction.Amount.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-slate-500">Dataset label</dt>
              <dd className="mt-0.5">
                <PredictionBadge value={sample.actual} />
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-slate-500">Model decision</dt>
              <dd className="mt-0.5">
                <PredictionBadge value={result.prediction} />
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
