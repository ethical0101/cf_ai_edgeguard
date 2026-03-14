interface WorkflowBinding {
  create(options: { params: { url: string } }): Promise<{ id: string }>;
  get(id: string): Promise<{ id: string; status?: () => Promise<Record<string, unknown>> }>;
}

interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<Record<string, unknown> & { response?: string }>;
}

interface Env {
  ANALYSIS_CACHE: KVNamespace;
  KV?: KVNamespace;
  ANALYSIS_WORKFLOW: WorkflowBinding;
  AI?: AiBinding;
  GEMINI_API_KEY?: string;
  WORKER_SUBDOMAIN?: string;
}
