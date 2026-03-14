# cf_ai_edgeguard

AI-powered website security and performance analyzer built fully on Cloudflare infrastructure.

## Project Overview

`cf_ai_edgeguard` lets users submit a URL and receive an AI-generated report with:

- Security score (0-10)
- Performance score (0-10)
- Detected issues
- Actionable recommendations
- Response time and HTTP status
- Key response headers

The system is production-structured, modular, and cloud-native.

## Cloudflare Architecture

- **Cloudflare Pages** hosts the React frontend.
- **Cloudflare Worker** exposes API endpoints.
- **Cloudflare Workflows** orchestrates scan + AI + storage steps.
- **Cloudflare KV** caches/stores analysis results by URL.
- **Workers AI** is primary LLM provider.
- **Gemini API** is fallback LLM provider through `GEMINI_API_KEY`.

See full architecture details in [docs/architecture.md](docs/architecture.md).

## Repository Structure

```text
cf_ai_edgeguard/
  frontend/
    src/
      App.tsx
      components/
        Analyzer.tsx
        ResultsPanel.tsx
        ScoreCard.tsx
        IssueList.tsx
        RecommendationList.tsx
      api.ts
    index.html
    package.json
    tailwind.config.js
    vite.config.ts
  worker/
    src/
      index.ts
      workflow.ts
      scanner.ts
      ai.ts
      memory.ts
    wrangler.toml
    package.json
  docs/
    architecture.md
    workflow.md
  README.md
  PROMPTS.md
  .env.example
  .gitignore
  setup.sh
```

## Workflow Explanation

1. `POST /analyze` receives `{ "url": "https://example.com" }`.
2. Worker starts a Cloudflare Workflow and returns `workflowId`.
3. Workflow steps:
   - Check cache in KV
   - Scan website headers and latency
   - Run AI analysis
   - Persist report to KV
4. Frontend polls `GET /result?id=<workflowId>`.
5. Final report renders in dashboard.

Detailed workflow: [docs/workflow.md](docs/workflow.md).

## API Endpoints

### `POST /analyze`

Request:

```json
{
  "url": "https://example.com"
}
```

Response:

```json
{
  "workflowId": "<workflow-id>"
}
```

### `GET /result?id=<workflowId>`

Returns workflow state and output report when completed.

## Environment Variables

Create `.env` from `.env.example`:

```env
GEMINI_API_KEY=
```

Notes:

- Never commit real API keys.
- If Workers AI is enabled, Gemini key is optional.

## Setup Instructions

### Option A: Automated Setup

```bash
chmod +x setup.sh
./setup.sh
```

### Option B: Manual Setup

```bash
cd frontend
npm install

cd ../worker
npm install
```

## Local Development

Run in two terminals:

### Terminal A (Worker)

```bash
cd worker
wrangler login
wrangler dev
```

### Terminal B (Frontend)

```bash
cd frontend
npm run dev
```

Frontend points to local Worker API by default at `http://127.0.0.1:8787`.

## Deployment Steps

```bash
npm install
wrangler login
wrangler dev
wrangler deploy
```

For frontend deployment to Pages, build and deploy your `frontend/dist` output through Cloudflare Pages.

## Wrangler Notes

`worker/wrangler.toml` includes:

- `ANALYSIS_CACHE` KV namespace binding
- `ANALYSIS_WORKFLOW` workflow binding
- Account ID: `20140b52faa3469fb9b2e112c2dc0696`
- Workers.dev subdomain variable: `kommidruthendra2005.workers.dev`

Replace KV namespace IDs before deploy.

## Git Setup

```bash
git init
git add .
git commit -m "Initial commit: cf_ai_edgeguard"
git push
```

## Screenshots

Add screenshots here after running the app:

- Dashboard input page
- In-progress analysis state
- Final report with scores/issues/recommendations

## Demo

Suggested demo flow:

1. Start Worker and frontend.
2. Analyze `https://example.com`.
3. Show workflow ID and polling behavior.
4. Show cached result behavior on repeated scan.
5. Deploy Worker with `wrangler deploy`.
