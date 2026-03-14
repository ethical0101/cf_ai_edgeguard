export interface HeaderInspection {
  required: string;
  value: string | null;
  present: boolean;
}

export interface ScanResult {
  url: string;
  finalUrl: string;
  status: number;
  ok: boolean;
  latencyMs: number;
  checkedAt: string;
  headers: Record<string, string>;
  inspectedHeaders: HeaderInspection[];
  missingHeaders: string[];
}

const REQUIRED_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-frame-options",
  "x-content-type-options",
  "cache-control"
];

export async function scanWebsite(url: string): Promise<ScanResult> {
  const startedAt = Date.now();
  const response = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: {
      "User-Agent": "cf-ai-edgeguard/1.0"
    }
  });
  const latencyMs = Date.now() - startedAt;

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const inspectedHeaders: HeaderInspection[] = REQUIRED_HEADERS.map((header) => ({
    required: header,
    value: headers[header] ?? null,
    present: Boolean(headers[header])
  }));

  const missingHeaders = inspectedHeaders
    .filter((item) => !item.present)
    .map((item) => item.required);

  return {
    url,
    finalUrl: response.url,
    status: response.status,
    ok: response.ok,
    latencyMs,
    checkedAt: new Date().toISOString(),
    headers,
    inspectedHeaders,
    missingHeaders
  };
}
