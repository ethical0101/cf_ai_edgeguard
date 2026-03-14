import type { AnalysisReport } from "../api";
import { IssueList } from "./IssueList";
import { RecommendationList } from "./RecommendationList";
import { ScoreCard } from "./ScoreCard";

interface ResultsPanelProps {
  result: AnalysisReport;
}

export function ResultsPanel({ result }: ResultsPanelProps): JSX.Element {
  const importantHeaders = [
    "content-security-policy",
    "strict-transport-security",
    "x-frame-options",
    "x-content-type-options",
    "cache-control"
  ];

  return (
    <section className="fade-up mt-6 rounded-3xl border border-zinc-700/80 bg-zinc-900/60 p-5 shadow-panel backdrop-blur sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold text-zinc-50">Analysis Dashboard</h2>
          <p className="mt-1 font-mono text-xs text-zinc-400">{result.url}</p>
        </div>
        <span className="rounded-full border border-zinc-600 bg-zinc-800/80 px-3 py-1 text-xs uppercase tracking-wider text-zinc-300">
          Source: {result.source}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ScoreCard label="Security Score" value={result.analysis.security_score} accent="sky" />
        <ScoreCard label="Performance Score" value={result.analysis.performance_score} accent="amber" />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <IssueList issues={result.analysis.issues} />
        <RecommendationList recommendations={result.analysis.recommendations} />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
          <h3 className="text-base font-semibold text-zinc-100">Performance Snapshot</h3>
          <dl className="mt-3 space-y-3 text-sm text-zinc-300">
            <div className="flex justify-between rounded-lg border border-zinc-700 bg-zinc-950/50 px-3 py-2">
              <dt>HTTP Status</dt>
              <dd className="font-mono">{result.scan.status}</dd>
            </div>
            <div className="flex justify-between rounded-lg border border-zinc-700 bg-zinc-950/50 px-3 py-2">
              <dt>Response Time</dt>
              <dd className="font-mono">{result.scan.latencyMs} ms</dd>
            </div>
            <div className="flex justify-between rounded-lg border border-zinc-700 bg-zinc-950/50 px-3 py-2">
              <dt>Scanned At</dt>
              <dd className="font-mono">{new Date(result.scan.checkedAt).toLocaleString()}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-zinc-700 bg-zinc-900/70 p-4">
          <h3 className="text-base font-semibold text-zinc-100">Detected Headers</h3>
          <ul className="mt-3 grid gap-2 text-xs text-zinc-300 sm:grid-cols-2">
            {importantHeaders.map((header) => {
              const value = result.scan.headers[header] ?? "Missing";
              const missing = value === "Missing";
              return (
                <li
                  key={header}
                  className={`rounded-lg border p-3 ${
                    missing ? "border-red-500/35 bg-red-900/10" : "border-zinc-700 bg-zinc-950/60"
                  }`}
                >
                  <p className="font-mono text-zinc-100">{header}</p>
                  <p className="mt-1 break-all font-mono text-zinc-400">{value}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
