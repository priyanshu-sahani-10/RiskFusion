import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { predictTransaction } from '../lib/api';
import type { PredictResponse } from '../lib/api';
import {
  DEFAULT_FRAUD_ID,
  DEFAULT_LEGIT_ID,
  SAMPLE_TRANSACTIONS,
} from '../lib/samples';
import { PredictionBadge } from './badges';

interface Props {
  onResult: (result: PredictResponse) => void;
  onError: (message: string) => void;
}

export default function PredictForm({ onResult, onError }: Props) {
  const [selectedId, setSelectedId] = useState<number>(DEFAULT_LEGIT_ID);
  const [query, setQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SAMPLE_TRANSACTIONS;
    return SAMPLE_TRANSACTIONS.filter((s) => {
      const label = `#${s.id} ${s.transaction.Amount} ${s.actual === 1 ? 'fraud' : 'legitimate'}`;
      return label.toLowerCase().includes(q);
    });
  }, [query]);

  const selected = SAMPLE_TRANSACTIONS.find((s) => s.id === selectedId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) {
      onError('Select a transaction first.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await predictTransaction(selected.transaction);
      onResult(result);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Prediction request failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl backdrop-blur transition duration-200 hover:border-white/20 sm:p-6"
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-100">
          Transaction Analysis
        </h2>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedId(DEFAULT_LEGIT_ID)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-medium text-slate-300 transition hover:border-emerald-400/40 hover:text-emerald-300"
          >
            Legit sample
          </button>
          <button
            type="button"
            onClick={() => setSelectedId(DEFAULT_FRAUD_ID)}
            className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 font-medium text-slate-300 transition hover:border-red-400/40 hover:text-red-300"
          >
            Fraud sample
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-slate-400">
        Select a real transaction from the credit-card dataset. Time, the
        anonymized PCA features V1–V28, and Amount are sent to the API
        automatically.
      </p>

      <label className="mb-3 block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Search transactions
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 27627, 45.49, fraud…"
          className="w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-400/60 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Transaction ({options.length} of {SAMPLE_TRANSACTIONS.length})
        </span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          size={6}
          className="slim-scroll w-full rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100 focus:border-cyan-400/60 focus:outline-none"
        >
          {options.map((s) => (
            <option key={s.id} value={s.id}>
              #{s.id} — ${s.transaction.Amount.toFixed(2)} — actual:{' '}
              {s.actual === 1 ? 'Fraud' : 'Legitimate'}
            </option>
          ))}
        </select>
      </label>

      {selected && (
        <div
          key={selected.id}
          className="animate-fade-up mt-4 rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-blue-500/5 p-4"
        >
          <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-300/80">
            Selected transaction
          </div>
          <div className="mt-0.5 font-mono text-xl font-bold text-slate-100">
            #{selected.id}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                Amount
              </div>
              <div className="font-mono text-base font-semibold text-slate-100">
                ${selected.transaction.Amount.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">
                Time
              </div>
              <div className="font-mono text-base font-semibold text-slate-100">
                {selected.transaction.Time}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">
              Dataset label
            </span>
            <PredictionBadge value={selected.actual} />
          </div>
        </div>
      )}

      {selected && (
        <details className="mt-3 text-xs text-slate-500">
          <summary className="cursor-pointer transition hover:text-slate-300">
            View raw features sent to the API (V1–V28)
          </summary>
          <pre className="slim-scroll mt-1 max-h-40 overflow-auto rounded-lg border border-white/10 bg-slate-950/60 p-2 font-mono text-[11px] leading-relaxed text-slate-400">
            {JSON.stringify(selected.transaction, null, 1)}
          </pre>
        </details>
      )}

      <button
        type="submit"
        disabled={submitting || !selected}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
      >
        {submitting ? 'Analyzing…' : 'Analyze Transaction'}
      </button>
    </form>
  );
}
