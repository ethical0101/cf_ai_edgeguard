export interface ScanSnapshot {
  status: number;
  latencyMs: number;
  headers: Record<string, string>;
  missingHeaders: string[];
  checkedAt: string;
}

export interface AnalysisSnapshot {
  security_score: number;
  performance_score: number;
  issues: string[];
  recommendations: string[];
}

export interface AnalysisReport {
  url: string;
  scan: ScanSnapshot;
  analysis: AnalysisSnapshot;
  source: "live" | "cache";
  updatedAt: string;
}

interface AnalyzeStartResponse {
  workflowId: string;
}

interface WorkflowStatusResponse {
  workflowId: string;
  status?: string;
  output?: AnalysisReport;
}

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ?? "http://127.0.0.1:8787";

export async function startAnalysis(url: string): Promise<string> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to start analysis: ${response.status} ${errorBody}`);
  }

  const data = (await response.json()) as AnalyzeStartResponse;
  if (!data.workflowId) {
    throw new Error("Worker returned no workflow id");
  }

  return data.workflowId;
}

export async function getResult(workflowId: string): Promise<WorkflowStatusResponse> {
  const response = await fetch(`${API_BASE}/result?id=${encodeURIComponent(workflowId)}`);
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to fetch result: ${response.status} ${errorBody}`);
  }
  return (await response.json()) as WorkflowStatusResponse;
}

export async function pollForResult(workflowId: string, maxAttempts = 45): Promise<AnalysisReport> {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await getResult(workflowId);
    const status = (result.status ?? "").toLowerCase();

    if (result.output) {
      return result.output;
    }

    if (status === "errored" || status === "error" || status === "failed") {
      throw new Error("Workflow execution failed");
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("Timed out waiting for workflow result");
}
