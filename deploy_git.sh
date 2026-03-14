#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/ethical0101/cf_ai_edgeguard.git"
COMMIT_MESSAGE="Initial commit - Cloudflare AI EdgeGuard project"

log() {
  echo "[INFO] $1"
}

warn() {
  echo "[WARN] $1"
}

error() {
  echo "[ERROR] $1" >&2
}

# 1) Check if git is installed
if ! command -v git >/dev/null 2>&1; then
  error "Git is not installed. Please install Git and try again."
  exit 1
fi

PROJECT_ROOT="$(pwd)"
log "Project root: ${PROJECT_ROOT}"

# 2) Initialize git repository if .git folder does not exist
if [ ! -d ".git" ]; then
  log "Initializing git repository..."
  git init
else
  log "Git repository already initialized."
fi

# 3) Create/update .gitignore and ensure required entries exist
if [ ! -f ".gitignore" ]; then
  log "Creating .gitignore..."
  cat > .gitignore <<'EOF'
node_modules
.env
dist
build
EOF
else
  log "Ensuring required .gitignore entries exist..."
fi

ensure_gitignore_entry() {
  local entry="$1"
  if ! grep -qxF "$entry" .gitignore; then
    echo "$entry" >> .gitignore
    log "Added '$entry' to .gitignore"
  fi
}

ensure_gitignore_entry "node_modules"
ensure_gitignore_entry ".env"
ensure_gitignore_entry "dist"
ensure_gitignore_entry "build"

# 4) Add all project files
touch .gitignore
log "Adding files to git..."
git add .

# 5) Create initial commit (or skip if nothing to commit)
if git diff --cached --quiet; then
  warn "No staged changes found. Skipping commit."
else
  log "Creating commit..."
  git commit -m "$COMMIT_MESSAGE"
fi

# 6) Rename branch to main
log "Setting branch to main..."
git branch -M main

# 7/8) Add or update remote origin
if git remote get-url origin >/dev/null 2>&1; then
  log "Updating existing origin remote..."
  git remote set-url origin "$REPO_URL"
else
  log "Adding origin remote..."
  git remote add origin "$REPO_URL"
fi

# 9) Push with upstream tracking
log "Pushing to GitHub..."
if git push -u origin main; then
  # 10) Success message with URL
  echo
  echo "Success: Repository pushed to GitHub"
  echo "URL: ${REPO_URL}"
else
  error "Push failed. Check your GitHub permissions/authentication and try again."
  exit 1
fi

echo
echo "Run instructions:"
echo "chmod +x deploy_git.sh"
echo "./deploy_git.sh"
