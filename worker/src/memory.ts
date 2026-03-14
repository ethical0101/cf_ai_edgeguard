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

export async function getCachedAnalysis(env: Env, rawUrl: string): Promise<PersistedAnalysis | null> {
  const key = normalizeUrl(rawUrl);
  const existing = await env.ANALYSIS_CACHE.get(key);
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
  const key = normalizeUrl(rawUrl);
  await env.ANALYSIS_CACHE.put(key, JSON.stringify(value));
}
