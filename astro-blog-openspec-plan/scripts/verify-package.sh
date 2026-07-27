#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

required=(
  "README.md"
  "START_HERE.md"
  "VALIDATION_REPORT.md"
  "openspec/config.yaml"
  "openspec/schemas/astro-engineering-change/schema.yaml"
  "program/03-execution-sequence.md"
  "references/ARCHITECTURE_REFACTOR_REPORT.md"
)

for file in "${required[@]}"; do
  test -s "$ROOT/$file" || { echo "缺少或为空: $file" >&2; exit 1; }
done

change_count=$(find "$ROOT/openspec/changes" -mindepth 1 -maxdepth 1 -type d ! -name archive | wc -l | tr -d ' ')
if [[ "$change_count" -lt 7 ]]; then
  echo "OpenSpec change 数量不足: $change_count" >&2
  exit 1
fi

while IFS= read -r change; do
  for file in .openspec.yaml proposal.md design.md tasks.md verification.md rollout.md; do
    test -s "$change/$file" || { echo "Change 缺少 $file: $change" >&2; exit 1; }
  done
done < <(find "$ROOT/openspec/changes" -mindepth 1 -maxdepth 1 -type d ! -name archive | sort)

if command -v openspec >/dev/null 2>&1; then
  (
    cd "$ROOT"
    openspec schema validate astro-engineering-change
    openspec validate --all --strict
    openspec doctor --json
  )
else
  echo "OpenSpec CLI 未安装，已完成文件结构校验。"
fi

echo "施工包结构校验通过。"
