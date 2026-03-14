#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[1/7] Initializing git repository (if needed)..."
if [ ! -d "${PROJECT_ROOT}/.git" ]; then
  git init
else
  echo "Git repository already exists, skipping git init."
fi

echo "[2/7] Installing frontend dependencies..."
cd "${PROJECT_ROOT}/frontend"
npm install

echo "[3/7] Installing worker dependencies..."
cd "${PROJECT_ROOT}/worker"
npm install

echo "[4/7] Installing Wrangler globally (if missing)..."
if ! command -v wrangler >/dev/null 2>&1; then
  npm install -g wrangler
else
  echo "Wrangler already installed."
fi

echo "[5/7] Environment setup reminder..."
cd "${PROJECT_ROOT}"
if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "Created .env from .env.example. Fill GEMINI_API_KEY only if you plan to use Gemini fallback."
else
  echo ".env already exists."
fi

echo "[6/7] Next commands (run in separate terminals):"
echo "  Terminal A: cd worker && wrangler dev"
echo "  Terminal B: cd frontend && npm run dev"

echo "[7/7] Optional deploy command:"
echo "  cd worker && wrangler deploy"

echo "Setup completed."
