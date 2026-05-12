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

| 영역            | 파일 패턴                                                               | 호출 에이전트           |
| --------------- | ----------------------------------------------------------------------- | ----------------------- |
| 보안 민감       | `apps/api/src/domains/auth/**`, `**/middleware/**`, 입력 검증/권한 변경 | `security-reviewer`     |
| DB/Prisma       | `apps/api/prisma/**`, UseCase 중 `database.*` 변경, 트랜잭션            | `database-reviewer`     |
| TypeScript 전반 | `.ts`/`.tsx` 변경 (위 2개 제외)                                         | `typescript-reviewer`   |
| 에러 처리       | `try/catch`, `.catch()`, throw 변경                                     | `silent-failure-hunter` |
| UI/UX           | `apps/web/src/**/*.tsx`, 디자인 시스템                                  | `design-reviewer`       |
| 성능            | 번들/렌더/쿼리 영향 예상                                                | `performance-analyzer`  |

- 한 파일이 여러 영역에 걸치면 **모든 관련 reviewer 호출**
- 변경 파일이 한 영역 패턴에도 매칭 안 되면 그 에이전트는 **호출 자체를 생략**한다. "혹시 모르니까" 부르지 마라 — false positive의 1차 원인
- 병렬 호출 — Agent tool 다중 호출 한 메시지에

### 3. Reviewer 호출 프롬프트 템플릿

각 에이전트에 컨텍스트 + **할루시네이션 가드**를 같이 전달한다. 가드 없는 호출은 reviewer가 체크리스트를 *발견 템플릿*으로 오해해서 diff에 없는 문제를 만들어낸다 (= 사용자 토큰 낭비).

전달 내용:

- 변경 파일 목록 (영역 필터링 후)
- `git diff origin/main...HEAD -- <파일>` 결과 — **diff 본문 자체**를 프롬프트에 포함
- 리뷰 범위 (해당 에이전트 담당)
- 출력 형식: 심각도 + 위치(`파일:줄`) + **근거(diff 인용 1~3줄)** + 제안

**필수 가드 — 프롬프트 본문에 그대로 박아 넣는다**:

1. **근거는 diff에서 인용해라.** 변경되지 않은 줄을 끌어와 문제 삼지 마라. 인용 못 붙이면 보고 X.
2. **`file:line`은 실제 diff에 존재하는 줄이어야 한다.** 추측한 줄 번호 금지. 위치 확인 못 하면 폐기.
3. **에이전트 정의의 "리뷰 우선순위" 목록은 검색 후보일 뿐, 발견 보고용 템플릿이 아니다.** 실제 diff에 매칭되는 것만 보고.
4. **확신 없으면 침묵해라.** "혹시", "가능성 있음", "검토 권장" 수준이면 보고하지 마라. 단정할 수 있는 것만.
5. **찾을 게 없으면 "발견 없음"으로 응답해라.** 억지로 채우지 마라. **false positive는 false negative보다 비싸다.**
6. **MEDIUM/LOW에 추측을 끼워 넣지 마라.** 등급을 낮춰서 검증을 우회하는 행위 금지. 등급은 _영향_ 기준이지 _확신도_ 기준이 아니다.

### 4. 결과 집계

심각도 4단계 (`rules/code-review.md` 매트릭스). **모든 등급을 사용자에게 전부 보고**한다. 삼키거나 로그로만 남기지 않는다.

**다만 보고 전 자동 폐기**:

- §3 가드 §1 위반 — 근거(diff 인용) 누락 발견은 사용자 노출 전에 폐기
- §3 가드 §2 위반 — `file:line`이 실제 diff에 없으면 폐기
- §3 가드 §4 위반 — "혹시", "가능성", "검토 필요" 같은 약한 표현으로만 서술된 발견은 폐기

가드 위반으로 폐기된 건수는 카운트 헤더에 `(폐기 N건)` 형태로만 표시. 상세 노출 X — 그래야 reviewer가 다음 호출에서 가드를 더 빡세게 따른다.

| 등급     | 액션                                                       | 사용자 보고                   |
| -------- | ---------------------------------------------------------- | ----------------------------- |
| CRITICAL | **BLOCK** — PR 생성 중단. 수정 후 재시도                   | 전체 상세 (파일·줄·근거·제안) |
| HIGH     | **WARN** — 사용자 확인 후 진행 (`/pr` 호출 시 본문에 명시) | 전체 상세                     |
| MEDIUM   | **INFO** — 후속 과제 후보                                  | 전체 상세 (요약 금지)         |
| LOW      | **NOTE** — 참고                                            | 전체 상세 (요약 금지)         |

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
