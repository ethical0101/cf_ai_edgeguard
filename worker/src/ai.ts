import type { ScanResult } from "./scanner";
import type { AnalysisResult } from "./memory";

const SYSTEM_PROMPT = `You are a cybersecurity and web performance expert.
Analyze the following website headers and response metrics.
Return strict JSON only with this schema:
{
  "security_score": number,
  "performance_score": number,
  "issues": string[],
  "recommendations": string[]
}
Do not include markdown or code fences.`;

function extractJsonObject(raw: string): string {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model output did not contain JSON object");
  }
  return raw.slice(start, end + 1);
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function normalizeAnalysis(data: Partial<AnalysisResult>): AnalysisResult {
  return {
    security_score: clampScore(Number(data.security_score ?? 0)),
    performance_score: clampScore(Number(data.performance_score ?? 0)),
    issues: Array.isArray(data.issues) ? data.issues.map(String) : [],
    recommendations: Array.isArray(data.recommendations) ? data.recommendations.map(String) : []
  };
}

function buildFallbackAnalysis(scan: ScanResult): AnalysisResult {
  const missingPenalty = Math.min(scan.missingHeaders.length * 1.5, 7.5);
  const latencyPenalty = Math.min(scan.latencyMs / 600, 3.5);
  const statusPenalty = scan.status >= 500 ? 2.5 : scan.status >= 400 ? 1.5 : 0;

  const securityScore = clampScore(10 - missingPenalty - statusPenalty * 0.6);
  const performanceScore = clampScore(10 - latencyPenalty - statusPenalty);

  const issues: string[] = [];
  if (scan.missingHeaders.length > 0) {
    issues.push(`Missing security headers: ${scan.missingHeaders.join(", ")}`);
  }
  if (scan.latencyMs > 1200) {
    issues.push(`High latency detected (${scan.latencyMs}ms).`);
  }
  if (scan.status >= 400) {
    issues.push(`Endpoint returned HTTP ${scan.status}.`);
  }
  if (issues.length === 0) {
    issues.push("No critical issues detected in baseline edge scan.");
  }

  const recommendations: string[] = [];
  if (scan.missingHeaders.includes("content-security-policy")) {
    recommendations.push("Add a strict Content-Security-Policy header to reduce XSS risk.");
  }
  if (scan.missingHeaders.includes("strict-transport-security")) {
    recommendations.push("Enable Strict-Transport-Security to enforce HTTPS.");
  }
  if (scan.missingHeaders.includes("x-frame-options")) {
    recommendations.push("Set X-Frame-Options to DENY or SAMEORIGIN to prevent clickjacking.");
  }
  if (scan.missingHeaders.includes("x-content-type-options")) {
    recommendations.push("Use X-Content-Type-Options: nosniff to avoid MIME sniffing.");
  }
  if (scan.missingHeaders.includes("cache-control")) {
    recommendations.push("Define explicit Cache-Control policy for static and dynamic assets.");
  }
  if (scan.latencyMs > 1200) {
    recommendations.push("Improve TTFB using CDN caching and origin optimization.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Maintain current header baseline and monitor edge latency over time.");
  }

  return {
    security_score: securityScore,
    performance_score: performanceScore,
    issues,
    recommendations
  };
}

async function runWorkersAi(env: Env, scan: ScanResult): Promise<AnalysisResult> {
  if (!env.AI) {
    throw new Error("Workers AI binding is unavailable");
  }

  const input = {
    url: scan.finalUrl,
    headers: scan.headers,
    latency: scan.latencyMs,
    status: scan.status,
    missing_headers: scan.missingHeaders
  };

  const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(input) }
    ]
  });

  const rawText =
    typeof response?.response === "string"
      ? response.response
      : JSON.stringify(response ?? {});
  const parsed = JSON.parse(extractJsonObject(rawText));
  return normalizeAnalysis(parsed as Partial<AnalysisResult>);
}

async function runGemini(env: Env, scan: ScanResult): Promise<AnalysisResult> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${SYSTEM_PROMPT}\n\nInput:\n${JSON.stringify({
              url: scan.finalUrl,
              headers: scan.headers,
              latency: scan.latencyMs,
              status: scan.status,
              missing_headers: scan.missingHeaders
            })}`
          }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const geminiUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

  const response = await fetch(`${geminiUrl}?key=${encodeURIComponent(env.GEMINI_API_KEY)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned empty content");
  }

  const parsed = JSON.parse(extractJsonObject(text));
  return normalizeAnalysis(parsed as Partial<AnalysisResult>);
}

export async function analyzeWithAi(env: Env, scan: ScanResult): Promise<AnalysisResult> {
  try {
    return await runWorkersAi(env, scan);
  } catch {
    try {
      return await runGemini(env, scan);
    } catch {
      return buildFallbackAnalysis(scan);
    }
  }
}
