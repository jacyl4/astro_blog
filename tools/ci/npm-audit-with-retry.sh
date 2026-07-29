#!/usr/bin/env bash
set -euo pipefail

output_path="${1:-.build/evidence/npm-audit.json}"
attempts="${NPM_AUDIT_ATTEMPTS:-4}"
retry_delay="${NPM_AUDIT_RETRY_DELAY:-3}"
stderr_path="${output_path}.stderr"

mkdir -p "$(dirname "$output_path")"

for ((attempt = 1; attempt <= attempts; attempt += 1)); do
  set +e
  npm audit --audit-level=critical --json >"$output_path" 2>"$stderr_path"
  audit_status=$?
  set -e

  if verdict="$(node - "$output_path" <<'NODE'
const fs = require('node:fs');

try {
  const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  if (report.error || !report.metadata?.vulnerabilities) process.exit(2);
  const critical = Number(report.metadata.vulnerabilities.critical ?? 0);
  process.stdout.write(critical > 0 ? 'critical' : 'clean');
} catch {
  process.exit(2);
}
NODE
)"; then
    rm -f "$stderr_path"
    if [[ "$verdict" == "clean" ]]; then
      exit 0
    fi

    echo "npm audit found critical vulnerabilities" >&2
    exit 1
  fi

  echo "npm audit endpoint failed on attempt ${attempt}/${attempts} (exit ${audit_status})" >&2
  cat "$stderr_path" >&2
  if ((attempt < attempts)); then
    sleep "$((retry_delay * attempt))"
  fi
done

echo "npm audit endpoint remained unavailable after ${attempts} attempts" >&2
exit 2
