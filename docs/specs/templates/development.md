# Development: [구현 제목]

> 상태: Draft | 작성일: YYYY-MM-DD

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.
> 아키텍처/패턴/에러 코드는 `rules/api.md`, `rules/web.md` 참조. 중복 기술하지 않는다.

## 상위 문서

- PRD: `docs/specs/prd/[prd-name].md`
- 기능 설계: `docs/specs/functional-design/[design-name].md`
- Task: `docs/specs/target/{functional|non-functional}/tasks/[task-name].md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| #1 | [업무명1] | O |
| #2 | [업무명2] | X (다른 Development) |

## 구현 개요

[구현할 내용의 핵심 로직 설명 - 1~2문장]

## 구현 구조 (백엔드)

> 백엔드 구현이 포함된 경우 작성. 아키텍처: `rules/api.md` 참조.

- **프로시저**: `scopedProcedure` / `protectedProcedure` / `publicProcedure`
- **UseCase**: `{DomainName}UseCase` — [핵심 로직 1줄 설명]

## 데이터 모델

### 입력

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| field1 | string | O | 설명 |
| field2 | number | X | 설명 |

### 출력

| 필드 | 타입 | 설명 |
|------|------|------|
| field1 | string | 설명 |

## 비즈니스 로직

### 1. [로직 단계 1]

```
IF 조건 A THEN
  동작 1
ELSE
  기본 동작
```

## 검증 규칙 (Validation)

| 필드 | 규칙 | ApiCode | 에러 메시지 |
|------|------|---------|------------|
| field1 | 필수, 1자 이상 | BAD_REQUEST (400) | "field1은 필수입니다" |
| id | 존재해야 함 | NOT_FOUND (404) | "NOT_FOUND: [ENTITY] NOT_FOUND" |

## UI 명세 (프론트엔드)

> 프론트엔드 구현이 포함된 경우 작성. UI 패턴: `rules/web.md`, `rules/design.md` 참조.

### 페이지/컴포넌트 구조

```
[PageName]Page.tsx
├── [Component1]
└── [Component2]
```

### 사용자 인터랙션

| 액션 | 트리거 | 결과 |
|------|--------|------|
| [액션명] | 버튼 클릭 / 폼 제출 | [API 호출 / 상태 변경 / 네비게이션] |

## 테스트 시나리오

### 정상 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| [시나리오명] | [요청 데이터] | `code: 200`, [응답 데이터] |

### 예외 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 토큰 없이 요청 | Authorization 헤더 없음 | `code: 401` |

## 주의사항

- [도메인 특화 주의사항만 기술. 공통 패턴은 rules 파일 참조]
