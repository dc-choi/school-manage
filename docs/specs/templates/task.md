# Task: [작업명]

> 상태: Draft | 작성일: YYYY-MM-DD

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.
> 기능 설계의 요구사항을 **역할별 구현 가능한 단위로 분할**합니다.

## 상위 문서

- PRD: `docs/specs/prd/{name}.md`
- 기능 설계: `docs/specs/functional-design/{name}.md`

## 목표

[이 Task가 완료되면 무엇이 달성되는가?]

## 범위

### 포함
- [x] 범위 내 항목 1
- [x] 범위 내 항목 2

### 제외
- [ ] 범위 외 항목

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | [업무명] | [구현할 내용] | 없음 |
| B2 | [업무명] | [구현할 내용] | B1 완료 후 |

**Development**: `docs/specs/target/.../development/{name}-backend.md`

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | [업무명] | [구현할 내용] | B1 완료 후 |
| F2 | [업무명] | [구현할 내용] | F1 완료 후 |

**Development**: `docs/specs/target/.../development/{name}-frontend.md`

---

## 업무 의존성 다이어그램

```
[B1] ──┬──▶ [B2] ──▶ [F1] ──▶ [F2]
```

---

## 검증 체크리스트

- [ ] 모든 역할의 업무가 완료되었는가?
- [ ] 역할 간 의존성이 충족되었는가?
- [ ] 기존 기능에 영향이 없는가?
