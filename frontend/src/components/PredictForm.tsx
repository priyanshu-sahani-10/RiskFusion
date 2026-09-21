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
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Transaction Analysis
        </h2>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setSelectedId(DEFAULT_LEGIT_ID)}
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100"
          >
            Legit sample
          </button>
          <button
            type="button"
            onClick={() => setSelectedId(DEFAULT_FRAUD_ID)}
            className="rounded-md border border-slate-300 px-2 py-1 text-slate-600 hover:bg-slate-100"
          >
            Fraud sample
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs text-slate-500">
        Pick a real transaction from the credit-card dataset. Time, the anonymized
        PCA features V1–V28, and Amount are sent to the API automatically.
      </p>

      <label className="mb-2 block">
        <span className="mb-0.5 block text-[11px] font-medium text-slate-500">
          Search transactions
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. 27627, 76.94, fraud…"
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-0.5 block text-[11px] font-medium text-slate-500">
          Transaction ({options.length} of {SAMPLE_TRANSACTIONS.length})
        </span>
        <select
          value={selectedId}
          onChange={(e) => setSelectedId(Number(e.target.value))}
          size={6}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 focus:border-sky-500 focus:outline-none"
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
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md bg-slate-100 p-2.5 text-sm">
          <span className="text-slate-600">
            Time: <span className="font-mono text-slate-900">{selected.transaction.Time}</span>
          </span>
          <span className="text-slate-600">
            Amount:{' '}
            <span className="font-mono text-slate-900">
              ${selected.transaction.Amount.toFixed(2)}
            </span>
          </span>
          <PredictionBadge value={selected.actual} />
          <span className="text-[11px] text-slate-400">(actual dataset label)</span>
        </div>
      )}

      {selected && (
        <details className="mt-2 text-xs text-slate-500">
          <summary className="cursor-pointer hover:text-slate-700">
            View raw features sent to the API (V1–V28)
          </summary>
          <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-slate-100 p-2 font-mono text-[11px] text-slate-700">
            {JSON.stringify(selected.transaction, null, 1)}
          </pre>
        </details>
      )}

      <button
        type="submit"
        disabled={submitting || !selected}
        className="mt-4 w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Analyzing…' : 'Analyze Transaction'}
      </button>
    </form>
  );
}
