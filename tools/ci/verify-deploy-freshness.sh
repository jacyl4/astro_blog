#!/usr/bin/env bash
set -euo pipefail

: "${CI_API_V4_URL:?CI_API_V4_URL is required}"
: "${CI_JOB_TOKEN:?CI_JOB_TOKEN is required}"
: "${CI_PROJECT_PATH:?CI_PROJECT_PATH is required}"
: "${CI_DEFAULT_BRANCH:?CI_DEFAULT_BRANCH is required}"
: "${CI_COMMIT_REF_NAME:?CI_COMMIT_REF_NAME is required}"
: "${CI_COMMIT_SHA:?CI_COMMIT_SHA is required}"

branch_sha() {
  local project_path="$1"
  local branch="$2"
  local encoded_project encoded_branch
  encoded_project="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$project_path")"
  encoded_branch="$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$branch")"
  curl \
    --fail \
    --location \
    --retry 3 \
    --retry-all-errors \
    --silent \
    --show-error \
    --header "JOB-TOKEN: ${CI_JOB_TOKEN}" \
    "${CI_API_V4_URL}/projects/${encoded_project}/repository/branches/${encoded_branch}" \
    | node -e '
        let input = "";
        process.stdin.on("data", (chunk) => { input += chunk; });
        process.stdin.on("end", () => {
          const sha = JSON.parse(input)?.commit?.id;
          if (!/^[0-9a-f]{40}$/.test(sha ?? "")) process.exit(1);
          process.stdout.write(sha);
        });
      '
}

deploy_ref="${DEPLOY_REF:-$CI_DEFAULT_BRANCH}"
latest_app_sha="$(branch_sha "$CI_PROJECT_PATH" "$deploy_ref")"
if [[ "$latest_app_sha" != "$CI_COMMIT_SHA" ]]; then
  echo "Refusing stale app deployment: candidate is not current ${deploy_ref} HEAD" >&2
  exit 1
fi

if [[ -n "${CONTENT_SHA:-}" ]]; then
  : "${CONTENT_PROJECT_PATH:?CONTENT_PROJECT_PATH is required with CONTENT_SHA}"
  content_ref="${CONTENT_REF:-main}"
  latest_content_sha="$(branch_sha "$CONTENT_PROJECT_PATH" "$content_ref")"
  if [[ "$latest_content_sha" != "$CONTENT_SHA" ]]; then
    echo "Refusing stale content deployment: candidate is not current content ref HEAD" >&2
    exit 1
  fi
fi

printf 'deployment candidate is current: app=%s ref=%s content=%s\n' \
  "$CI_COMMIT_SHA" "$deploy_ref" "${CONTENT_SHA:-content-source.lock.json}"
