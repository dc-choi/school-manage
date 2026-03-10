# Development: 학생 엑셀 Import — Backend

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.

## 상위 문서

- PRD: `docs/specs/prd/student-excel-import.md`
- 기능 설계: `docs/specs/functional-design/student-management.md` (엑셀 Import 섹션)
- Task: `docs/specs/target/functional/tasks/student-excel-import.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| B1 | tRPC 스키마 정의 | O |
| B2 | BulkCreate UseCase 구현 | O |
| B3 | tRPC 라우터 연결 | O |
| F1~F4 | 프론트엔드 업무 | X (frontend Development) |

## 구현 개요

학생 배열을 받아 일괄 등록하는 `student.bulkCreate` tRPC mutation을 추가한다. 클라이언트에서 엑셀을 파싱/검증하므로, 서버는 검증된 학생 데이터 배열을 받아 트랜잭션으로 일괄 생성한다.

## 레이어별 책임

### Router (Presentation)

- 프로시저: `student.bulkCreate` (mutation)
- 인증: `consentedProcedure` (기존 student 라우터와 동일)
- 입력 검증: Zod 스키마 (`bulkCreateStudentsInputSchema`)

### UseCase (Application)

- 비즈니스 로직: 학생 배열을 트랜잭션 내에서 일괄 생성
- 트랜잭션: `database.$transaction()` — 전체 성공 또는 전체 실패
- 스냅샷: 각 학생별 `createStudentSnapshot()` 호출

## B1: tRPC 스키마 정의

### 파일 위치

`packages/trpc/src/schemas/student.ts`

### 입력 스키마 (bulkCreateStudentsInputSchema)

```
students: array (필수, 최소 1건, 최대 500건)
  ├── societyName: string (필수, 1자 이상)
  ├── catholicName: string (선택)
  ├── gender: enum('M', 'F') (선택)
  ├── age: number (선택)
  ├── contact: number (선택)
  ├── baptizedAt: string (선택, MM/DD regex)
  ├── description: string (선택)
  └── groupId: string (필수)
```

- 개별 학생 스키마는 기존 `createStudentInputSchema`를 재사용
- 배열 wrapper: `z.object({ students: z.array(createStudentInputSchema).min(1).max(500) })`

### 출력 타입 (BulkCreateStudentsOutput)

```
successCount: number   # 성공한 학생 수
totalCount: number     # 전체 요청 수
```

## B2: BulkCreate UseCase 구현

### 파일 위치

`apps/api/src/domains/student/application/bulk-create-students.usecase.ts`

### 비즈니스 로직

```
INPUT: students[] (검증 완료 배열)
CONTEXT: accountId (인증된 계정)

1. database.$transaction() 시작
2. FOR EACH student IN students
   a. student.create (기존 CreateStudent와 동일한 데이터 구조)
      - groupId: BigInt(student.groupId)
      - createdAt: getNowKST()
   b. createStudentSnapshot() 호출 (감사 추적)
3. 트랜잭션 커밋
4. RETURN { successCount, totalCount }
```

### 기존 패턴 참조

- `create-student.usecase.ts`의 데이터 생성 로직 동일 적용
- BigInt 변환: `BigInt(groupId)`
- 타임스탬프: `getNowKST()`
- 스냅샷: `createStudentSnapshot(tx, {...})`

### 트랜잭션 전략

- **전체 트랜잭션**: 1건이라도 DB 에러 시 전체 롤백
- 클라이언트에서 이미 검증된 데이터만 수신하므로 서버 DB 에러는 예외적 상황
- 부분 성공은 클라이언트 검증 단계에서 처리 (에러 행 제외 후 정상 행만 전송)

## B3: tRPC 라우터 연결

### 파일 위치

`apps/api/src/domains/student/presentation/student.router.ts`

### 프로시저 등록

```
bulkCreate: consentedProcedure
  .input(bulkCreateStudentsInputSchema)
  .mutation(async ({ input, ctx }) => {
      const useCase = new BulkCreateStudentsUseCase();
      return useCase.execute(input, ctx.account);
  })
```

- 기존 `create` 프로시저와 동일한 패턴
- `consentedProcedure` 사용 (인증 + 개인정보 동의 필수)

## 검증 규칙 (Validation)

| 필드 | 규칙 | 에러 |
|------|------|------|
| students | 배열, 1~500건 | Zod validation error |
| students[].societyName | 필수, 1자 이상 | Zod validation error |
| students[].groupId | 필수 | Zod validation error |
| students[].gender | 'M' 또는 'F' | Zod validation error |
| students[].baptizedAt | MM/DD 정규식 | Zod validation error |

## 에러 처리

| 에러 상황 | 코드 | 메시지 |
|----------|------|--------|
| 인증 토큰 없음 | UNAUTHORIZED | UNAUTHORIZED |
| 개인정보 동의 미완료 | FORBIDDEN | FORBIDDEN |
| Zod 검증 실패 | BAD_REQUEST | (Zod 에러 메시지) |
| DB 생성 실패 | INTERNAL_SERVER_ERROR | INTERNAL_SERVER_ERROR |

## 테스트 시나리오

> 테스트 파일: `apps/api/test/integration/student.test.ts`
> 프레임워크: Vitest

### 정상 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 학생 3명 일괄 등록 | students: [{societyName, groupId}, ...] x3 | successCount: 3, totalCount: 3 |
| 선택 필드 포함 등록 | students: [{전체 8필드}] | successCount: 1, 모든 필드 저장 확인 |

### 예외 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 빈 배열 | students: [] | Zod validation error |
| 500건 초과 | students: 501건 | Zod validation error |
| 필수값 누락 | societyName 없음 | Zod validation error |
| 인증 없이 요청 | Authorization 없음 | UNAUTHORIZED |

## AI 구현 지침

### 파일 위치
- 스키마: `packages/trpc/src/schemas/student.ts`
- UseCase: `apps/api/src/domains/student/application/bulk-create-students.usecase.ts`
- Router: `apps/api/src/domains/student/presentation/student.router.ts`
- 테스트: `apps/api/test/integration/student.test.ts`

### 참고할 기존 패턴
- 단건 생성: `apps/api/src/domains/student/application/create-student.usecase.ts`
- 스냅샷: `createStudentSnapshot()` 헬퍼
- 벌크 삭제: `bulk-delete-students.usecase.ts` (배열 입력 패턴)
- 졸업 처리: `graduate-students.usecase.ts` (배열 + 트랜잭션 패턴)

### 코드 스타일
- BigInt 변환: `BigInt(input.groupId)`, 출력: `String(student.id)`
- 타임스탬프: `getNowKST()` (UTC 아닌 KST)
- 입력 스키마: 기존 `createStudentInputSchema` 재사용하여 배열 래핑

---

**작성일**: 2026-03-10
**리뷰 상태**: Draft
