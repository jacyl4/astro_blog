#!/usr/bin/env bash
set -euo pipefail

: "${CI_JOB_TOKEN:?CI_JOB_TOKEN is required}"
: "${CI_REPOSITORY_URL:?CI_REPOSITORY_URL is required}"
: "${CI_SERVER_FQDN:?CI_SERVER_FQDN is required}"
: "${CI_DEFAULT_BRANCH:?CI_DEFAULT_BRANCH is required}"
: "${CI_COMMIT_REF_NAME:?CI_COMMIT_REF_NAME is required}"
: "${CI_COMMIT_SHA:?CI_COMMIT_SHA is required}"

branch_sha() {
  local repository_url="$1"
  local branch="$2"
  local sha
  sha="$(
    git ls-remote --exit-code "$repository_url" "refs/heads/${branch}" \
      | awk 'NR == 1 { print $1 }'
  )"
  if [[ ! "$sha" =~ ^[0-9a-f]{40}$ ]]; then
    echo "Unable to resolve exact branch HEAD: ${branch}" >&2
    exit 1
  fi
  printf '%s' "$sha"
}

deploy_ref="${DEPLOY_REF:-$CI_DEFAULT_BRANCH}"
latest_app_sha="$(branch_sha "$CI_REPOSITORY_URL" "$deploy_ref")"
if [[ "$latest_app_sha" != "$CI_COMMIT_SHA" ]]; then
  echo "Refusing stale app deployment: candidate is not current ${deploy_ref} HEAD" >&2
  exit 1
fi

if [[ -n "${CONTENT_SHA:-}" ]]; then
  : "${CONTENT_PROJECT_PATH:?CONTENT_PROJECT_PATH is required with CONTENT_SHA}"
  content_ref="${CONTENT_REF:-main}"
  content_repository_url="${CI_SERVER_PROTOCOL:-https}://gitlab-ci-token:${CI_JOB_TOKEN}@${CI_SERVER_FQDN}/${CONTENT_PROJECT_PATH}.git"
  latest_content_sha="$(branch_sha "$content_repository_url" "$content_ref")"
  if [[ "$latest_content_sha" != "$CONTENT_SHA" ]]; then
    echo "Refusing stale content deployment: candidate is not current content ref HEAD" >&2
    exit 1
  fi
fi

printf 'deployment candidate is current: app=%s ref=%s content=%s\n' \
  "$CI_COMMIT_SHA" "$deploy_ref" "${CONTENT_SHA:-content-source.lock.json}"
