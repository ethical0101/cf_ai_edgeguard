export interface AnalysisResult {
  security_score: number;
  performance_score: number;
  issues: string[];
  recommendations: string[];
}

export interface PersistedAnalysis {
  url: string;
  scan: {
    status: number;
    latencyMs: number;
    headers: Record<string, string>;
    missingHeaders: string[];
    checkedAt: string;
  };
  analysis: AnalysisResult;
  source: "live" | "cache";
  updatedAt: string;
}

function normalizeUrl(rawUrl: string): string {
  return rawUrl.trim().toLowerCase().replace(/\/$/, "");
}

function getCacheNamespace(env: Env): KVNamespace {
  return env.ANALYSIS_CACHE ?? env.KV ?? (() => {
    throw new Error("KV namespace binding is not configured");
  })();
}

export async function getCachedAnalysis(env: Env, rawUrl: string): Promise<PersistedAnalysis | null> {
  const cache = getCacheNamespace(env);
  const key = normalizeUrl(rawUrl);
  const existing = await cache.get(key);
  if (!existing) {
    return null;
  }

  try {
    return JSON.parse(existing) as PersistedAnalysis;
  } catch {
    return null;
  }
}

export async function setCachedAnalysis(
  env: Env,
  rawUrl: string,
  value: PersistedAnalysis
): Promise<void> {
  const cache = getCacheNamespace(env);
  const key = normalizeUrl(rawUrl);
  await cache.put(key, JSON.stringify(value));
}
