# Development: [구현 제목]

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.
> 경로 규칙: 구현된 기능은 `docs/specs/current`, 개선/계획은 `docs/specs/target` (functional/non-functional 분리).

## 상위 문서

> 검수자는 이 문서들을 기준으로 Development가 업무 분할대로 구현되었는지 검증합니다.

- PRD: `docs/specs/prd/[prd-name].md`
- 기능 설계: `docs/specs/functional-design/[design-name].md`
- Task: `docs/specs/{current|target}/{functional|non-functional}/tasks/[task-name].md`

## 구현 대상 업무

> Task 문서의 업무 분할에서 이 Development가 담당하는 업무를 명시합니다.

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| #1 | [업무명1] | O |
| #2 | [업무명2] | O |
| #3 | [업무명3] | X (다른 Development) |

## 구현 개요

[구현할 내용의 핵심 로직 설명 - 1~2문장]

## 레이어별 책임

> 이 프로젝트는 Router → Controller → Service → Repository 패턴을 따릅니다.

### Router
- 엔드포인트: `[METHOD] /api/[domain]/[path]`
- 인증: 필요 / 불필요
- 미들웨어: `parseAuthToken` → `verifyAccount` (인증 필요 시)

### Controller
- 요청 파싱: [파싱할 필드 목록]
- 검증: [검증할 규칙]
- 응답: [응답 구조]

### Service
- 비즈니스 로직: [핵심 로직 설명]
- 트랜잭션: 필요 / 불필요

### Repository
- 쿼리 유형: SELECT / INSERT / UPDATE / DELETE
- JOIN: [조인할 테이블] / 없음

## 데이터 모델

### 요청 (Request)

```
# Query Parameters (GET)
page?: number (기본값: 1)
size?: number (기본값: 10)

# Path Parameters
id: number (필수)

# Request Body (POST/PUT)
{
  field1: string (필수) - 설명
  field2: number (선택) - 설명
}
```

### 응답 (Response)

```
# 성공 시 (Result.ok)
{
  code: 200,
  message: "OK",
  result: {
    account: string,       # 요청자 계정명
    [응답 데이터]
  }
}

# 실패 시 (Result.fail)
{
  code: [ApiCode],
  message: "[에러 메시지]"
}
```

### DTO 변환

```
# DB 엔티티 (snake_case) → DTO (camelCase)
society_name  → societyName
group_id      → groupId
```

## 비즈니스 로직

### 1. [로직 단계 1]

```
IF 조건 A THEN
  동작 1
ELSE IF 조건 B THEN
  동작 2
ELSE
  기본 동작
```

### 2. [로직 단계 2]

```
FOR EACH item IN collection
  처리 로직
```

## 검증 규칙 (Validation)

| 필드 | 규칙 | ApiCode | 에러 메시지 |
|------|------|---------|------------|
| field1 | 필수, 1자 이상 | BAD_REQUEST (400) | "field1은 필수입니다" |
| id | 존재해야 함 | NOT_FOUND (404) | "NOT_FOUND: [ENTITY] NOT_FOUND" |

## 에러 처리

| 에러 상황 | ApiCode | ApiMessage |
|----------|---------|------------|
| 필수 파라미터 누락 | BAD_REQUEST (400) | BAD_REQUEST |
| 인증 토큰 없음 | UNAUTHORIZED (401) | UNAUTHORIZED |
| 권한 없음 | FORBIDDEN (403) | FORBIDDEN |
| 리소스 없음 | NOT_FOUND (404) | NOT_FOUND |
| 중복 데이터 | CONFLICT (409) | CONFLICT |
| 서버 오류 | INTERNAL_SERVER_ERROR (500) | INTERNAL_SERVER_ERROR |

## UI 명세 (프론트엔드)

> 이 섹션은 웹 앱 UI 구현이 포함된 경우 작성합니다.
> 참조: `.claude/rules/web.md` 디자인 가이드

### 페이지/컴포넌트 구조

```
[PageName]Page.tsx
├── Header (제목, 액션 버튼)
├── [ContentSection]
│   ├── [Component1]
│   └── [Component2]
└── Footer (선택)
```

### 사용 컴포넌트

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| [컴포넌트명] | Button / Dialog / ... | [용도 설명] |

### 레이아웃

| 뷰포트 | 레이아웃 | 비고 |
|--------|----------|------|
| 모바일 (< 768px) | 단일 컬럼 | 풀 너비 |
| 태블릿/데스크톱 (≥ 768px) | [N컬럼 / 사이드바] | [비고] |

### 상태별 UI

| 상태 | UI 표시 |
|------|---------|
| 로딩 | Loader2 스피너 중앙 배치 |
| 에러 | 에러 메시지 (text-red-600) |
| 빈 데이터 | 안내 문구 (text-muted-foreground) |
| 성공 | [토스트 / 리다이렉트 / 인라인 메시지] |

### 사용자 인터랙션

| 액션 | 트리거 | 결과 |
|------|--------|------|
| [액션명] | 버튼 클릭 / 폼 제출 | [API 호출 / 상태 변경 / 네비게이션] |

### 접근성 체크리스트

- [ ] 폼 필드에 Label 연결
- [ ] 버튼에 명확한 텍스트 / aria-label
- [ ] 키보드 네비게이션 가능
- [ ] 포커스 표시 유지

## 테스트 시나리오

> 테스트 파일: `test/integration/[domain].test.ts`
> 프레임워크: Vitest

### 정상 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| [시나리오명] | [요청 데이터] | `code: 200`, [응답 데이터] |

### 예외 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 토큰 없이 요청 | Authorization 헤더 없음 | `code: 401` |
| 존재하지 않는 리소스 | id: 99999 | `code: 404` |

## 구현 시 주의사항

- [ ] Controller에서 `try/catch`로 에러 처리 (기존 패턴 따름)
- [ ] Service에서 트랜잭션 필요 시 `Repository.setTransaction()` 사용
- [ ] DTO 변환 시 `prune()` 유틸로 null/undefined 제거
- [ ] Soft delete 사용: `delete_at` 필드 활용

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

### 파일 위치
- Router: `src/api/[domain]/[domain].router.ts`
- Controller: `src/api/[domain]/[domain].controller.ts`
- Service: `src/api/[domain]/[domain].service.ts`
- Repository: `src/api/[domain]/[domain].repository.ts`
- DTO: `src/common/dto/[domain].dto.ts`
- 타입: `src/@types/[domain].d.ts`
- 테스트: `test/integration/[domain].test.ts`

### 참고할 기존 패턴
- CRUD 전체: `src/api/student/`
- 인증 미들웨어: `src/api/auth/auth.middleware.ts`
- 응답 패턴: `src/common/result.ts`
- 에러 코드: `src/common/api.code.ts`

### 코드 스타일
- Fluent Setter: `.setId()`, `.setPage()` 체이닝 사용
- Builder Pattern: `Builder<IType>()...build()` 후 `prune()` 적용
- 로깅: `logger.req()`, `logger.res()` 사용

---

**작성일**: YYYY-MM-DD
**리뷰 상태**: Draft | Peer Review | AI Review | Approved
