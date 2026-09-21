import { useCallback, useEffect, useState } from 'react';
import { DetailCard, HistoryTable } from './components/History';
import Overview from './components/Overview';
import PredictForm from './components/PredictForm';
import ResultCard from './components/ResultCard';
import ExplanationPanel from './components/ExplanationPanel';
import { checkHealth, getPrediction, listPredictions } from './lib/api';
import type { PredictResponse, PredictionDetail } from './lib/api';

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
      <span className="inline-block h-px w-4 bg-cyan-400/60" />
      {children}
    </h2>
  );
}

export default function App() {
  const [predictions, setPredictions] = useState<PredictionDetail[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PredictionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const refreshHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      setPredictions(await listPredictions());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load predictions.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshHistory();
    void checkHealth().then(setApiOnline);
  }, [refreshHistory]);

  function handleResult(r: PredictResponse) {
    setResult(r);
    setError(null);
    void refreshHistory();
  }

  async function handleSelect(id: number) {
    setSelectedId(id);
    setDetailLoading(true);
    try {
      setDetail(await getPrediction(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prediction detail.');
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#060b1d] text-slate-200">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-40 -right-24 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <header className="relative border-b border-white/10 bg-white/[0.03] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/25">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth={2}
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">
                RiskFusion
              </h1>
              <p className="text-xs text-slate-400">
                Explainable Multi-Model Fraud Detection
              </p>
            </div>
          </div>
          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
              apiOnline === false
                ? 'border-red-400/30 bg-red-500/10 text-red-300'
                : 'border-white/10 bg-white/5 text-slate-300'
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                apiOnline === null
                  ? 'bg-slate-500'
                  : apiOnline
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                    : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.9)]'
              }`}
            />
            {apiOnline === null
              ? 'Checking API…'
              : apiOnline
                ? 'API Online'
                : 'API Offline'}
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl space-y-8 px-4 py-6">
        {apiOnline === false && (
          <div className="animate-fade-up rounded-2xl border border-amber-400/25 bg-amber-400/[0.07] px-4 py-3 text-sm text-amber-200">
            The API appears to be offline. Start the FastAPI backend on port 8000
            to score transactions and load history.
          </div>
        )}
        {error && (
          <div className="animate-fade-up rounded-2xl border border-red-400/25 bg-red-500/[0.08] px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section>
          <SectionHeading>Overview</SectionHeading>
          <Overview predictions={predictions} loading={historyLoading} />
        </section>

        <section className="grid items-start gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading>Transaction</SectionHeading>
            <PredictForm onResult={handleResult} onError={setError} />
          </div>
          <div>
            <SectionHeading>Risk assessment</SectionHeading>
            {result ? (
              <ResultCard result={result} />
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-10 w-10 text-slate-600"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75"
                  />
                </svg>
                <p className="mt-3 text-sm font-medium text-slate-300">
                  No analysis yet
                </p>
                <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                  Select a transaction and click Analyze Transaction to see the
                  fraud probability, model comparison, and SHAP explanation here.
                </p>
              </div>
            )}
          </div>
        </section>

        {result && (
          <section>
            <SectionHeading>Explainability</SectionHeading>
            <ExplanationPanel result={result} />
          </section>
        )}

        <section>
          <SectionHeading>Prediction history</SectionHeading>
          <div className="space-y-4">
            <HistoryTable
              items={predictions}
              loading={historyLoading}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
            {(detail ?? detailLoading) && (
              <DetailCard detail={detail} loading={detailLoading} />
            )}
          </div>
        </section>

        <footer className="pb-4 text-center text-xs text-slate-600">
          RiskFusion · weighted ensemble LR / RF / XGBoost · threshold 0.731588 ·
          SHAP explains the XGBoost component
        </footer>
      </main>
    </div>
  );
}
