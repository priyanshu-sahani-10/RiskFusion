import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { predictTransaction } from '../lib/api';
import type { PredictResponse } from '../lib/api';
import type { SampleTransaction } from '../lib/samples';
import {
  DEFAULT_FRAUD_ID,
  DEFAULT_LEGIT_ID,
  SAMPLE_TRANSACTIONS,
} from '../lib/samples';
import { PredictionBadge } from './badges';

type Filter = 'all' | 'fraud' | 'legit';

interface Props {
  selected: SampleTransaction | null;
  onSelect: (sample: SampleTransaction) => void;
  onResult: (result: PredictResponse, sample: SampleTransaction) => void;
  onError: (message: string) => void;
  onAnalyzingChange: (analyzing: boolean) => void;
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fraud', label: 'Fraud' },
  { key: 'legit', label: 'Legitimate' },
];

export default function TransactionExplorer({
  selected,
  onSelect,
  onResult,
  onError,
  onAnalyzingChange,
}: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [submitting, setSubmitting] = useState(false);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SAMPLE_TRANSACTIONS.filter((s) => {
      if (filter === 'fraud' && s.actual !== 1) return false;
      if (filter === 'legit' && s.actual !== 0) return false;
      if (!q) return true;
      const label = `#${s.id} ${s.transaction.Amount} ${s.actual === 1 ? 'fraud' : 'legitimate'}`;
      return label.toLowerCase().includes(q);
    });
  }, [query, filter]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) {
      onError('Select a transaction first.');
      return;
    }
    setSubmitting(true);
    onAnalyzingChange(true);
    try {
      const result = await predictTransaction(selected.transaction);
      onResult(result, selected);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Prediction request failed.');
    } finally {
      setSubmitting(false);
      onAnalyzingChange(false);
    }
  }

  function pickSample(id: number) {
    const s = SAMPLE_TRANSACTIONS.find((t) => t.id === id);
    if (s) onSelect(s);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60 transition duration-200 hover:border-slate-300 sm:p-6"
    >
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">
          Transaction Explorer
        </h2>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => pickSample(DEFAULT_LEGIT_ID)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700"
          >
            Legit sample
          </button>
          <button
            type="button"
            onClick={() => pickSample(DEFAULT_FRAUD_ID)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 font-medium text-slate-600 transition hover:border-red-300 hover:text-red-700"
          >
            Fraud sample
          </button>
        </div>
      </div>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        Real transactions from the credit-card dataset. V1–V28 are anonymized
        PCA features and are sent to the API automatically.
      </p>

      <label className="mb-3 block">
        <span className="sr-only">Search transactions</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transaction ID, amount..."
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
        />
      </label>

      <div className="mb-3 flex gap-1.5" role="tablist" aria-label="Dataset label filter">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            role="tab"
            aria-selected={filter === f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === f.key
                ? 'bg-sky-100 text-sky-700 ring-1 ring-inset ring-sky-300'
                : 'border border-slate-300 bg-white text-slate-500 hover:text-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto self-center text-[11px] text-slate-400">
          {options.length} shown
        </span>
      </div>

      <div className="slim-scroll max-h-64 overflow-y-auto rounded-xl border border-slate-200">
        {options.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-slate-500">
            No transactions match this search.
          </p>
        )}
        {options.map((s) => {
          const active = selected?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              aria-pressed={active}
              className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left transition last:border-0 hover:bg-slate-50 ${
                active ? 'bg-sky-50 hover:bg-sky-50' : ''
              }`}
            >
              <span
                className={`h-8 w-1 shrink-0 rounded-full ${active ? 'bg-sky-500' : 'bg-slate-200'}`}
                aria-hidden="true"
              />
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-sm font-bold text-slate-900">
                  #{s.id}
                </span>
                <span className="block text-[11px] text-slate-500">
                  Time: <span className="font-mono">{s.transaction.Time}</span>
                </span>
              </span>
              <span className="font-mono text-sm tabular-nums text-slate-700">
                ${s.transaction.Amount.toFixed(2)}
              </span>
              <PredictionBadge value={s.actual} />
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          key={selected.id}
          className="animate-fade-up mt-4 rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50/60 p-4"
        >
          <div className="font-mono text-lg font-bold text-slate-900">
            Transaction #{selected.id}
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-slate-500">
                Amount
              </dt>
              <dd className="font-mono font-semibold text-slate-900">
                ${selected.transaction.Amount.toFixed(2)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-slate-500">
                Time
              </dt>
              <dd className="font-mono font-semibold text-slate-900">
                {selected.transaction.Time}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-slate-500">
                Dataset label
              </dt>
              <dd className="mt-0.5">
                <PredictionBadge value={selected.actual} />
              </dd>
            </div>
          </dl>
        </div>
      )}

      {selected && (
        <details className="mt-3 text-xs text-slate-500">
          <summary className="cursor-pointer transition hover:text-slate-700">
            View raw model features
          </summary>
          <pre className="slim-scroll mt-1 max-h-40 overflow-auto rounded-lg border border-slate-200 bg-slate-100 p-2 font-mono text-[11px] leading-relaxed text-slate-600">
            {JSON.stringify(selected.transaction, null, 1)}
          </pre>
        </details>
      )}

      <button
        type="submit"
        disabled={submitting || !selected}
        className="mt-4 w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:brightness-100"
      >
        {submitting ? 'Analyzing…' : 'Analyze Transaction'}
      </button>
    </form>
  );
}
