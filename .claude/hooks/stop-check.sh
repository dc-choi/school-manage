#!/bin/bash
# Stop 훅: 편집된 파일 lint/typecheck + 편집량 기반 /pre-pr 알림
# 원본 인라인 커맨드를 별도 스크립트로 분리 (settings.json 가독성 + 편집량 알림 추가)

set -eu

EDITED_FILE=/tmp/school-edited.txt
REVIEW_THRESHOLD=5

if [ ! -s "$EDITED_FILE" ]; then
    exit 0
fi

# 고유 파일 수 (빈 줄 제외)
count=$(sort -u "$EDITED_FILE" | grep -cv '^$' || true)

pnpm lint:fix && pnpm typecheck

if [ "${count:-0}" -ge "$REVIEW_THRESHOLD" ]; then
    echo "[hint] 편집 파일 ${count}개 (≥${REVIEW_THRESHOLD}). PR 생성 전 /pre-pr 로 reviewer 병렬 실행 권장." >&2
fi

rm -f "$EDITED_FILE"
exit 0
