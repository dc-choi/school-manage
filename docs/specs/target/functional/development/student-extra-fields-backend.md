# Development: 학생 추가 필드 (부모님 연락처) — Backend

> 상태: Draft | 작성일: 2026-04-24

## 상위 문서

- PRD: `docs/specs/prd/student-extra-fields.md`
- 기능 설계: `docs/specs/functional-design/student-extra-fields.md`
- Task: `docs/specs/target/functional/tasks/student-extra-fields.md`

## 구현 대상 업무

| Task # | 업무명 | 포함 |
|--------|-------|------|
| B1 | Prisma 스키마 업데이트 | O |
| B2 | 마이그레이션 생성 | O |
| B3 | Shared Zod 스키마 확장 | O |
| B4 | CreateStudentUseCase | O |
| B5 | UpdateStudentUseCase | O |
| B6 | BulkCreateStudentsUseCase | O |
| B7 | Snapshot helper 확장 | O |
| B8 | 통합 테스트 | O |

## 구현 개요

`Student` / `StudentSnapshot` 양쪽에 `parentContact String?` 필드를 무중단 추가하고, Zod → UseCase 3종 → Snapshot helper 전수 갱신 → 통합 테스트로 회귀 차단한다. 신규 필드는 **String 원본 저장**(BigInt 변환 없음)으로 기존 `contact`와 설계 분리 — 포매팅 분리 전략.

## 파일별 변경 지점

### 1. Prisma 스키마 (B1·B2)

**파일**: `apps/api/prisma/schema.prisma`

| 모델 | 추가 필드 |
|------|----------|
| `Student` | `parentContact String? @map("parent_contact") @db.VarChar(20)` |
| `StudentSnapshot` | 동일 |

**마이그레이션**: `/prisma-migrate` 스킬로 생성. 디렉토리 예: `apps/api/prisma/migrations/20260424/add_student_parent_contact.sql`. DDL 2건, nullable + 기본값 없음.

### 2. Shared Zod 스키마 (B3)

**파일**: `packages/shared/src/schemas/student.ts`

- `createStudentInputSchema` / `updateStudentInputSchema` / `bulkCreateStudentItemSchema`에 `parentContact` 추가
- 패턴:
  - create/bulkCreate: `.regex(/^[\d\-()\s]+$/, …).max(20, …).optional()`
  - update: 동일 + `.nullable()` 추가 (clear 지원, `input-validation-hardening` 패턴 계승)
- 한글 에러 메시지:
  - 형식 위반: `"부모님 연락처는 숫자·하이픈·괄호·공백만 입력해주세요"`
  - 길이 초과: `"부모님 연락처는 20자 이하여야 합니다"`

**파일**: 동일 — `StudentBase` 인터페이스에 `parentContact?: string` 추가. 나머지 출력 타입은 자동 전파.

### 3. UseCase 3종 (B4·B5·B6)

**공통 정규화 헬퍼** (UseCase 내부 inline — 공유 util 도입 불필요):
```
const normalizeParentContact = (v: string | null | undefined): string | null =>
  v?.trim() ? v.trim() : null;
```

**파일**: `apps/api/src/domains/student/application/`
- `create-student.usecase.ts` — `data.parentContact` 저장 + 응답에 `student.parentContact ?? undefined`
- `update-student.usecase.ts` — `if (input.parentContact !== undefined) data.parentContact = normalizeParentContact(input.parentContact)` (partial update 패턴)
- `bulk-create-students.usecase.ts` — 각 학생 항목에 `parentContact: normalizeParentContact(student.parentContact)` 전파

응답 변환은 기존 `student.contact != null ? String(student.contact) : undefined`와 달리 **BigInt 변환 없음**: `student.parentContact ?? undefined`.

### 4. Snapshot helper (B7)

**파일**: `apps/api/src/domains/snapshot/snapshot.helper.ts`

- `CreateStudentSnapshotInput` 인터페이스에 `parentContact: string | null` 추가
- `createStudentSnapshot` / `createBulkStudentSnapshots` — `data` 객체에 필드 추가
- `StudentSnapshotData`(조회 반환 타입)에 필드 추가 + `getBulkStudentSnapshots` 맵 생성 지점 반영

**호출 지점 전수 갱신** (grep 대상: `createStudentSnapshot\|createBulkStudentSnapshots`):
- `create-student.usecase.ts`, `update-student.usecase.ts`, `bulk-create-students.usecase.ts`
- `promote-students.usecase.ts`, `graduate-students.usecase.ts` 등 Student 변경 트리거 전수
- 각 호출에서 `parentContact: updated.parentContact` (또는 생성 시 `created.parentContact`) 전달

## 데이터 모델

### 입력 (신규 필드만)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `parentContact` | string | X | 부모님 연락처. 숫자·하이픈·괄호·공백, max 20 |

- `create`/`bulkCreate`: `optional`
- `update`: `nullable + optional` (null = clear, undefined = skip)

### 출력 (신규 필드만)

| 필드 | 타입 | 설명 |
|------|------|------|
| `parentContact?` | string | 저장된 원본 문자열 (서버 NULL 정규화 후) |

## 검증 규칙 (추가)

> 기존 규칙은 FD + `input-validation-hardening` 참조. 중복 생략.

| 필드 | 규칙 | 코드 | 메시지 |
|------|------|------|--------|
| `parentContact` | `/^[\d\-()\s]+$/` | `BAD_REQUEST` | "부모님 연락처는 숫자·하이픈·괄호·공백만 입력해주세요" |
| `parentContact` | max 20자 | `BAD_REQUEST` | "부모님 연락처는 20자 이하여야 합니다" |
| `parentContact` (update) | null 허용 (clear) | — | 해당 필드 NULL 저장 |
| `parentContact` (서버) | 빈 문자열 → NULL 정규화 | — | DB에는 NULL |

## 테스트 시나리오 (B8)

> FD TC-1 ~ TC-E4 전수. 실제 DB 기반 (`apps/api/test/helpers/db-lifecycle.ts` 패턴).

### 정상 케이스

| 시나리오 | 입력 | 기대 |
|---------|------|------|
| TC-1 create 정상 | `parentContact: "010-1234-5678"` | 200, 응답 `parentContact` 포함, DB `VARCHAR` 원본 저장 |
| TC-2 update partial | `parentContact: "(02) 123 4567"` | 200, 다른 필드 보존, DB 원본 저장 |
| TC-3 update clear | `parentContact: null` | 200, DB NULL |
| TC-4 bulkCreate 혼합 | 2행 중 1행만 값 | 200, 전 행 저장, 값/NULL 혼합 반영 |
| TC-5 bulkCreate 기존 템플릿 | 3행 `parentContact` 전부 undefined | 200, 전 행 NULL |
| TC-6 list/get 응답 노출 | 기존 학생 조회 | 응답 `parentContact` 필드 존재 |
| TC-7 Snapshot 기록 | create 직후 | `StudentSnapshot` 신규 필드가 입력값으로 저장됨 |

### 예외 케이스

| 시나리오 | 입력 | 기대 |
|---------|------|------|
| TC-E1 길이 초과 | 21자 | 400 BAD_REQUEST, 한글 메시지 |
| TC-E2 한글 포함 | `"김엄마010-..."` | 400 BAD_REQUEST |
| TC-E3 bulk 단일 행 위반 | 2행 중 1행 위반 | 400, 오류 행만 식별, 나머지도 미저장 (기존 트랜잭션 정책 준수) |
| TC-E4 빈 문자열 | `parentContact: ""` | 200, DB NULL 저장 |

## 주의사항

- **BigInt 변환 금지**: 기존 `contact` 패턴(`BigInt(input.contact)`)을 복사하지 않음. 선행 0 잘림 버그 재현 방지
- **Snapshot 호출 지점 전수 점검**: `grep -rn "createStudentSnapshot\|createBulkStudentSnapshots" apps/api/src`로 호출 위치 전수 확인 후 `parentContact` 인자 추가. 하나라도 빠지면 해당 경로에서 스냅샷에 NULL 저장 → 회귀
- **빈 문자열 정규화**: 3개 경로(create/update/bulkCreate) 모두 동일 규칙(`trim() || null`). UseCase 레이어에서 처리, Zod는 빈 문자열 허용 (optional이 undefined만 처리함)
- **update partial 패턴**: `input.parentContact !== undefined` 분기 유지 — `null`과 `undefined` 구분 필요
- **`StudentSnapshot.groupId`는 기존처럼 `?? 0n` 기본값 유지** (FD 범위 외)
- 본인 `contact` BigInt는 본 작업에서 손대지 않음 → TARGET BUGFIX "Student.contact 타입 이관"에 위임
