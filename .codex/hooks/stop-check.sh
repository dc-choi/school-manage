#!/usr/bin/env bash
set -euo pipefail

input=$(cat)
session_id=$(jq -r '.session_id // "unknown"' <<<"$input" | tr -cd '[:alnum:]_-')
edited_file=/tmp/school-codex-edited-$session_id.txt

if [[ ! -s "$edited_file" ]]; then
    exit 0
fi

root=$(git rev-parse --show-toplevel)
output_file=$(mktemp)

set +e
EDITED_FILE="$edited_file" bash "$root/.claude/hooks/stop-check.sh" >"$output_file" 2>&1
status=$?
set -e

message=$(<"$output_file")
rm -f "$output_file"

if [[ $status -eq 0 ]]; then
    if [[ -n "$message" ]]; then
        jq -n --arg message "$message" '{systemMessage:$message}'
    fi
    exit 0
fi

if grep -q 'registry.npmjs.org/pnpm: fetch failed' <<<"$message"; then
    rm -f "$edited_file"
    jq -n --arg message "pnpm 레지스트리 접근 실패로 자동 lint/typecheck를 건너뛰었습니다. 코드 실패와 구분해 보고하세요." \
        '{systemMessage:$message}'
    exit 0
fi

reason=$(printf '%s\n' "$message" | tail -n 40)
jq -n --arg reason "자동 lint/typecheck가 실패했습니다. 원인을 수정하고 다시 검증하세요.\n$reason" \
    '{decision:"block",reason:$reason}'
