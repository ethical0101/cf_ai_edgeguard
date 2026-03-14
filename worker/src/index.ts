import { AnalysisWorkflow } from "./workflow";

function corsHeaders(origin = "*"): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  const cors = corsHeaders(headers.get("Origin") ?? "*");
  Object.entries(cors).forEach(([key, value]) => headers.set(key, value));

  return new Response(JSON.stringify(data), {
    ...init,
    headers
  });
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

type WorkflowHandle = {
  id: string;
  status?: () => Promise<Record<string, unknown>>;
};

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  let body: { url?: string };
  try {
    body = (await request.json()) as { url?: string };
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  if (!url || !isValidHttpUrl(url)) {
    return jsonResponse({ error: "A valid http/https URL is required" }, { status: 400 });
  }

  const workflow = (await env.ANALYSIS_WORKFLOW.create({
    params: { url }
  })) as WorkflowHandle;

  return jsonResponse({ workflowId: workflow.id }, { status: 202 });
}

async function handleResult(request: Request, env: Env): Promise<Response> {
  const requestUrl = new URL(request.url);
  const id = requestUrl.searchParams.get("id");
  if (!id) {
    return jsonResponse({ error: "Missing workflow id" }, { status: 400 });
  }

  const workflow = (await env.ANALYSIS_WORKFLOW.get(id)) as WorkflowHandle;
  if (!workflow.status) {
    return jsonResponse({ error: "Workflow status is unavailable" }, { status: 500 });
  }

  const status = await workflow.status();
  return jsonResponse({
    workflowId: id,
    ...status
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/analyze") {
      return handleAnalyze(request, env);
    }

    if (request.method === "GET" && url.pathname === "/result") {
      return handleResult(request, env);
    }

    return jsonResponse(
      {
        name: "cf_ai_edgeguard",
        endpoints: {
          analyze: "POST /analyze",
          result: "GET /result?id=<workflowId>"
        }
      },
      { status: 200 }
    );
  }
};

export { AnalysisWorkflow };
