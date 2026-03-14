#!/usr/bin/env bash
set -euo pipefail

# deploy_project.sh
# End-to-end deployment automation for cf_ai_edgeguard.
# Steps:
# 1) Dependency checks
# 2) Install frontend/worker dependencies
# 3) Build frontend
# 4) Deploy worker
# 5) Deploy pages
# 6) Update README with live URLs + architecture block
# 7) Create screenshot folder + instructions
# 8) Print demo recording instructions
# 9) Commit generated documentation updates
# 10) Print success summary

PROJECT_NAME="cf_ai_edgeguard"
REPO_URL="https://github.com/ethical0101/cf_ai_edgeguard.git"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${ROOT_DIR}/frontend"
WORKER_DIR="${ROOT_DIR}/worker"
README_FILE="${ROOT_DIR}/README.md"
SCREENSHOT_DIR="${ROOT_DIR}/docs/screenshots"
COMMIT_MESSAGE="Add deployment info and documentation"

WORKER_URL="N/A"
FRONTEND_URL="N/A"
USE_NPX_WRANGLER=0

log() {
  echo "[INFO] $1"
}

warn() {
  echo "[WARN] $1"
}

fail() {
  echo "[ERROR] $1" >&2
  exit 1
}

run_wrangler() {
  if [ "${USE_NPX_WRANGLER}" -eq 1 ]; then
    npx wrangler "$@"
  else
    wrangler "$@"
  fi
}

extract_worker_url() {
  # Match common Workers URL patterns from wrangler output.
  grep -Eo 'https://[A-Za-z0-9._-]+\.(workers\.dev|work\.dev)' | tail -n 1 || true
}

extract_pages_url() {
  # Match Cloudflare Pages URL.
  grep -Eo 'https://[A-Za-z0-9._-]+\.pages\.dev' | tail -n 1 || true
}

append_or_replace_readme_section() {
  local tmp_file
  tmp_file="$(mktemp)"

  if [ -f "${README_FILE}" ]; then
    awk '
      BEGIN { skip = 0 }
      /^<!-- AUTO_DEPLOY_INFO_START -->$/ { skip = 1; next }
      /^<!-- AUTO_DEPLOY_INFO_END -->$/ { skip = 0; next }
      skip == 0 { print }
    ' "${README_FILE}" > "${tmp_file}"
  else
    : > "${tmp_file}"
  fi

  cat >> "${tmp_file}" <<EOF

<!-- AUTO_DEPLOY_INFO_START -->
## Live Demo
${FRONTEND_URL}

## Worker API
${WORKER_URL}

## Architecture
User
-> Cloudflare Pages
-> Worker API
-> Workflow Engine
-> Scanner + AI
-> KV Storage
<!-- AUTO_DEPLOY_INFO_END -->
EOF

  mv "${tmp_file}" "${README_FILE}"
}

log "Starting deployment automation for ${PROJECT_NAME}"

# STEP 1 - Check dependencies
log "STEP 1: Checking required dependencies"
if ! command -v git >/dev/null 2>&1; then
  fail "git is missing. Install from: https://git-scm.com/downloads"
fi
if ! command -v node >/dev/null 2>&1; then
  fail "node is missing. Install from: https://nodejs.org/en/download"
fi
if ! command -v npm >/dev/null 2>&1; then
  fail "npm is missing. Reinstall Node.js to get npm."
fi

if command -v wrangler >/dev/null 2>&1; then
  log "wrangler detected: $(wrangler --version | head -n 1)"
else
  warn "wrangler not found globally. Trying local npx wrangler..."
  if npx wrangler --version >/dev/null 2>&1; then
    USE_NPX_WRANGLER=1
    log "Using npx wrangler from project dependencies."
  else
    fail "wrangler is missing. Install with: npm install -g wrangler"
  fi
fi

# STEP 2 - Install dependencies
log "STEP 2: Installing frontend dependencies"
cd "${FRONTEND_DIR}"
npm install

log "Installing worker dependencies"
cd "${WORKER_DIR}"
npm install

# STEP 3 - Build frontend
log "STEP 3: Building frontend"
cd "${FRONTEND_DIR}"
npm run build

if [ ! -d "${FRONTEND_DIR}/dist" ]; then
  fail "Frontend build failed: dist folder not found at ${FRONTEND_DIR}/dist"
fi
log "Frontend build verified: dist folder exists"

# STEP 4 - Deploy worker
log "STEP 4: Deploying Cloudflare Worker"
cd "${WORKER_DIR}"
set +e
WORKER_DEPLOY_OUTPUT="$(run_wrangler deploy 2>&1)"
WORKER_DEPLOY_EXIT=$?
set -e

echo "${WORKER_DEPLOY_OUTPUT}"
if [ ${WORKER_DEPLOY_EXIT} -ne 0 ]; then
  fail "Worker deployment failed. Ensure you are authenticated: wrangler login"
fi

WORKER_URL="$(printf '%s\n' "${WORKER_DEPLOY_OUTPUT}" | extract_worker_url)"
if [ -z "${WORKER_URL}" ]; then
  WORKER_URL="https://kommidruthendra2005.workers.dev"
  warn "Could not parse worker URL from output. Falling back to known subdomain: ${WORKER_URL}"
fi
log "Worker endpoint: ${WORKER_URL}"

# STEP 5 - Deploy frontend to Cloudflare Pages
log "STEP 5: Deploying frontend to Cloudflare Pages"
cd "${FRONTEND_DIR}"
set +e
if run_wrangler pages --help >/dev/null 2>&1; then
  PAGES_DEPLOY_OUTPUT="$(run_wrangler pages deploy dist 2>&1)"
  PAGES_DEPLOY_EXIT=$?
else
  PAGES_DEPLOY_OUTPUT="wrangler pages command is not available in this environment."
  PAGES_DEPLOY_EXIT=1
fi
set -e

echo "${PAGES_DEPLOY_OUTPUT}"
if [ ${PAGES_DEPLOY_EXIT} -eq 0 ]; then
  FRONTEND_URL="$(printf '%s\n' "${PAGES_DEPLOY_OUTPUT}" | extract_pages_url)"
  if [ -z "${FRONTEND_URL}" ]; then
    FRONTEND_URL="N/A"
    warn "Pages deploy succeeded but URL could not be parsed from output."
  fi
else
  warn "Pages deployment skipped/failed. You can retry manually: cd frontend && wrangler pages deploy dist"
fi

log "Frontend URL: ${FRONTEND_URL}"

# STEP 6 - Update README sections
log "STEP 6: Updating README deployment sections"
append_or_replace_readme_section

# STEP 7 - Create screenshot folder and print instructions
log "STEP 7: Creating screenshot directory"
mkdir -p "${SCREENSHOT_DIR}"
echo "Screenshot instructions:"
echo "- Open deployed site"
echo "- Take screenshots of:"
echo "  - homepage"
echo "  - analysis result"

# STEP 8 - Demo recording instructions
log "STEP 8: Demo recording instructions"
echo "Demo recording flow:"
echo "- Open deployed app"
echo "- Enter website URL"
echo "- Run analysis"
echo "- Show results dashboard"

# STEP 9 - Git commit updates
log "STEP 9: Committing generated documentation updates"
cd "${ROOT_DIR}"
if [ ! -d "${ROOT_DIR}/.git" ]; then
  warn "No .git directory found; skipping git add/commit."
else
  git add README.md docs/screenshots deploy_project.sh
  if git diff --cached --quiet; then
    warn "No documentation changes to commit."
  else
    git commit -m "${COMMIT_MESSAGE}"
    log "Documentation commit created."
  fi
fi

# STEP 10 - Success output
log "STEP 10: Deployment summary"
echo "--------------------------------"
echo "Worker URL:   ${WORKER_URL}"
echo "Frontend URL: ${FRONTEND_URL}"
echo "GitHub Repo:  ${REPO_URL}"
echo "--------------------------------"
echo "Run instructions:"
echo "chmod +x deploy_project.sh"
echo "./deploy_project.sh"
