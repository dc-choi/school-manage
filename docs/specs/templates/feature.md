# Feature: [기능명]

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.
> 경로 규칙: 구현된 기능은 `docs/specs/current`, 개선/계획은 `docs/specs/target` (functional/non-functional 분리).

## 상위 문서

> 검수자는 이 문서들을 기준으로 Feature가 PRD/기능 설계와 일치하는지 검증합니다.

- PRD: `docs/specs/prd/[prd-name].md`
- 기능 설계: `docs/specs/functional-design/[design-name].md`

## 개요

[기능에 대한 1-2문장 설명]

## 배경

- 왜 이 기능이 필요한가?
- 어떤 문제를 해결하는가?
- PRD/기능 설계에서 정의된 목표와의 연관성

## 사용자 스토리

### US-1: [스토리 제목]
- **사용자**: [역할]
- **원하는 것**: [행동]
- **이유**: [가치]

### US-2: [스토리 제목]
- **사용자**: [역할]
- **원하는 것**: [행동]
- **이유**: [가치]

## 기능 요구사항

### 필수 (Must Have)
- [ ] 요구사항 1
- [ ] 요구사항 2

### 선택 (Nice to Have)
- [ ] 요구사항 3

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| [상황1] | [동작1] |
| [상황2] | [동작2] |

## 인수 조건 (Acceptance Criteria)

- [ ] [검증 가능한 조건 1]
- [ ] [검증 가능한 조건 2]
- [ ] [검증 가능한 조건 3]

## 관련 문서

- Task: `docs/specs/{target|current}/{functional|non-functional}/tasks/[task-name].md`
- Development: `docs/specs/{target|current}/{functional|non-functional}/development/[impl-name].md`

---

**작성일**: YYYY-MM-DD
**최종 수정**: YYYY-MM-DD
**상태**: Draft | Review | Approved
