# Development: 학생 관리

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 상위 문서

- PRD: `docs/specs/prd/school-attendance.md`
- 기능 설계: `docs/specs/functional-design/student-management.md` (기본 + 일괄 삭제/복구 + 졸업 처리 + 엑셀 Import 포함)
- Feature: `docs/specs/current/functional/features/student-management.md`
- Task: `docs/specs/current/functional/tasks/student-management.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| 1~6 | 기본 학생 CRUD, 졸업/진급 | O (완료) |
| 7 | 학생 상세 페이지 라우트 | O (로드맵 1단계) |
| 8 | 학생 상세 조회 API 연동 | O (로드맵 1단계) |
| 9 | 인라인 수정 컴포넌트 | O (로드맵 1단계) |
| 10 | 다중 선택 UI | O (로드맵 1단계) |
| 11 | 일괄 삭제 기능 | O (로드맵 1단계) |
| 12 | 삭제 복구 기능 | O (로드맵 1단계) |
| 13 | 상태 필터 | O (로드맵 1단계) |
| 14 | 삭제 확인 다이얼로그 | O (로드맵 1단계) |
| 15 | 테이블 UI 개선 | O (로드맵 1단계) |
| 16 | 토스트 피드백 | O (로드맵 1단계) |
| 17 | DB 스키마 변경 (graduated_at) | O (로드맵 1단계 - 졸업) |
| 18 | 기존 API 이름 변경 (graduate → promote) | O (로드맵 1단계 - 졸업) |
| 19 | tRPC 스키마 정의 (졸업) | O (로드맵 1단계 - 졸업) |
| 20 | 졸업 처리 UseCase | O (로드맵 1단계 - 졸업) |
| 21 | 졸업 취소 UseCase | O (로드맵 1단계 - 졸업) |
| 22 | 목록 조회 UseCase 수정 (graduated 필터) | O (로드맵 1단계 - 졸업) |
| 23 | Router 연결 (졸업) | O (로드맵 1단계 - 졸업) |
| 24 | 프론트엔드 - 졸업 필터 UI | O (로드맵 1단계 - 졸업) |
| 25 | 프론트엔드 - 졸업 처리 UI | O (로드맵 1단계 - 졸업) |
| 26 | 프론트엔드 - 졸업 취소 UI | O (로드맵 1단계 - 졸업) |
| 27 | 통합 테스트 (졸업) | O (로드맵 1단계 - 졸업) |

## 구현 개요

학생 목록 조회/검색, 학생 CRUD, 졸업(진급) 처리를 제공한다. 매년 1월 1일에 모든 학생 나이를 1씩 증가시키는 스케줄이 동작한다.

### 로드맵 1단계 추가 구현

- 학생 상세 페이지: 학생 정보 인라인 편집 가능 형태로 표시
- 인라인 수정: 필드 클릭 시 편집 모드, 포커스 아웃 시 자동 저장
- 상태 필터: 재학생(기본) / 삭제된 학생 / 전체
- 일괄 삭제: 다중 선택 + bulkDelete API + 확인 다이얼로그
- 삭제 복구: restore API + 복구 버튼 (삭제된 학생 필터에서만)
- UI 개선: 테이블 호버/선택 효과, 토스트 피드백

### 졸업 처리 (로드맵 1단계)

- DB 스키마: `graduated_at` 필드 추가
- API 이름 변경: `student.graduate` → `student.promote` (기존 진급 기능)
- 일괄 졸업 처리: `student.graduate` (신규)
- 졸업 취소: `student.cancelGraduation` (신규)
- 졸업 필터: `graduated` 파라미터로 재학생/졸업생/전체 조회

## 데이터 모델

### 입력 (Input)

학생 목록 조회
```
GET /api/student?searchOption=societyName|catholicName|baptizedAt&searchWord=...&page=1
Authorization: Bearer <accessToken>
```

학생 생성/수정
```
POST /api/student
PUT /api/student/:studentId
Authorization: Bearer <accessToken>
{
  societyName: string (필수)
  catholicName?: string
  gender?: 'M' | 'F'
  age?: number
  contact?: number
  description?: string
  baptizedAt?: string
  groupId: number (필수)
}
```

학생 상세/삭제
```
GET /api/student/:studentId
DELETE /api/student/:studentId
Authorization: Bearer <accessToken>
```

학년 진급 (그룹 이동)
```
POST /api/student/promote (tRPC: student.promote)
Authorization: Bearer <accessToken>
```

일괄 졸업 처리 (로드맵 1단계)
```
POST /api/student/graduate (tRPC: student.graduate)
Authorization: Bearer <accessToken>
{
  ids: string[] (필수) - 졸업 처리할 학생 ID 배열 (최대 100명)
}
```

졸업 취소 (로드맵 1단계)
```
POST /api/student/cancelGraduation (tRPC: student.cancelGraduation)
Authorization: Bearer <accessToken>
{
  ids: string[] (필수) - 졸업 취소할 학생 ID 배열 (최대 100명)
}
```

### 로드맵 1단계 추가 입력

삭제 필터 적용 목록 조회
```
GET /api/student?includeDeleted=true&searchOption=...&searchWord=...&page=1
Authorization: Bearer <accessToken>
- includeDeleted 미지정 또는 false: 재학생만 (deleted_at=null) - 기본값
- includeDeleted=true: 삭제된 학생 포함 (전체)
- onlyDeleted=true: 삭제된 학생만
```

졸업 필터 적용 목록 조회 (로드맵 1단계)
```
GET /api/student?graduated=true|false|null&...
Authorization: Bearer <accessToken>
- graduated 미지정 또는 null: 전체 (졸업 필터 무시)
- graduated=false: 재학생만 (graduated_at=null) - UI 기본값
- graduated=true: 졸업생만 (graduated_at!=null)
```

일괄 삭제
```
DELETE /api/student/bulk
Authorization: Bearer <accessToken>
{
  studentIds: number[] (필수) - 삭제할 학생 ID 배열
}
```

삭제 복구
```
POST /api/student/restore
Authorization: Bearer <accessToken>
{
  studentIds: number[] (필수) - 복구할 학생 ID 배열
}
```

### tRPC 프로시저 (로드맵 1단계)

```
student.list: query (기존 + 삭제 필터 파라미터 추가)
- 입력: { searchOption?, searchWord?, page?, includeDeleted?: boolean, onlyDeleted?: boolean }
- 출력: { page, size, totalPage, students[] }

student.bulkDelete: mutation
- 입력: { studentIds: number[] }
- 출력: { deletedCount: number, students: { id, societyName, deletedAt }[] }

student.restore: mutation
- 입력: { studentIds: number[] }
- 출력: { restoredCount: number }
```

### 출력 (Output)

공통 응답 래퍼
```
{
  code: number
  message: string
  result?: object
}
```

학생 목록
```
{
  result: {
    account: string
    page: number
    size: number
    totalPage: number
    students: Array<student>
  }
}
```

학생 상세/생성/수정/삭제
```
{
  result: {
    account: string
    student: student
  }
}
```

졸업/진급
```
{
  result: {
    account: string
    row: number
  }
}
```

### 로드맵 1단계 추가 출력

일괄 삭제
```
{
  result: {
    account: string
    deletedCount: number
    students: [
      { id: number, societyName: string, deletedAt: string }
    ]
  }
}
```

삭제 복구
```
{
  result: {
    account: string
    restoredCount: number
  }
}
```

### 상태 변경

- 학생 생성 시 `student` 테이블 insert
- 학생 수정 시 `student` 테이블 update
- 학생 삭제 시 `delete_at` 업데이트
- 졸업/진급 시 `group_id` 업데이트
- 스케줄러 실행 시 `age` 업데이트

## 비즈니스 로직

### 1. 학생 목록 조회/검색

```
IF page is invalid THEN page = 1
where = {
  group_id in groupsByAccount(accountId),
  delete_at is null,
  optional filters by searchOption/searchWord
}
rows, count = StudentRepository.findAndCountAll(where, page, size=10)
return { page, size, totalPage, students }
```

### 2. 학생 상세/생성/수정/삭제

```
IF studentId is not a positive number THEN
  throw BAD_REQUEST("studentId is wrong")
create:
  insert student fields
modify:
  update all student fields by studentId
delete:
  set delete_at = now
```

### 3. 졸업/진급 처리

```
IF accountName == "초등부" THEN
  map group names: 유치부->1학년->2학년->3학년->4학년->5학년->6학년->예비 중1
  move students in each group to next group (age >= 8 only)
ELSE IF accountName == "중고등부" THEN
  move age 19 -> 고3, age 20 -> 성인
ELSE
  return 0
```

### 4. 연례 나이 증가

```
매년 1월 1일 00:00에
UPDATE student SET age = age + 1
```

### 5. 삭제 필터 적용 목록 조회 (로드맵 1단계)

```
IF onlyDeleted == true THEN
  where.delete_at IS NOT NULL
ELSE IF includeDeleted == true THEN
  // delete_at 조건 없음 (전체)
ELSE
  where.delete_at = null (기본값: 재학생만)
rows, count = StudentRepository.findAndCountAll(where, page, size=10)
return { page, size, totalPage, students }
```

### 6. 학생 일괄 삭제 (로드맵 1단계)

```
IF studentIds is empty array THEN
  throw BAD_REQUEST("studentIds is required")
FOR EACH studentId IN studentIds
  IF studentId is not a positive number THEN
    skip (or throw BAD_REQUEST)
existingStudents = StudentRepository.findByIds(studentIds, delete_at is null)
now = current timestamp
FOR EACH student IN existingStudents
  set delete_at = now
deletedCount = existingStudents.length
return { deletedCount, students with id, societyName, deletedAt }
```

### 7. 삭제된 학생 복구 (로드맵 1단계)

```
IF studentIds is empty array THEN
  throw BAD_REQUEST("studentIds is required")
existingStudents = StudentRepository.findByIds(studentIds, delete_at IS NOT NULL)
FOR EACH student IN existingStudents
  set delete_at = null
restoredCount = existingStudents.length
return { restoredCount }
```

## 검증 규칙 (Validation)

| 필드 | 규칙 | 에러 메시지 |
|------|------|------------|
| studentId | 양수 숫자 | "BAD_REQUEST: studentId is wrong" |
| page | 숫자 또는 미입력 | 미입력 시 1 |
| searchOption | societyName/catholicName/baptizedAt | 그 외는 필터 미적용 |
| groupId | 필수 | DB 에러 발생 가능 |
| includeDeleted (로드맵 1단계) | boolean 또는 미입력 | 미입력 시 false (재학생만) |
| onlyDeleted (로드맵 1단계) | boolean 또는 미입력 | 미입력 시 false |
| studentIds (로드맵 1단계) | 배열, 최소 1개 | "BAD_REQUEST: studentIds is required" |
| societyName (로드맵 1단계) | 인라인 수정 시 필수, 1자 이상 | "BAD_REQUEST: societyName is required" |

## 에러 처리

| 에러 상황 | 에러 코드 | 응답 |
|----------|----------|------|
| 잘못된 studentId | 400 | BAD_REQUEST: studentId is wrong |
| 존재하지 않는 학생 | 404 | NOT_FOUND: STUDENT NOT_FOUND |
| 토큰 누락 | 404 | UNAUTHORIZED: TOKEN NOT_FOUND |
| 서버/DB 오류 | 500 | INTERNAL_SERVER_ERROR |

## 테스트 시나리오

### 정상 케이스

1. **목록 조회**: `/api/student` → page/size/totalPage/students 반환
2. **생성/수정/삭제**: 각 요청 → student 반환

### 정상 케이스 - 로드맵 1단계

1. **기본 조회**: `/api/student` → 재학생만 반환 (deleted_at=null)
2. **삭제 포함 조회**: `/api/student?includeDeleted=true` → 전체 학생 반환
3. **삭제된 학생만 조회**: `/api/student?onlyDeleted=true` → 삭제된 학생만 반환
4. **일괄 삭제**: `/api/student/bulk` with studentIds → deletedCount, students 반환
5. **삭제 복구**: `/api/student/restore` with studentIds → restoredCount 반환
6. **일괄 삭제 일부 없음**: 존재하는 학생만 삭제, deletedCount 반환
7. **삭제된 학생 출석 조회**: 삭제된 학생의 출석 기록 조회 가능

### 예외 케이스

1. **잘못된 studentId**: 문자열 studentId → 400 반환
2. **토큰 누락**: 보호된 엔드포인트 → 401 반환

### 예외 케이스 - 로드맵 1단계

3. **일괄 삭제 빈 배열**: studentIds: [] → 400 반환
4. **복구 빈 배열**: studentIds: [] → 400 반환
5. **인라인 수정 필수 필드 누락**: societyName: "" → 400 반환

## 구현 시 주의사항

- 모든 응답은 HTTP 200으로 내려가며, `code` 필드로 성공/실패를 구분한다.
- 목록 조회는 계정 소속 그룹을 기준으로 필터링한다.
- 졸업/진급은 그룹/학생 조회가 계정 범위로 제한되지 않은 부분이 있다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

### 기존 파일 위치

- Backend API: `apps/api/src/router/student.ts`
- Backend UseCase: `apps/api/src/usecase/StudentUseCase.ts`
- Frontend 페이지: `apps/web/src/pages/student/`
- Frontend 훅: `apps/web/src/features/student/hooks/useStudents.ts`
- 테스트: `apps/api/test/integration/student.test.ts`

### 로드맵 1단계 구현 파일

**Backend (apps/api)**
- `src/router/student.ts`: bulkDelete, restore 프로시저 추가, list에 status 파라미터 추가
- `src/usecase/StudentUseCase.ts`: bulkDelete, restore 메서드 추가

**Frontend (apps/web)**
- `src/pages/student/StudentDetailPage.tsx`: 신규 생성 (인라인 수정 포함)
- `src/pages/student/StudentListPage.tsx`: 상태 필터, 다중 선택, 일괄 삭제/복구 UI 추가
- `src/features/student/hooks/useStudents.ts`: bulkDelete, restore mutation 추가
- `src/routes/index.tsx`: `/students/:id` 라우트 추가

### 참고할 기존 패턴

- 인라인 수정: shadcn/ui Input + onBlur 자동 저장
- 다중 선택: React state로 selectedIds Set 관리
- 토스트: shadcn/ui toast 사용
- 확인 다이얼로그: shadcn/ui AlertDialog
- 상태 필터: Select 컴포넌트 + URL 쿼리 파라미터

### 코드 스타일

- tRPC 프로시저: Zod 스키마로 입력 검증
- UseCase: 비즈니스 로직 분리
- 컴포넌트: 함수형 컴포넌트 + hooks

---

## 졸업 처리 구현 (로드맵 1단계)

### DB 스키마 변경 (#17)

```sql
-- apps/api/prisma/migrations/YYYYMMDD_add_student_graduated_at.sql
ALTER TABLE student ADD COLUMN graduated_at DATETIME NULL;
```

```prisma
// apps/api/prisma/schema.prisma - Student 모델에 추가
graduatedAt  DateTime? @map("graduated_at")
```

### 기존 API 이름 변경 (#18)

| 기존 | 변경 후 | 설명 |
|------|--------|------|
| `student.graduate` | `student.promote` | 학년 진급 (그룹 이동) |
| `GraduateStudentsUseCase` | `PromoteStudentsUseCase` | 클래스명 변경 |
| `graduate-students.usecase.ts` | `promote-students.usecase.ts` | 파일명 변경 |

### tRPC 스키마 (#19)

```typescript
// 학생 목록 조회 - graduated 필터 추가
export const listStudentsInputSchema = z.object({
    // ... 기존 필드
    graduated: z.boolean().nullable().optional(),  // null=전체, false=재학생(기본), true=졸업생
});

// 일괄 졸업 처리 입력
export const graduateStudentsInputSchema = z.object({
    ids: z.array(idSchema).min(1).max(100),
});

// 졸업 취소 입력
export const cancelGraduationInputSchema = z.object({
    ids: z.array(idSchema).min(1).max(100),
});
```

### 졸업 처리 비즈니스 로직 (#20)

```
입력: { ids: string[], accountId: string }
출력: { success: true, graduatedCount: number, students: GraduatedStudent[] }

1. 트랜잭션 시작
2. 대상 학생 조회
   조건: id IN ids AND graduatedAt IS NULL AND deletedAt IS NULL AND group.accountId = accountId
3. 졸업 처리
   FOR EACH student
     SET graduatedAt = 현재시간(KST)
4. 결과 반환
```

### 졸업 취소 비즈니스 로직 (#21)

```
입력: { ids: string[], accountId: string }
출력: { success: true, cancelledCount: number, students: GraduatedStudent[] }

1. 트랜잭션 시작
2. 대상 학생 조회
   조건: id IN ids AND graduatedAt IS NOT NULL AND deletedAt IS NULL AND group.accountId = accountId
3. 졸업 취소
   FOR EACH student
     SET graduatedAt = NULL
4. 결과 반환
```

### 목록 조회 필터 수정 (#22)

```
graduated 파라미터에 따른 필터:
- graduated = false (기본): graduatedAt IS NULL (재학생)
- graduated = true: graduatedAt IS NOT NULL (졸업생)
- graduated = null/생략: 필터 없음 (전체)
```

### 졸업 통합 테스트 시나리오 (#27)

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 졸업 처리 성공 | ids: ['1', '2'] | graduatedCount: 2 |
| 빈 배열 | ids: [] | BAD_REQUEST |
| 100명 초과 | ids: 101개 | BAD_REQUEST |
| 미인증 | 토큰 없음 | UNAUTHORIZED |
| 이미 졸업한 학생 | 졸업생 id | graduatedCount: 0 |
| 졸업 취소 성공 | 졸업생 ids | cancelledCount: N |
| 재학생 졸업 취소 | 재학생 id | cancelledCount: 0 |
| 필터 - 재학생 | graduated: false | 재학생만 반환 |
| 필터 - 졸업생 | graduated: true | 졸업생만 반환 |
| 필터 - 전체 | graduated: null | 전체 반환 |

### 졸업 관련 파일 위치

| 유형 | 경로 |
|------|------|
| 마이그레이션 | `apps/api/prisma/migrations/` |
| Prisma 스키마 | `apps/api/prisma/schema.prisma` |
| tRPC 스키마 | `packages/trpc/src/schemas/student.ts` |
| 졸업 UseCase | `apps/api/src/domains/student/application/graduate-students.usecase.ts` (신규) |
| 취소 UseCase | `apps/api/src/domains/student/application/cancel-graduation.usecase.ts` (신규) |
| 진급 UseCase | `apps/api/src/domains/student/application/promote-students.usecase.ts` (이름 변경) |
| 목록 UseCase | `apps/api/src/domains/student/application/list-students.usecase.ts` (수정) |

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-24
**리뷰 상태**: Approved (기본 + 로드맵 1단계)
