#!/usr/bin/env bash
set -euo pipefail

input=$(cat)
tool=$(jq -r '.tool_name // empty' <<<"$input")
command=$(jq -r '.tool_input.command // empty' <<<"$input")
cwd=$(jq -r '.cwd // empty' <<<"$input")
root=$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null || pwd)

if [[ "$tool" == "Bash" ]]; then
    if grep -q -- '--no-verify' <<<"$command"; then
        echo "[BLOCK] --no-verify 금지: 훅을 우회하지 말고 실패 원인을 해결하세요." >&2
        exit 2
    fi
    exit 0
fi

if [[ "$tool" != "apply_patch" ]]; then
    exit 0
fi

while IFS=$'\t' read -r action file; do
    [[ -z "$file" ]] && continue

    if [[ "$file" = /* ]]; then
        absolute=$file
    else
        absolute=$root/$file
    fi

    if ! jq -n --arg file "$absolute" '{tool_input:{file_path:$file}}' |
        bash "$root/.claude/hooks/protect-files.sh"; then
        exit 2
    fi

    if [[ "$action" != "Add" && "$absolute" =~ /apps/api/prisma/migrations/.+\.sql$ ]]; then
        echo "[BLOCK] 기존 migration SQL 수정 금지. prisma-migrate 스킬을 사용하세요." >&2
        exit 2
    fi
done < <(sed -nE 's/^\*\*\* (Add|Update|Delete) File: (.*)$/\1\t\2/p' <<<"$command")
