---
name: sdd
description: Spec-Driven Development 워크플로우 단계별 실행. /sdd [0-6|status|quick|non-func] [기능명]
---

# /sdd

Spec-Driven Development 워크플로우. 일반(Functional) 플로우는 0→6 순회, 소규모·비기능적 변경은 예외 플로우로 단축.

## 사용법

```
/sdd                       # 현황 확인 (= /sdd status)
/sdd status                # 현재 브랜치/파일 기반 진행 단계 자동 감지
/sdd 0                     # TARGET 선택 → README.md 등록
/sdd 1 <기능명>            # PRD 작성
/sdd 2 <기능명>            # 기능 설계 작성
/sdd 3 <기능명>            # Task (역할별)
/sdd 4 <기능명>            # Development (역할별)
/sdd 5 <기능명>            # 구현 + 테스트
/sdd 6 <기능명>            # 자동 검증 + 문서 정리 + PR
/sdd quick <기능명>        # 소규모: PRD+FD → 5 → 6 (Task/Dev 생략)
/sdd non-func <기능명>     # 비기능적: FD → 5 → 6 (PRD/Task/Dev 생략, FD도 완료 후 삭제)
```

## 표준 Functional 플로우

| 단계 | 입력          | 산출                                                        | 자동 호출                                             |
| ---- | ------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| 0    | README TARGET | 선택 + 상태 등록                                            | `/bs-to-target` (브레인스토밍 기원 시 선행)           |
| 1    | 사업 문서     | `docs/specs/prd/{name}.md`                                  | -                                                     |
| 2    | PRD           | `docs/specs/functional-design/{name}.md`                    | -                                                     |
| 3    | FD            | `docs/specs/target/functional/tasks/{name}.md`              | -                                                     |
| 4    | Task          | `docs/specs/target/functional/development/{name}-{role}.md` | -                                                     |
| 5    | Dev           | 구현 + 테스트                                               | `pnpm typecheck`, `pnpm test`                         |
| 6    | 구현 완료     | PR                                                          | `/pre-pr` → 자동 검증 → 문서 정리 → `/commit` → `/pr` |

### /sdd 0 — 작업 선택

1. `docs/specs/README.md` TARGET 표 파싱 → **미착수** 항목만 추출 (FUNCTIONAL/PERFORMANCE/BUGFIX/DX 각각)
2. `docs/business/6_roadmap/roadmap.md`, `STATUS.md`로 우선순위 배경 확인
3. 번호 매겨 후보 제시 → 사용자 선택
4. 브레인스토밍 기원이면 `/bs-to-target` 선행 안내 (TARGET 미등록인 경우)
5. 선택 즉시 README.md 상태 컬럼을 "진행 중"으로 갱신 (사용자 승인 후)

### /sdd 1-4 — 문서 작성

- 템플릿: `docs/specs/templates/{prd|functional_design|task|development}.md`
- 치환: 사용자에게 기능명/날짜 확인 후 반영 (자동 스캐폴딩은 하지 않음 — 수동 편집 우선)
- 각 단계 말미에 `.claude/rules/specs.md` "문서 유형별 핵심 내용" 자기 검증 체크리스트 확인
- FD가 190줄 초과 예상 시 `rules/specs.md` 분리 규칙(`-flows`, `-api` 접미사) 적용

### /sdd 5 — 구현 + 테스트

- Development 문서를 입력으로 코드 작성
- 구현 순서: **Backend → Frontend → 테스트** (CLAUDE.md Agent Preferences 준수)
- 완료 후 `pnpm typecheck`, `pnpm test` 통과 확인

### /sdd 6 — reviewer 게이트 + 자동 검증 + 문서 정리 + PR

> **순서 주의**: `/pre-pr`을 **가장 먼저** 실행한다. 자동 검증(lint/typecheck/build/test) 출력으로 메인 컨텍스트가 오염되면 reviewer 에이전트 호출 품질이 떨어지기 때문.

1. **reviewer 게이트**: `/pre-pr` 호출 (영역별 병렬 위임은 `rules/code-review.md` 매트릭스 기준)
    - **모든 등급(CRITICAL/HIGH/MEDIUM/LOW)을 사용자에게 전부 보고**한다. MEDIUM/LOW도 삼키지 않는다.
    - CRITICAL 발견 시 PR 차단, 수정 후 재시도
    - HIGH는 사용자 확인 후 진행 여부 결정
    - MEDIUM/LOW는 수정 여부를 사용자가 판단 (에이전트가 자의로 생략/요약 금지)
2. **자동 검증**:
    - `pnpm lint:fix && pnpm prettier:fix`
    - `pnpm typecheck && pnpm build && pnpm test`
    - lint:fix로 파일이 변경됐고 로직 영향이 있으면 필요 시 `/pre-pr` 재호출
3. **문서 정리** (`specs-lifecycle.md` 6단계 규정):
    - `docs/specs/target/functional/tasks/{name}.md` **삭제**
    - `docs/specs/target/functional/development/{name}-*.md` **삭제**
    - `docs/specs/functional-design/{name}.md` → 도메인 메인 문서에 병합 (개선 시) + **축약 규칙** 적용
        - 구현 상세(JSON 전문/의사코드/CSS/Tailwind) 제거
        - 대체된 섹션 통합
        - 중복/중간 와이어프레임 제거
4. **프로젝트 현황 동기화**:
    - `docs/specs/README.md` TARGET 표: **완료된 행 표에서 제거** + 카운트 헤더 "+N건 완료" 갱신 (`rules/specs-lifecycle.md` "TARGET 표 완료 항목 처리")
    - `docs/specs/README.md` 상단 "Current Functional" 설명 반영
    - `README.md`: 구현 현황 반영 (해당 시)
    - `.claude/rules/*.md`: 패턴/정책 변경 시 갱신
5. **PR 생성**: `/commit` → `/pr` 체인
    - **선행 조건 (대기 게이트)**: step 1에서 나온 reviewer 코멘트를 사용자가 **모두 확인·대응 완료**할 때까지 대기한다.
        - 대응 = 코드 수정 / "후속 과제로 기록" 명시적 결정 / "무시" 명시적 결정 중 하나
        - 미대응 항목이 남아있으면 자동 진행 금지. 사용자 입력으로 각 항목에 대한 판단을 받는다.
    - 대응 과정에서 코드를 고쳤다면 `/pre-pr` 재호출 후 다시 대기 게이트
    - 모든 코멘트가 해소된 것이 확인된 뒤에만 `/commit` → `/pr` 체인 실행

## 예외 플로우

### /sdd quick — 소규모 변경

조건 (CLAUDE.md Plan Mode 기준 "불필요" 케이스):

- 단일 파일 소규모 수정
- 기존 패턴을 그대로 따르는 단순 추가
- 명백한 버그 1줄 수정

플로우: **1 → 2 → 5 → 6**

- PRD/FD는 최소 섹션만 (배경/범위/요구사항 필수, 나머지 생략)
- 6단계에서 FD는 도메인 문서에 병합. Task/Dev 경로는 존재하지 않으므로 삭제 step skip

### /sdd non-func — 비기능적 요구사항

조건 (`specs-lifecycle.md` "비기능적 요구사항"):

- 성능, 보안, 인프라, DX, 마이그레이션 등 동작 명세가 코드베이스 자체인 경우

플로우: **2 → 5 → 6**

- PRD/Task/Dev 전부 생략
- FD는 임시 작성 → 6단계에서 **삭제** (코드베이스가 SSoT)
- 6단계에서 `CLAUDE.md`, `rules/api.md` 등 패턴/환경변수 갱신 필수

## /sdd status — 진행 단계 자동 감지

1. 현재 브랜치명 파싱 → 기능명 추정
    - `feature/<name>`, `fix/<name>`, `dc-choi/<name>` 접두 제거
2. 파일 존재 스캔:
    - `docs/specs/prd/{name}.md` → PRD
    - `docs/specs/functional-design/{name}.md` → FD
    - `docs/specs/target/functional/tasks/{name}.md` → Task
    - `docs/specs/target/functional/development/{name}-*.md` → Dev (역할별)
3. 커밋 로그(`git log origin/main..HEAD`)로 구현 여부 힌트
4. 출력 예:
    ```
    기능: account-name-unique
    [ ✓ ] PRD       docs/specs/prd/account-name-unique.md
    [ ✓ ] FD        docs/specs/functional-design/auth-account-extended.md (병합됨)
    [ ✗ ] Task
    [ ✗ ] Development
    [ - ] 구현      커밋 없음
    다음 단계: /sdd 3 account-name-unique
    ```
5. 기능명을 특정 못하면 README TARGET "진행 중" 항목 제시

## 에이전트 위임

`.claude/rules/code-review.md`의 에이전트 위임 매트릭스를 그대로 준수. 중복 기술 금지. 영역별 병렬 호출은 `/pre-pr` 스킬이 전담한다.

## 관련 스킬

- `/bs-to-target`: 브레인스토밍 결과를 TARGET에 등록 (0단계 선행)
- `/pre-pr`: reviewer 6종 병렬 호출 (6단계 게이트)
- `/commit`, `/pr`: 커밋 및 PR 생성 (6단계 체인)

## 참조

- 규칙: `.claude/rules/specs.md` (계층/템플릿/분리), `.claude/rules/specs-lifecycle.md` (검증·정리·예외·비기능)
- 템플릿: `docs/specs/templates/`
