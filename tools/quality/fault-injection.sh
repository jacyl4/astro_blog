#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FAULT_ROOT="$ROOT_DIR/.build/faults"
EVIDENCE_ROOT="$ROOT_DIR/.build/evidence"

node -e '
  const fs = require("node:fs");
  fs.rmSync(process.argv[1], { recursive: true, force: true });
  fs.mkdirSync(process.argv[1], { recursive: true });
' "$FAULT_ROOT"
mkdir -p "$EVIDENCE_ROOT"

copy_dist() {
  local name="$1"
  node -e '
    const fs = require("node:fs");
    fs.cpSync(process.argv[1], process.argv[2], { recursive: true });
  ' "$ROOT_DIR/dist" "$FAULT_ROOT/$name"
}

expect_failure() {
  local name="$1"
  shift
  if "$@" >"$EVIDENCE_ROOT/fault-${name}.log" 2>&1; then
    echo "fault gate unexpectedly passed: $name" >&2
    exit 1
  fi
  echo "fault gate rejected: $name"
}

copy_dist empty-icon
: > "$FAULT_ROOT/empty-icon/pwa-192x192.png"
expect_failure empty-icon \
  npm run assets:verify -- --dist "$FAULT_ROOT/empty-icon"

copy_dist broken-link
node -e '
  const fs = require("node:fs");
  const file = process.argv[1];
  const html = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, html.replace("</main>", "<img src=\"/missing-fault.webp\" alt=\"\"></main>"));
' "$FAULT_ROOT/broken-link/index.html"
expect_failure broken-link \
  npm run assets:verify -- --dist "$FAULT_ROOT/broken-link"

copy_dist deleted-route
node -e '
  const fs = require("node:fs");
  const baseline = JSON.parse(fs.readFileSync("baselines/routes.json", "utf8"));
  const route = baseline.routes.find((item) => item.kind === "post");
  if (!route) throw new Error("No post route in baseline");
  fs.rmSync(`${process.argv[1]}/${route.file}`, { force: true });
' "$FAULT_ROOT/deleted-route"
expect_failure deleted-route \
  npm run routes:verify -- --dist "$FAULT_ROOT/deleted-route"

npx vitest run tests/unit/page-lifecycle.test.ts \
  -t "uses the signal to remove an injected page listener during destroy" \
  >"$EVIDENCE_ROOT/fault-lifecycle-listener.log"
echo "fault gate rejected: lifecycle-listener"
