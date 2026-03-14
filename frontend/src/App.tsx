import { useState } from "react";
import { Analyzer } from "./components/Analyzer";
import { ResultsPanel } from "./components/ResultsPanel";
import { pollForResult, startAnalysis, type AnalysisReport } from "./api";

export default function App(): JSX.Element {
  const [result, setResult] = useState<AnalysisReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowId, setWorkflowId] = useState<string | null>(null);

  async function handleAnalyze(url: string): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const id = await startAnalysis(url);
      setWorkflowId(id);
      const report = await pollForResult(id);
      setResult(report);
    } catch (analysisError) {
      const message = analysisError instanceof Error ? analysisError.message : "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-noise text-zinc-100">
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative mx-auto max-w-6xl px-4 pb-14 pt-8 sm:px-6 sm:pt-10">
        <header className="fade-up mb-8 rounded-3xl border border-zinc-700/70 bg-zinc-900/55 p-6 shadow-panel backdrop-blur sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-sky-300">Cloudflare AI Internship Project</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h1 className="text-4xl font-bold leading-tight text-zinc-50 sm:text-5xl">cf_ai_edgeguard</h1>
              <p className="mt-3 max-w-3xl text-zinc-300">
                Run edge-native website assessments with workflow orchestration, AI reasoning, and KV-backed memory.
                Enter any URL to generate a structured security and performance report in seconds.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-sky-400/30 bg-sky-900/20 px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-sky-200">Edge Runtime</p>
                <p className="mt-1 text-sm font-medium text-zinc-100">Cloudflare Workers + Workflows</p>
              </div>
              <div className="rounded-2xl border border-amber-300/30 bg-amber-900/20 px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-amber-200">AI Layer</p>
                <p className="mt-1 text-sm font-medium text-zinc-100">Workers AI + Gemini fallback</p>
              </div>
              <div className="rounded-2xl border border-emerald-300/30 bg-emerald-900/20 px-4 py-3">
                <p className="text-xs uppercase tracking-widest text-emerald-200">Memory</p>
                <p className="mt-1 text-sm font-medium text-zinc-100">KV cache by normalized URL</p>
              </div>
            </div>
          </div>
        </header>

        <div className="fade-up fade-delay-1">
          <Analyzer onAnalyze={handleAnalyze} loading={loading} />
        </div>

        {workflowId ? (
          <p className="mt-4 rounded-xl border border-zinc-700/70 bg-zinc-900/45 px-3 py-2 font-mono text-xs text-zinc-300">
            Workflow ID: {workflowId}
          </p>
        ) : null}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-500/40 bg-red-900/20 p-4 text-sm text-red-200 fade-up">
            {error}
          </div>
        ) : null}

        {result ? <ResultsPanel result={result} /> : null}
      </div>
    </main>
  );
}
