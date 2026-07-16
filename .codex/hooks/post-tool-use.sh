#!/usr/bin/env bash
set -euo pipefail

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")
command=$(jq -r '.tool_input.command // empty' <<<"$input")
session_id=$(jq -r '.session_id // "unknown"' <<<"$input" | tr -cd '[:alnum:]_-')
edited_file=/tmp/school-codex-edited-$session_id.txt

if [[ "$tool" != "apply_patch" ]]; then
    exit 0
fi

sed -nE 's/^\*\*\* (Add|Update|Delete) File: (.*)$/\2/p' <<<"$command" \
    >> "$edited_file"
