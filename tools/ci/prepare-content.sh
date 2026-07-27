#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOCK_FILE="${CONTENT_LOCK_FILE:-$ROOT_DIR/content-source.lock.json}"
CONTENT_WORKTREE="${CONTENT_WORKTREE:-$ROOT_DIR/.work/content-source}"

read_lock() {
  node -e "const x=require(process.argv[1]); process.stdout.write(String(x[process.argv[2]] ?? ''))" "$LOCK_FILE" "$1"
}

CONTENT_PROJECT_PATH="${CONTENT_PROJECT_PATH:-$(read_lock projectPath)}"
CONTENT_SUBDIR="${CONTENT_SUBDIR:-$(read_lock subdir)}"
CONTENT_SHA="${CONTENT_SHA:-$(read_lock sha)}"
CONTENT_COMPILER_MODE="${CONTENT_COMPILER_MODE:-$(read_lock mode)}"

if [[ -z "$CONTENT_PROJECT_PATH" || -z "$CONTENT_SUBDIR" || -z "$CONTENT_SHA" ]]; then
  echo "Content project, subdir, and SHA are required" >&2
  exit 1
fi
if [[ "$CONTENT_PROJECT_PATH" != "jacyl4/obsidian-digital" || "$CONTENT_SUBDIR" != "Blog" ]]; then
  echo "Refusing content source outside jacyl4/obsidian-digital:Blog/" >&2
  exit 1
fi
if [[ ! "$CONTENT_SHA" =~ ^[0-9a-f]{40}$ ]]; then
  echo "CONTENT_SHA must be an exact 40-character commit SHA" >&2
  exit 1
fi

if [[ -n "${CONTENT_CLONE_URL:-}" ]]; then
  CLONE_URL="$CONTENT_CLONE_URL"
elif [[ -n "${CI_JOB_TOKEN:-}" && -n "${CI_SERVER_FQDN:-}" ]]; then
  CLONE_URL="${CI_SERVER_PROTOCOL:-https}://gitlab-ci-token:${CI_JOB_TOKEN}@${CI_SERVER_FQDN}/${CONTENT_PROJECT_PATH}.git"
else
  echo "Set CONTENT_CLONE_URL locally or provide GitLab CI job-token variables" >&2
  exit 1
fi

node -e "require('node:fs').rmSync(process.argv[1], { recursive: true, force: true })" "$CONTENT_WORKTREE"
mkdir -p "$CONTENT_WORKTREE"
git -C "$CONTENT_WORKTREE" init --quiet
git -C "$CONTENT_WORKTREE" remote add origin "$CLONE_URL"
git -C "$CONTENT_WORKTREE" config core.sparseCheckout true
printf '/%s/\n' "$CONTENT_SUBDIR" > "$CONTENT_WORKTREE/.git/info/sparse-checkout"
git -C "$CONTENT_WORKTREE" fetch --quiet --depth=1 origin "$CONTENT_SHA"
git -C "$CONTENT_WORKTREE" checkout --quiet --detach FETCH_HEAD

ACTUAL_SHA="$(git -C "$CONTENT_WORKTREE" rev-parse HEAD)"
if [[ "$ACTUAL_SHA" != "$CONTENT_SHA" ]]; then
  echo "Content checkout mismatch: expected $CONTENT_SHA, got $ACTUAL_SHA" >&2
  exit 1
fi

mkdir -p "$ROOT_DIR/.build/evidence"
printf '%s\n' "$ACTUAL_SHA" > "$ROOT_DIR/.build/evidence/content-head.txt"

CONTENT_SOURCE_PATH="$CONTENT_WORKTREE" \
CONTENT_SUBDIR="$CONTENT_SUBDIR" \
CONTENT_SHA="$CONTENT_SHA" \
CONTENT_COMPILER_MODE="$CONTENT_COMPILER_MODE" \
npm run content:compile
