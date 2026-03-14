# Workflow Specification

## Workflow Class

- File: `worker/src/workflow.ts`
- Class: `AnalysisWorkflow`
- Runtime: Cloudflare Workflows

## Input

```json
{
  "url": "https://example.com"
}
```

## Step 1: Scan Website

- Performs HTTP GET against target URL.
- Measures request latency in milliseconds.
- Captures response status and headers.
- Inspects required security/performance headers:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Cache-Control`
- Builds list of missing headers.

## Step 2: AI Analysis

- Sends scan payload to LLM.
- Requires strict JSON output schema:

```json
{
  "security_score": 0,
  "performance_score": 0,
  "issues": [],
  "recommendations": []
}
```

- Primary provider: Workers AI (Llama).
- Fallback provider: Gemini API.

## Step 3: Memory Storage

- Persists result to KV namespace `ANALYSIS_CACHE`.
- Key = normalized URL.
- Value = full scan + AI report + metadata.

## Cache Strategy

- Workflow starts with `check-cache` step.
- If cache exists, workflow returns cached report without running scanner or AI.

## Output

The workflow returns a persisted analysis object:

```json
{
  "url": "https://example.com",
  "scan": {
    "status": 200,
    "latencyMs": 120,
    "headers": {},
    "missingHeaders": [],
    "checkedAt": "2026-03-14T00:00:00.000Z"
  },
  "analysis": {
    "security_score": 8.2,
    "performance_score": 7.5,
    "issues": [],
    "recommendations": []
  },
  "source": "live",
  "updatedAt": "2026-03-14T00:00:00.000Z"
}
```
