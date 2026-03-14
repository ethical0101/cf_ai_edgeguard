import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { analyzeWithAi } from "./ai";
import { getCachedAnalysis, setCachedAnalysis, type PersistedAnalysis } from "./memory";
import { scanWebsite } from "./scanner";

export interface AnalyzeWorkflowParams {
  url: string;
}

export class AnalysisWorkflow extends WorkflowEntrypoint<Env, AnalyzeWorkflowParams> {
  async run(event: WorkflowEvent<AnalyzeWorkflowParams>, step: WorkflowStep): Promise<PersistedAnalysis> {
    const { url } = event.payload;

    const cached = await step.do("check-cache", async () => {
      return getCachedAnalysis(this.env, url);
    });

    if (cached) {
      return {
        ...cached,
        source: "cache"
      };
    }

    const scan = await step.do("scan-website", async () => {
      return scanWebsite(url);
    });

    const analysis = await step.do("run-ai-analysis", async () => {
      return analyzeWithAi(this.env, scan);
    });

    const persisted: PersistedAnalysis = {
      url,
      scan: {
        status: scan.status,
        latencyMs: scan.latencyMs,
        headers: scan.headers,
        missingHeaders: scan.missingHeaders,
        checkedAt: scan.checkedAt
      },
      analysis,
      source: "live",
      updatedAt: new Date().toISOString()
    };

    await step.do("store-cache", async () => {
      await setCachedAnalysis(this.env, url, persisted);
      return { stored: true };
    });

    return persisted;
  }
}
