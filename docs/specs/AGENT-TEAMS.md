# Agent Teams 워크플로우 가이드

이 문서는 SDD 워크플로우에서 **Agent Teams**를 활용하는 하이브리드 워크플로우를 정의합니다.

> **실험적 기능**: Agent Teams는 Claude Code의 실험적 기능입니다. 기존 워크플로우(`WORKFLOW.md`)를 대체하지 않으며, 특정 구간에서 **선택적으로** 사용합니다.

## 기존 워크플로우와의 관계

```
Phase 1: 문서 작성 (0~4단계)  →  기존 방식 유지 (순차적, 단일 세션)
Phase 2: 구현 (5단계)         →  Agent Teams 활용 가능 (병렬 구현)
Phase 3: 리뷰 (6단계)         →  Agent Teams 활용 가능 (교차 리뷰)
Phase 4: 마무리 (7단계)       →  기존 방식 유지 (단일 세션)
```

**왜 Phase 1은 기존 방식을 유지하는가?**
- PRD → 기능 설계 → Task → Development는 **순차적 의존성**이 있음
- 문서 간 정합성 유지가 중요하여 단일 컨텍스트에서 처리하는 것이 효과적
- 병렬화할 수 있는 독립적 업무가 없음

---

## 사전 설정

### 환경변수

`.claude/settings.json`의 `env` 섹션에 추가:

```json
{
    "env": {
        "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
    }
}
```

### 디스플레이 모드

| 모드           | 설명                               | 요구사항              |
|--------------|----------------------------------|--------------------|
| `in-process` | 메인 터미널에서 모든 teammate 실행          | 없음                 |
| `tmux`       | 각 teammate가 별도 pane에서 실행         | tmux 또는 iTerm2     |
| `auto`       | tmux 세션이면 split pane, 아니면 in-process | 기본값               |

**teammate 선택**: `Shift+Up/Down`으로 teammate 간 전환
**태스크 목록 확인**: `Ctrl+T`로 토글

### 권한

모든 teammate는 리드의 권한 모드를 상속합니다. `.claude/settings.json`의 `permissions` 설정이 그대로 적용됩니다.

---

## Phase 2: 구현 팀 (5단계)

### 적용 조건

다음 조건을 **모두** 충족할 때 Agent Teams 사용을 권장합니다:

- Task 문서에 백엔드/프론트엔드 업무가 **모두** 존재
- 백엔드와 프론트엔드 간 **파일 충돌이 없음** (`apps/api/` vs `apps/web/`)
- Development 문서(역할별)가 **승인 완료** 상태

### 팀 구성

```
[리드 (조율자)]
   ├── Teammate A: 백엔드 개발자
   └── Teammate B: 프론트엔드 개발자
```

| 역할          | 담당 영역                          | 참조 규칙                 |
|-------------|--------------------------------|-----------------------|
| 리드          | 태스크 배분, 진행 모니터링, 결과 종합         | -                     |
| 백엔드 개발자     | `apps/api/`, `packages/trpc/`  | `rules/api.md`        |
| 프론트엔드 개발자   | `apps/web/`                    | `rules/web.md`, `rules/design.md` |

### 태스크 의존성

Task 문서의 의존성을 반영하여 태스크를 할당합니다:

```
B1 (API 엔드포인트) ─────────────── Teammate A
B2 (DB 스키마)     ─────────────── Teammate A
F1 (페이지 컴포넌트) ── B1 완료 후 ──→ Teammate B
F2 (API 연동)      ── B1 완료 후 ──→ Teammate B
```

> **파일 충돌 방지**: 각 teammate가 소유하는 파일 영역을 명확히 분리합니다. 두 teammate가 같은 파일을 편집하면 덮어쓰기가 발생합니다.

### 프롬프트 예시

```
Development 문서가 모두 승인되었습니다. 구현 팀을 구성해주세요.

- Teammate A (백엔드): {name}-backend.md 기준으로 구현
  - 대상 파일: apps/api/, packages/trpc/
  - 참조: .claude/rules/api.md
  - 태스크: B1, B2, ...

- Teammate B (프론트엔드): {name}-frontend.md 기준으로 구현
  - 대상 파일: apps/web/
  - 참조: .claude/rules/web.md, .claude/rules/design.md
  - 태스크: F1 (B1 완료 후), F2 (B1 완료 후), ...

delegate mode로 운영하고, 각 teammate는 plan approval을 받은 후 구현을 시작해주세요.
빌드 성공 여부를 확인한 후 태스크를 완료 처리해주세요.
```

---

## Phase 3: 리뷰 팀 (6단계)

### 적용 조건

- 구현이 완료되어 리뷰 대상 코드가 존재
- 백엔드/프론트엔드 **양쪽 모두** 변경이 있어 교차 리뷰가 필요

### 팀 구성

```
[리드 (조율자)]
   ├── Teammate A: 백엔드 검수자
   └── Teammate B: 프론트엔드 검수자
```

| 역할          | 검수 대상                          | 검수 기준               |
|-------------|--------------------------------|---------------------|
| 리드          | 검수 결과 종합, 최종 판정                | -                   |
| 백엔드 검수자     | `apps/api/`, `packages/trpc/`  | `rules/api.md`      |
| 프론트엔드 검수자   | `apps/web/`                    | `rules/web.md`, `rules/design.md` |

### 교차 검토 방식

각 검수자는 **읽기 전용**으로 코드를 검토하고, 리드에게 결과를 보고합니다:

1. 각 검수자가 담당 영역의 코드를 독립적으로 검토
2. 검수 결과를 리드에게 메시지로 전달
3. 리드가 결과를 종합하여 승인/수정 요청 판정

### 프롬프트 예시

```
구현이 완료되었습니다. 리뷰 팀을 구성해주세요.

- Teammate A (백엔드 검수자): apps/api/, packages/trpc/ 코드 검토
  - 검수 기준: .claude/rules/api.md
  - 체크리스트: UseCase 패턴, 에러 처리, DB 정책

- Teammate B (프론트엔드 검수자): apps/web/ 코드 검토
  - 검수 기준: .claude/rules/web.md, .claude/rules/design.md
  - 체크리스트: 컴포넌트 구조, 디자인 일관성, 접근성

delegate mode로 운영해주세요.
각 검수자는 수정하지 말고 검수 결과만 보고해주세요.
모든 검수가 완료되면 종합 결과를 화면에 출력해주세요.
```

---

## 팀 운영 규칙

### Delegate Mode

리드는 **delegate mode**(`Shift+Tab`)로 운영합니다:

- 리드는 직접 코드를 수정하지 않음
- teammate 생성, 메시지, 태스크 관리만 수행
- 리드가 구현 작업을 중복하지 않도록 방지

### Plan Approval

복잡한 구현에서는 **plan approval**을 활성화합니다:

- teammate가 구현 전 계획을 먼저 제출
- 리드가 계획을 검토하여 승인/반려
- Development 문서와의 정합성을 보장

### 파일 충돌 방지

| 규칙 | 설명 |
|-----|------|
| 영역 분리 | 각 teammate는 지정된 디렉토리만 수정 |
| 공유 패키지 주의 | `packages/trpc/`, `packages/utils/`는 한 teammate만 수정 |
| 동시 편집 금지 | 같은 파일을 두 teammate가 편집하면 덮어쓰기 발생 |

### 팀 정리

작업 완료 후 반드시 팀을 정리합니다:

1. 각 teammate에게 종료 요청
2. 모든 teammate 종료 확인 후 팀 리소스 정리
3. 리드가 최종 결과를 사용자에게 보고

---

## 제약사항 및 주의사항

| 항목 | 설명 |
|------|------|
| **실험적 기능** | 변경 및 버그 가능성 있음 |
| **세션 복구 불가** | `/resume`, `/rewind` 시 기존 teammate가 복구되지 않음. 새로 생성 필요 |
| **중첩 팀 불가** | teammate가 자체 팀을 생성할 수 없음 |
| **1세션 1팀** | 리드당 하나의 팀만 관리 가능 |
| **토큰 사용량 증가** | teammate 수에 비례하여 토큰 사용량 증가 |
| **태스크 상태 지연** | teammate가 태스크 완료 표시를 누락할 수 있음. 리드가 확인 필요 |
| **VS Code 터미널 미지원** | split pane 모드는 VS Code 통합 터미널에서 작동하지 않음 |

### Agent Teams vs 기존 방식 판단 기준

| 상황 | 권장 방식 |
|------|---------|
| 백엔드 + 프론트엔드 동시 구현 | Agent Teams |
| 백엔드만 또는 프론트엔드만 변경 | 기존 방식 (단일 세션) |
| 소규모 변경 (파일 3개 이하) | 기존 방식 |
| 교차 리뷰 필요 | Agent Teams |
| 순차적 문서 작성 | 기존 방식 |

---

## 관련 문서

| 문서 | 설명 |
|------|------|
| `docs/specs/WORKFLOW.md` | SDD 기본 워크플로우 (작성자 + 검수자) |
| `.claude/rules/specs.md` | SDD 가이드 + 역할 분리 |
| `.claude/settings.json` | Agent Teams 환경변수 설정 |
