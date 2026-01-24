# Development: 그룹 관리

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 상위 문서

- PRD: `docs/specs/prd/school-attendance.md`
- 기능 설계: `docs/specs/functional-design/group-management.md`
- Feature: `docs/specs/current/functional/features/group-management.md`
- Task: `docs/specs/current/functional/tasks/group-management.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| 1~6 | 기본 그룹 CRUD | O (완료) |
| 7 | 그룹 상세 페이지 라우트 | O (로드맵 1단계) |
| 8 | 그룹 상세 조회 API 연동 | O (로드맵 1단계) |
| 9 | 인라인 수정 컴포넌트 | O (로드맵 1단계) |
| 10 | 다중 선택 UI | O (로드맵 1단계) |
| 11 | 일괄 삭제 기능 | O (로드맵 1단계) |
| 12 | 테이블 UI 개선 | O (로드맵 1단계) |
| 13 | 토스트/다이얼로그 | O (로드맵 1단계) |

## 구현 개요

계정이 관리하는 그룹을 CRUD하고, 그룹 단위 출석 데이터를 조회한다. 그룹 삭제는 소프트 삭제로 처리한다.

### 로드맵 1단계 추가 구현

- 그룹 상세 페이지: 그룹 정보 + 소속 학생 목록 표시
- 인라인 수정: 그룹명 클릭 시 편집 모드 전환, API 호출 후 갱신
- 일괄 삭제: 다중 선택 + bulkDelete API + 확인 다이얼로그
- UI 개선: 테이블 호버/선택 효과, 토스트 피드백

## 데이터 모델

### 입력 (Input)

```
GET /api/group
Authorization: Bearer <accessToken>
```

```
POST /api/group
Authorization: Bearer <accessToken>
{
  name: string (필수) - 그룹명
}
```

```
GET /api/group/:groupId
PUT /api/group/:groupId
DELETE /api/group/:groupId
Authorization: Bearer <accessToken>
```

```
GET /api/group/:groupId/attendance?year=YYYY
Authorization: Bearer <accessToken>
```

### 로드맵 1단계 추가 입력

```
GET /api/group/:groupId (상세 조회 - 학생 목록 포함)
Authorization: Bearer <accessToken>
→ 기존 상세 조회에 학생 목록 추가

DELETE /api/group/bulk (일괄 삭제)
Authorization: Bearer <accessToken>
{
  groupIds: number[] (필수) - 삭제할 그룹 ID 배열
}
```

### tRPC 프로시저 (로드맵 1단계)

```
group.get: query
- 입력: { groupId: number }
- 출력: { group, students[] }

group.bulkDelete: mutation
- 입력: { groupIds: number[] }
- 출력: { deletedCount: number }
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

그룹 목록
```
{
  result: {
    account: string
    groups: Array<{ _id: number, name: string, accountId: number }>
  }
}
```

그룹 생성/수정/삭제
```
{
  result: {
    account: string
    group: { _id: number, name: string, accountId: number }
  }
}
```

그룹 출석 현황
```
{
  result: {
    account: string
    year: number
    sunday: Array<number[]>
    saturday: Array<number[]>
    students: Array<student>
    attendances: Array<attendance>
  }
}
```

### 로드맵 1단계 추가 출력

그룹 상세 (학생 목록 포함)
```
{
  result: {
    account: string
    group: { _id: number, name: string, accountId: number, studentCount: number }
    students: Array<{ _id: number, societyName: string, catholicName: string, age: number }>
  }
}
```

일괄 삭제
```
{
  result: {
    account: string
    deletedCount: number
  }
}
```

### 상태 변경

- 그룹 생성/수정/삭제 시 `group` 테이블 변경
- 삭제는 `delete_at` 업데이트

## 비즈니스 로직

### 1. 그룹 목록

```
accountId = token.account.id
groups = GroupRepository.findAll(accountId, delete_at is null)
return groups
```

### 2. 그룹 상세 조회

```
IF groupId is not a positive number THEN
  throw BAD_REQUEST("groupId is wrong")
Fetch group by groupId where delete_at is null
IF not found THEN throw NOT_FOUND
return group
```

### 3. 그룹 생성/수정/삭제

```
create:
  insert { name, account_id }
modify:
  update { name, account_id } by groupId
remove:
  set delete_at = now by groupId
```

### 4. 그룹 출석 현황 조회

```
IF groupId is not a positive number THEN
  throw BAD_REQUEST
IF year is invalid THEN year = currentYear
sunday/saturday = getYearDate(year)
students = StudentRepository.findAll(groupId)
attendance = AttendanceRepository.findAll(student_id in students)
return { year, sunday, saturday, students, attendance }
```

### 5. 그룹 상세 조회 - 학생 목록 포함 (로드맵 1단계)

```
IF groupId is not a positive number THEN
  throw BAD_REQUEST("groupId is wrong")
Fetch group by groupId where delete_at is null
IF not found THEN throw NOT_FOUND
students = StudentRepository.findAll(groupId, delete_at is null)
studentCount = students.length
return { group with studentCount, students }
```

### 6. 그룹 일괄 삭제 (로드맵 1단계)

```
IF groupIds is empty array THEN
  throw BAD_REQUEST("groupIds is required")
FOR EACH groupId IN groupIds
  IF groupId is not a positive number THEN
    skip (or throw BAD_REQUEST)
existingGroups = GroupRepository.findByIds(groupIds, delete_at is null)
FOR EACH group IN existingGroups
  set delete_at = now
deletedCount = existingGroups.length
return { deletedCount }
```

## 검증 규칙 (Validation)

| 필드 | 규칙 | 에러 메시지 |
|------|------|------------|
| groupId | 양수 숫자 | "BAD_REQUEST: groupId is wrong" |
| name | 필수, 1자 이상 | "BAD_REQUEST: name is required" |
| year | 숫자 또는 미입력 | 미입력 시 현재 연도 |
| groupIds (로드맵 1단계) | 배열, 최소 1개 | "BAD_REQUEST: groupIds is required" |

## 에러 처리

| 에러 상황 | 에러 코드 | 응답 |
|----------|----------|------|
| 잘못된 groupId | 400 | BAD_REQUEST: groupId is wrong |
| 존재하지 않는 그룹 | 404 | NOT_FOUND: GROUP NOT_FOUND |
| 토큰 누락 | 404 | UNAUTHORIZED: TOKEN NOT_FOUND |
| 서버/DB 오류 | 500 | INTERNAL_SERVER_ERROR |

## 테스트 시나리오

### 정상 케이스

1. **목록 조회**: `/api/group` → groups 배열 반환
2. **생성/수정/삭제**: 각각의 요청 → group 반환
3. **출석 조회**: `/api/group/:id/attendance` → year/sunday/saturday/students/attendances 반환

### 정상 케이스 - 로드맵 1단계

4. **상세 조회 (학생 포함)**: `/api/group/:id` → group + students 배열 반환
5. **일괄 삭제**: `/api/group/bulk` with groupIds → deletedCount 반환
6. **일괄 삭제 일부 없음**: 존재하는 그룹만 삭제, deletedCount 반환

### 예외 케이스

1. **잘못된 groupId**: 문자열 groupId → 400 반환
2. **토큰 누락**: 보호된 엔드포인트 → 401 반환

### 예외 케이스 - 로드맵 1단계

3. **일괄 삭제 빈 배열**: groupIds: [] → 400 반환
4. **인라인 수정 빈 그룹명**: name: "" → 400 반환

## 구현 시 주의사항

- 모든 응답은 HTTP 200으로 내려가며, `code` 필드로 성공/실패를 구분한다.
- 그룹 상세/수정/삭제는 현재 구현상 계정 소유 여부를 검증하지 않는다.
- 출석 조회는 연도 필터 없이 학생의 모든 출석 레코드를 반환한다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

### 기존 파일 위치

- Backend API: `apps/api/src/router/group.ts`
- Backend UseCase: `apps/api/src/usecase/GroupUseCase.ts`
- Frontend 페이지: `apps/web/src/pages/group/`
- Frontend 훅: `apps/web/src/features/group/hooks/useGroups.ts`
- 테스트: `apps/api/test/integration/group.test.ts`

### 로드맵 1단계 구현 파일

**Backend (apps/api)**
- `src/router/group.ts`: bulkDelete 프로시저 추가
- `src/usecase/GroupUseCase.ts`: bulkDelete, getDetail 메서드 추가

**Frontend (apps/web)**
- `src/pages/group/GroupDetailPage.tsx`: 신규 생성
- `src/pages/group/GroupListPage.tsx`: 다중 선택, 일괄 삭제 UI 추가
- `src/features/group/hooks/useGroups.ts`: bulkDelete mutation 추가
- `src/routes/index.tsx`: `/groups/:id` 라우트 추가

### 참고할 기존 패턴

- 인라인 수정: shadcn/ui Input 컴포넌트
- 다중 선택: React state로 selectedIds Set 관리
- 토스트: shadcn/ui toast 사용
- 확인 다이얼로그: shadcn/ui AlertDialog

### 코드 스타일

- tRPC 프로시저: Zod 스키마로 입력 검증
- UseCase: 비즈니스 로직 분리
- 컴포넌트: 함수형 컴포넌트 + hooks

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-22
**리뷰 상태**: Approved (기본 + 로드맵 1단계)
