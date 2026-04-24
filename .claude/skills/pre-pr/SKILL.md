---
name: pre-pr
description: PR 생성 전 변경 파일 영역을 분석해 관련 reviewer 에이전트를 병렬 호출하고 심각도별 결과를 집계한다. /pre-pr 로 호출.
---

# /pre-pr

PR 생성 전 품질 게이트. `.claude/rules/code-review.md`의 에이전트 위임 매트릭스를 기반으로 변경 영역별 reviewer를 병렬 호출한다.

## 실행 단계

### 1. 변경 파일 수집

```bash
git diff --name-status origin/main...HEAD
git log --oneline origin/main..HEAD
```

- 변경 없으면 즉시 종료
- `docs/`, `.claude/` 외 코드 변경이 0이면 **코드 reviewer 호출 생략** (알림만 출력)

### 2. 파일 영역 매핑

| 영역 | 파일 패턴 | 호출 에이전트 |
|------|-----------|---------------|
| 보안 민감 | `apps/api/src/domains/auth/**`, `**/middleware/**`, 입력 검증/권한 변경 | `security-reviewer` |
| DB/Prisma | `apps/api/prisma/**`, UseCase 중 `database.*` 변경, 트랜잭션 | `database-reviewer` |
| TypeScript 전반 | `.ts`/`.tsx` 변경 (위 2개 제외) | `typescript-reviewer` |
| 에러 처리 | `try/catch`, `.catch()`, throw 변경 | `silent-failure-hunter` |
| UI/UX | `apps/web/src/**/*.tsx`, 디자인 시스템 | `design-reviewer` |
| 성능 | 번들/렌더/쿼리 영향 예상 | `performance-analyzer` |

- 한 파일이 여러 영역에 걸치면 **모든 관련 reviewer 호출**
- 병렬 호출 — Agent tool 다중 호출 한 메시지에

### 3. Reviewer 호출 프롬프트 템플릿

각 에이전트에 동일 컨텍스트 전달:
- 변경 파일 목록 (영역 필터링 후)
- `git diff origin/main...HEAD -- <파일>` 결과
- 리뷰 범위 (해당 에이전트 담당)
- 출력 형식 요구: 심각도 + 위치(파일:줄) + 근거 + 제안

### 4. 결과 집계

심각도 4단계 (`rules/code-review.md` 매트릭스). **모든 등급을 사용자에게 전부 보고**한다. 삼키거나 로그로만 남기지 않는다.

| 등급 | 액션 | 사용자 보고 |
|------|------|-------------|
| CRITICAL | **BLOCK** — PR 생성 중단. 수정 후 재시도 | 전체 상세 (파일·줄·근거·제안) |
| HIGH | **WARN** — 사용자 확인 후 진행 (`/pr` 호출 시 본문에 명시) | 전체 상세 |
| MEDIUM | **INFO** — 후속 과제 후보 | 전체 상세 (요약 금지) |
| LOW | **NOTE** — 참고 | 전체 상세 (요약 금지) |

### 5. 요약 출력

사용자에게 **카운트 + 전체 상세 목록** 둘 다 출력한다.

1. 카운트 헤더
```
[pre-pr] 변경 파일 N개, 호출 에이전트 M개
  - security-reviewer: CRITICAL 0, HIGH 1, MEDIUM 0, LOW 2
  - typescript-reviewer: CRITICAL 0, HIGH 0, MEDIUM 3, LOW 1
  ...
```

2. 심각도별 상세 목록 (등급별로 섹션 분리, 모두 노출)
```
## CRITICAL
- [security-reviewer] apps/api/src/.../auth.ts:42 — <근거> → <제안>

## HIGH
- [typescript-reviewer] ...

## MEDIUM
- [database-reviewer] ...

## LOW
- [design-reviewer] ...
```

3. 마무리
```
차단 요인: 없음 (또는 CRITICAL 목록)
다음 단계: /pr 호출 가능 (또는 수정 필요)
```

> MEDIUM/LOW도 "후속 과제"로 퉁치지 말고 각 항목을 그대로 사용자에게 노출한다. 사용자가 직접 읽고 후속 처리 여부를 판단한다.

## 사용 예시

```
/pre-pr
```

출력 이후 사용자 판단:
- CRITICAL 0, HIGH 0 → `/pr` 호출 진행 (MEDIUM/LOW 확인은 사용자 몫)
- HIGH 존재 → 개선 또는 HIGH 명시 후 `/pr`
- CRITICAL 존재 → 수정 필수, `/pr` 차단

## 주의사항

- **테스트 변경**이 포함된 경우 `test-runner` 스타일 별도 에이전트 호출 제외 (자동 검증은 Stop 훅/CI로 커버)
- reviewer가 이미 자동 검증 루프 안에 있으면 중복 호출 금지
- 호출 시간이 긴 편(각 수십 초~분) — 백그라운드 허용 안 함 (결과 집계 필요)
- `pnpm typecheck` / `pnpm lint` 는 Stop 훅에서 이미 검증됨 (reviewer는 상호보완)

## 참조

- 에이전트 위임 매트릭스: `.claude/rules/code-review.md`
- 에이전트 목록: `.claude/CLAUDE.md` 에이전트 카탈로그
