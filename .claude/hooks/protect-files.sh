#!/usr/bin/env bash
set -euo pipefail

FILE=$(jq -r '.tool_input.file_path // empty')

if [[ -z "$FILE" ]]; then
    exit 0
fi

# .env 차단 (.env.example, .env.test.example 등은 허용)
if [[ "$FILE" =~ /\.env(\.[^/]+)?$ ]] && [[ ! "$FILE" =~ \.example$ ]]; then
    echo "BLOCKED: .env 파일은 직접 수정 금지. .env.example 수정 후 사용자가 동기화하세요." >&2
    exit 2
fi

# lock 파일 차단
if [[ "$FILE" =~ /(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$ ]]; then
    echo "BLOCKED: lock 파일은 pnpm install 로만 업데이트하세요." >&2
    exit 2
fi

# 기존 prisma migration 수정 차단 (새 생성은 prisma-migrate 스킬 사용)
if [[ "$FILE" =~ /prisma/migrations/[0-9]+[^/]*/migration\.sql$ ]]; then
    echo "BLOCKED: 기존 migration SQL 수정 금지. 스키마 변경은 /prisma-migrate 스킬 사용." >&2
    exit 2
fi

exit 0
