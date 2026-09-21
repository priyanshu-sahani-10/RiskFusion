import { useState } from 'react';
import type { FormEvent } from 'react';
import { FEATURES, predictTransaction } from '../lib/api';
import type { PredictResponse, TransactionInput } from '../lib/api';

interface Props {
  onResult: (result: PredictResponse) => void;
  onError: (message: string) => void;
}

function zeroSample(): Record<string, string> {
  const sample: Record<string, string> = {};
  for (const f of FEATURES) sample[f] = '0';
  sample['Amount'] = '10';
  return sample;
}

const LEGIT_SAMPLE: Record<string, string> = zeroSample();

const FRAUD_SAMPLE: Record<string, string> = {
  Time: '74159',
  V1: '-1.54',
  V2: '1.8',
  V3: '-0.95',
  V4: '2.21',
  V5: '-2.01',
  V6: '-0.91',
  V7: '-2.35',
  V8: '1.19',
  V9: '-1.67',
  V10: '-3.53',
  V11: '3.1',
  V12: '-3.99',
  V13: '-1.93',
  V14: '-3.82',
  V15: '0.83',
  V16: '-2.47',
  V17: '-5.21',
  V18: '-0.41',
  V19: '0.93',
  V20: '0.39',
  V21: '0.85',
  V22: '0.77',
  V23: '0.05',
  V24: '0.34',
  V25: '-0.46',
  V26: '-0.27',
  V27: '0.62',
  V28: '0.39',
  Amount: '76.94',
};

export default function PredictForm({ onResult, onError }: Props) {
  const [values, setValues] = useState<Record<string, string>>(LEGIT_SAMPLE);
  const [submitting, setSubmitting] = useState(false);

  function setField(feature: string, value: string) {
    setValues((prev) => ({ ...prev, [feature]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const transaction: TransactionInput = {};
    for (const f of FEATURES) {
      const parsed = Number(values[f]);
      if (!Number.isFinite(parsed)) {
        onError(`Invalid value for ${f}: must be a number.`);
        return;
      }
      transaction[f] = parsed;
    }
    setSubmitting(true);
    try {
      const result = await predictTransaction(transaction);
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
      className="rounded-xl border border-slate-800 bg-slate-900 p-5"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-100">Score a transaction</h2>
        <div className="flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setValues({ ...LEGIT_SAMPLE })}
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
          >
            Legit sample
          </button>
          <button
            type="button"
            onClick={() => setValues({ ...FRAUD_SAMPLE })}
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
          >
            Fraud sample
          </button>
          <button
            type="button"
            onClick={() => setValues(zeroSample())}
            className="rounded-md border border-slate-700 px-2 py-1 text-slate-300 hover:bg-slate-800"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
        {FEATURES.map((f) => (
          <label key={f} className="block">
            <span className="mb-0.5 block text-[11px] font-medium text-slate-400">
              {f}
            </span>
            <input
              type="number"
              step="any"
              value={values[f] ?? ''}
              onChange={(e) => setField(f, e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
            />
          </label>
        ))}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 w-full rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Scoring…' : 'Submit to POST /predict'}
      </button>
    </form>
  );
}
