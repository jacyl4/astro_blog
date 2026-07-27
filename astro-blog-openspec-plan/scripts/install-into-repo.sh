#!/usr/bin/env bash
set -euo pipefail

SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${1:-$PWD}"

if [[ ! -f "$TARGET_DIR/package.json" ]]; then
  echo "目标目录缺少 package.json: $TARGET_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR/openspec" "$TARGET_DIR/program" "$TARGET_DIR/templates"
cp -R "$SOURCE_DIR/openspec/." "$TARGET_DIR/openspec/"
cp -R "$SOURCE_DIR/program/." "$TARGET_DIR/program/"
cp -R "$SOURCE_DIR/templates/." "$TARGET_DIR/templates/"

echo "已复制施工计划到: $TARGET_DIR"
echo "下一步: openspec update && openspec schema validate astro-engineering-change && openspec validate --all --strict"
