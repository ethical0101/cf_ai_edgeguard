import { type ChangeEvent, type FormEvent, useState } from "react";

interface AnalyzerProps {
  onAnalyze: (url: string) => Promise<void>;
  loading: boolean;
}

export function Analyzer({ onAnalyze, loading }: AnalyzerProps): JSX.Element {
  const [url, setUrl] = useState("https://example.com");

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await onAnalyze(url);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-3xl border border-zinc-700/70 bg-zinc-900/65 p-5 shadow-panel backdrop-blur sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="url" className="block text-sm font-semibold text-zinc-200">
          Website URL
        </label>
        <p className="font-mono text-xs text-zinc-400">Supports HTTP and HTTPS targets</p>
      </div>

      <div className="mt-3 flex flex-col gap-3 lg:flex-row">
        <input
          id="url"
          type="url"
          required
          value={url}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setUrl(event.target.value)}
          placeholder="https://example.com"
          className="w-full rounded-xl border border-zinc-600 bg-zinc-950/80 px-4 py-3 font-mono text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-500/25"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-w-36 items-center justify-center rounded-xl bg-gradient-to-r from-sky-400 to-cyan-300 px-5 py-3 text-sm font-semibold text-zinc-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 text-xs">
        <button
          type="button"
          onClick={() => setUrl("https://example.com")}
          className="rounded-full border border-zinc-600 px-3 py-1 text-zinc-300 transition hover:border-zinc-400 hover:text-zinc-100"
        >
          Example Target
        </button>
        <button
          type="button"
          onClick={() => setUrl("https://cloudflare.com")}
          className="rounded-full border border-zinc-600 px-3 py-1 text-zinc-300 transition hover:border-zinc-400 hover:text-zinc-100"
        >
          cloudflare.com
        </button>
      </div>

      {loading ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-sky-400/25 bg-sky-900/10 px-3 py-2 text-sm text-zinc-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          Running Cloudflare workflow and AI analysis
        </div>
      ) : null}
    </form>
  );
}
