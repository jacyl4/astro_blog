#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 <upload|download> <package-name> <version> <archive-path>" >&2
  exit 2
}

[[ $# -eq 4 ]] || usage

action="$1"
package_name="$2"
version="$3"
archive_path="$4"

: "${CI_API_V4_URL:?CI_API_V4_URL is required}"
: "${CI_PROJECT_ID:?CI_PROJECT_ID is required}"
: "${CI_JOB_TOKEN:?CI_JOB_TOKEN is required}"

archive_dir="$(dirname "$archive_path")"
archive_name="$(basename "$archive_path")"
checksum_path="${archive_path}.sha256"
package_url="${CI_API_V4_URL}/projects/${CI_PROJECT_ID}/packages/generic/${package_name}/${version}"

upload_file() {
  local path="$1"
  local name="$2"
  curl \
    --fail \
    --location \
    --retry 3 \
    --retry-all-errors \
    --silent \
    --show-error \
    --header "JOB-TOKEN: ${CI_JOB_TOKEN}" \
    --upload-file "$path" \
    "${package_url}/${name}"
}

download_file() {
  local name="$1"
  local path="$2"
  curl \
    --fail \
    --location \
    --retry 3 \
    --retry-all-errors \
    --silent \
    --show-error \
    --user "gitlab-ci-token:${CI_JOB_TOKEN}" \
    --output "$path" \
    "${package_url}/${name}"
}

case "$action" in
  upload)
    [[ -f "$archive_path" ]] || {
      echo "archive not found: $archive_path" >&2
      exit 1
    }
    (
      cd "$archive_dir"
      sha256sum "$archive_name" > "${archive_name}.sha256"
    )

    remote_checksum_path="${checksum_path}.remote"
    if download_file "${archive_name}.sha256" "$remote_checksum_path"; then
      if ! cmp --silent "$checksum_path" "$remote_checksum_path"; then
        echo "immutable package checksum conflict: ${package_name}/${version}/${archive_name}" >&2
        exit 1
      fi
    else
      upload_file "$checksum_path" "${archive_name}.sha256"
    fi

    if ! curl \
      --fail \
      --head \
      --location \
      --retry 3 \
      --retry-all-errors \
      --silent \
      --show-error \
      --user "gitlab-ci-token:${CI_JOB_TOKEN}" \
      "${package_url}/${archive_name}" >/dev/null; then
      upload_file "$archive_path" "$archive_name"
    fi
    echo "uploaded immutable package: ${package_name}/${version}/${archive_name}"
    ;;
  download)
    mkdir -p "$archive_dir"
    download_file "$archive_name" "$archive_path"
    download_file "${archive_name}.sha256" "$checksum_path"
    (
      cd "$archive_dir"
      sha256sum --check "${archive_name}.sha256"
    )
    echo "downloaded verified package: ${package_name}/${version}/${archive_name}"
    ;;
  *)
    usage
    ;;
esac
