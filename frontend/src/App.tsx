import { useCallback, useEffect, useState } from 'react';
import { DetailCard, HistoryTable } from './components/History';
import Overview from './components/Overview';
import PredictForm from './components/PredictForm';
import ResultCard from './components/ResultCard';
import { checkHealth, getPrediction, listPredictions } from './lib/api';
import type { PredictResponse, PredictionDetail } from './lib/api';

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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">RiskFusion</h1>
            <p className="text-xs text-slate-400">
              Explainable multi-model fraud detection &amp; risk scoring
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                apiOnline === null
                  ? 'bg-slate-500'
                  : apiOnline
                    ? 'bg-emerald-400'
                    : 'bg-red-400'
              }`}
            />
            {apiOnline === null ? 'Checking API…' : apiOnline ? 'API online' : 'API offline'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error && (
          <div className="rounded-xl border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Overview
          </h2>
          <Overview predictions={predictions} loading={historyLoading} />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <PredictForm onResult={handleResult} onError={setError} />
          {result ? (
            <ResultCard result={result} />
          ) : (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-500">
              Submit a transaction to see the fraud probability, model comparison,
              and SHAP explanation here.
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Prediction history
          </h2>
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
          RiskFusion · ensemble LR / RF / XGBoost · threshold 0.731588 · SHAP explains
          the XGBoost component
        </footer>
      </main>
    </div>
  );
}
