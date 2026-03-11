# Development: 학생 등록 관리 - 백엔드

> Task에서 분할된 **백엔드 업무를 수행하기 위한 세부 구현 내용**입니다.

## 상위 문서

- PRD: `docs/specs/prd/student-registration.md`
- 기능 설계: `docs/specs/functional-design/student-management.md` (학생 등록 관리 섹션)
- Task: `docs/specs/target/functional/tasks/student-registration.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| B1 | Registration 모델 정의 | O |
| B2 | tRPC 스키마 정의 | O |
| B3 | 일괄 등록 UseCase | O |
| B4 | 일괄 등록 취소 UseCase | O |
| B5 | student.list 등록 필터 + 현황 요약 | O |
| B6 | bulkCreate 등록 연동 | O |
| B7 | 라우터 등록 | O |

## 구현 개요

Registration 테이블을 추가하여 학생의 연도별 등록 이력을 관리한다. student.list에 등록 필터와 현황 요약을 추가하고, 일괄 등록/취소 API와 엑셀 Import 등록 연동을 구현한다.

---

## B1: Registration 모델 정의

### Prisma 스키마

```prisma
model Registration {
    id           BigInt    @id @default(autoincrement()) @map("_id")
    studentId    BigInt    @map("student_id")
    year         Int
    registeredAt DateTime  @map("registered_at")
    createdAt    DateTime  @map("create_at")
    updatedAt    DateTime  @map("update_at")
    deletedAt    DateTime? @map("delete_at")

    student Student @relation(fields: [studentId], references: [id])

    @@unique([studentId, year])
    @@map("registration")
}
```

- Student 모델에 역관계 추가: `registrations Registration[]`
- `studentId + year` 유니크 제약으로 연도당 1건만 허용

### 마이그레이션 SQL

```sql
CREATE TABLE `registration` (
    `_id` BIGINT NOT NULL AUTO_INCREMENT,
    `student_id` BIGINT NOT NULL,
    `year` INT NOT NULL,
    `registered_at` DATETIME(3) NOT NULL,
    `create_at` DATETIME(3) NOT NULL,
    `update_at` DATETIME(3) NOT NULL,
    `delete_at` DATETIME(3) NULL,

    UNIQUE INDEX `registration_student_id_year_key`(`student_id`, `year`),
    PRIMARY KEY (`_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `registration`
    ADD CONSTRAINT `registration_student_id_fkey`
    FOREIGN KEY (`student_id`) REFERENCES `student`(`_id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
```

### 파일 위치

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/YYYYMMDDHHMMSS_add_registration/migration.sql`

---

## B2: tRPC 스키마 정의

### 파일 위치

- `packages/trpc/src/schemas/student.ts`

### 입력 스키마

```
bulkRegisterStudentsInputSchema:
  ids: string[] (필수, min 1, max 100)
  year: number (선택, 기본값: 현재 연도)

bulkCancelRegistrationInputSchema:
  ids: string[] (필수, min 1, max 100)
  year: number (선택, 기본값: 현재 연도)
```

### listStudentsInputSchema 변경

기존 필드에 추가:

```
registered: boolean (선택) — true: 등록만, false: 미등록만, 미전달: 전체
registrationYear: number (선택) — 조회 연도 (기본값: 현재 연도)
```

### bulkCreateStudentsInputSchema 변경

`CreateStudentInput`에 추가:

```
registered: boolean (선택, 기본값: false) — true이면 현재 연도 등록 처리
```

### 출력 타입

```typescript
// BulkRegisterStudentsOutput
{ registeredCount: number }

// BulkCancelRegistrationOutput
{ cancelledCount: number }

// ListStudentsOutput 변경
StudentWithGroup에 추가: isRegistered: boolean
응답에 추가: registrationSummary: { registeredCount: number, unregisteredCount: number }
```

### 내보내기

`packages/trpc/src/index.ts`에서 새 스키마/타입 re-export.

---

## B3: 일괄 등록 UseCase

### 파일 위치

- `apps/api/src/domains/student/application/bulk-register-students.usecase.ts`

### 비즈니스 로직

```
INPUT: ids (string[]), year (number), accountId (string)

1. accountId 소속 그룹 ID 목록 조회 (권한 스코프)
2. ids를 BigInt로 변환
3. 트랜잭션 시작
4. FOR EACH id IN ids:
   a. 학생이 해당 그룹에 속하는지 확인 (groupId IN groupIds, deletedAt IS NULL 체크 안 함 — 삭제/졸업 학생도 등록 가능)
   b. Registration upsert:
      - WHERE: studentId + year
      - CREATE: studentId, year, registeredAt=getNowKST(), createdAt=getNowKST(), updatedAt=getNowKST()
      - UPDATE: deletedAt=null, registeredAt=getNowKST(), updatedAt=getNowKST()
        (소프트 삭제된 레코드 복구)
   c. registeredCount 증가 (이미 활성 등록된 학생은 건너뜀)
5. 트랜잭션 종료
6. RETURN { registeredCount }
```

### 중복 처리

- 이미 등록된 학생 (deletedAt IS NULL): upsert이지만 실질적 변경 없음 → registeredCount에서 제외
- 소프트 삭제된 등록 (deletedAt IS NOT NULL): deletedAt을 null로 복구 → registeredCount에 포함

### 에러 처리

| 에러 상황 | 코드 | 메시지 |
|----------|------|--------|
| 빈 배열 | BAD_REQUEST | Zod 스키마에서 차단 (min 1) |
| 100명 초과 | BAD_REQUEST | Zod 스키마에서 차단 (max 100) |
| 트랜잭션 실패 | INTERNAL_SERVER_ERROR | 등록 처리 중 오류가 발생했습니다 |

---

## B4: 일괄 등록 취소 UseCase

### 파일 위치

- `apps/api/src/domains/student/application/bulk-cancel-registration.usecase.ts`

### 비즈니스 로직

```
INPUT: ids (string[]), year (number), accountId (string)

1. accountId 소속 그룹 ID 목록 조회 (권한 스코프)
2. ids를 BigInt로 변환
3. updateMany로 소프트 삭제:
   WHERE:
     studentId IN ids
     year = year
     student.groupId IN groupIds (권한 체크)
     deletedAt IS NULL (이미 취소된 것 제외)
   DATA:
     deletedAt = getNowKST()
     updatedAt = getNowKST()
4. RETURN { cancelledCount: result.count }
```

### 에러 처리

| 에러 상황 | 코드 | 메시지 |
|----------|------|--------|
| 빈 배열 | BAD_REQUEST | Zod 스키마에서 차단 (min 1) |
| 100명 초과 | BAD_REQUEST | Zod 스키마에서 차단 (max 100) |
| 등록 이력 없는 학생 | 무시 | cancelledCount에서 제외 |

---

## B5: student.list 등록 필터 + 현황 요약

### 파일 위치

- `apps/api/src/domains/student/application/list-students.usecase.ts` (기존 파일 수정)

### 변경 사항

#### 입력 파라미터 추가

- `registered?: boolean` — 등록 필터
- `registrationYear?: number` — 조회 연도 (기본값: 현재 연도)

#### 조회 로직 변경

```
registrationYear = input.registrationYear ?? new Date().getFullYear()

기존 WHERE 조건에 등록 필터 추가:
IF registered === true:
  Registration이 존재하고 deletedAt IS NULL인 학생만
IF registered === false:
  Registration이 없거나 deletedAt IS NOT NULL인 학생만
IF registered === undefined:
  필터 안 함 (전체)
```

Prisma 쿼리에서 Registration LEFT JOIN:

```
include 또는 select에서:
registrations: {
  where: { year: registrationYear, deletedAt: null },
  select: { id: true },
  take: 1
}
```

registered 필터 적용:

```
IF registered === true:
  registrations: { some: { year: registrationYear, deletedAt: null } }
IF registered === false:
  registrations: { none: { year: registrationYear, deletedAt: null } }
```

#### 응답 변경

StudentWithGroup에 `isRegistered` 필드 추가:

```
isRegistered = student.registrations.length > 0
```

#### 등록 현황 요약 추가

findMany/count와 병렬로 등록 현황 집계:

```
registeredCount = Registration 테이블에서 해당 연도 + deletedAt IS NULL + groupId IN groupIds 건수
unregisteredCount = 전체 재학생 수 - registeredCount
```

응답에 `registrationSummary: { registeredCount, unregisteredCount }` 추가.

---

## B6: bulkCreate 등록 연동

### 파일 위치

- `apps/api/src/domains/student/application/bulk-create-students.usecase.ts` (기존 파일 수정)

### 변경 사항

기존 트랜잭션 루프 내에서 `registered === true`인 학생의 Registration 레코드 동시 생성:

```
FOR EACH student IN input.students:
  created = tx.student.create(...)
  IF student.registered === true:
    tx.registration.create({
      data: {
        studentId: created.id,
        year: 현재 연도,
        registeredAt: getNowKST(),
        createdAt: getNowKST(),
        updatedAt: getNowKST(),
      }
    })
```

- 기존 트랜잭션 내에서 처리하므로 별도 트랜잭션 불필요
- `registered` 필드가 없거나 false이면 기존 동작과 동일 (하위호환)

---

## B7: 라우터 등록

### 파일 위치

- `apps/api/src/domains/student/presentation/student.router.ts` (기존 파일 수정)

### 추가 프로시저

```
bulkRegister: consentedProcedure
  .input(bulkRegisterStudentsInputSchema)
  .mutation(async ({ input, ctx }) => {
    const usecase = new BulkRegisterStudentsUseCase();
    return usecase.execute(input, ctx.account.id);
  })

bulkCancelRegistration: consentedProcedure
  .input(bulkCancelRegistrationInputSchema)
  .mutation(async ({ input, ctx }) => {
    const usecase = new BulkCancelRegistrationUseCase();
    return usecase.execute(input, ctx.account.id);
  })
```

- `consentedProcedure` 사용 (인증 + 동의 필요)
- `ctx.account.id`를 UseCase에 전달하여 권한 스코프 적용

---

## 검증 규칙 (Validation)

| 필드 | 규칙 | 코드 |
|------|------|------|
| ids | 배열, 1~100개 | BAD_REQUEST (Zod) |
| year | 양의 정수 | BAD_REQUEST (Zod) |
| registered | boolean 또는 미전달 | BAD_REQUEST (Zod) |
| registrationYear | 양의 정수 또는 미전달 | BAD_REQUEST (Zod) |

## 테스트 시나리오

> 테스트 파일: `apps/api/test/integration/student-registration.test.ts`
> 프레임워크: Vitest + tRPC Caller

### 정상 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 학생 3명 일괄 등록 | ids: [id1, id2, id3], year: 2026 | registeredCount: 3 |
| 이미 등록된 학생 포함 등록 | ids: [등록됨, 미등록] | registeredCount: 1 (미등록만) |
| 소프트 삭제된 등록 재등록 | ids: [취소된 학생] | registeredCount: 1 (deletedAt → null 복구) |
| 학생 2명 등록 취소 | ids: [id1, id2], year: 2026 | cancelledCount: 2 |
| 등록 필터 (등록만) | registered: true | 등록된 학생만 반환 |
| 등록 필터 (미등록만) | registered: false | 미등록 학생만 반환 |
| 등록 현황 요약 | 기본 조회 | registrationSummary 포함 |
| 엑셀 Import 등록 연동 | students: [{..., registered: true}] | 학생 생성 + Registration 생성 |

### 예외 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 빈 배열 등록 | ids: [] | BAD_REQUEST |
| 100명 초과 | ids: [101개] | BAD_REQUEST |
| 등록 이력 없는 학생 취소 | ids: [미등록 학생] | cancelledCount: 0 |
| 다른 계정 학생 등록 시도 | 타 계정 학생 ids | registeredCount: 0 (권한 스코프) |

## AI 구현 지침

### 파일 위치

- Prisma 스키마: `apps/api/prisma/schema.prisma`
- 마이그레이션: `apps/api/prisma/migrations/`
- tRPC 스키마: `packages/trpc/src/schemas/student.ts`
- tRPC 내보내기: `packages/trpc/src/index.ts`
- UseCase: `apps/api/src/domains/student/application/`
- Router: `apps/api/src/domains/student/presentation/student.router.ts`
- 테스트: `apps/api/test/integration/`

### 참고할 기존 패턴

- 일괄 작업: `BulkDeleteStudentsUseCase` (updateMany + 권한 스코프)
- 일괄 생성: `BulkCreateStudentsUseCase` (트랜잭션 + BigInt 변환)
- 목록 조회: `ListStudentsUseCase` (필터 + 페이지네이션 + 병렬 쿼리)
- KST 타임스탬프: `getNowKST()` from `@school/utils`
- BigInt 변환: `BigInt(id)` 입력, `String(id)` 출력

### 코드 스타일

- UseCase 클래스: `execute(input, accountId)` 메서드
- Prisma 직접 사용 (Repository 레이어 없음)
- `database.$transaction()` 으로 트랜잭션 처리
- `TRPCError` 로 에러 반환

---

**작성일**: 2026-03-10
**리뷰 상태**: Draft
