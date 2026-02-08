# 기능 설계: 학생 관리

> PM 에이전트가 작성하는 기능 설계 문서입니다.
> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- 사업 문서: `docs/business/6_roadmap/roadmap.md`


## 기능 범위

| 기능 | 설명 | 상태 |
|------|------|------|
| 기본 학생 관리 | 학생 CRUD, 목록, 검색 | 구현 완료 |
| 일괄 삭제/복구 (로드맵 1단계) | 다중 선택 삭제, 소프트 삭제, 복구 | 구현 완료 |
| 일괄 졸업 처리 (로드맵 1단계) | 다중 선택 졸업, 졸업 취소 | 구현 완료 |
| 페이지네이션 상태 유지 (로드맵 1단계) | 상세→목록 복귀 시 페이지 유지 (URL 쿼리 파라미터) | 구현 완료 |
| 엑셀 Import (로드맵 1단계) | 엑셀 파일 업로드로 학생 일괄 등록 | 미구현 |

## 흐름/상태

### 사용자 플로우

**기본 플로우:**
1. 사용자가 학생 명단 화면 진입
2. 계정 소속 그룹의 전체 학생 목록 조회 (재학생 필터 기본)
3. 검색 조건으로 필터링 또는 페이지 이동
4. 학생 추가 또는 특정 학생 선택
5. 학생 선택 시 해당 학생의 상세 페이지로 이동

**상세 페이지 플로우 (로드맵 1단계):**
1. 학생 상세 페이지에서 학생 정보 확인
2. 인라인 수정 가능 (이름, 세례명, 나이 등)
3. 학생 목록으로 복귀 → **이전 페이지 번호 유지** (URL 쿼리 파라미터 기반)

**일괄 삭제 플로우 (로드맵 1단계):**
1. 학생 목록 화면에서 다중 선택 체크박스 활성화
2. 삭제할 학생 선택
3. "삭제" 버튼 클릭
4. 확인 모달 표시 (선택된 학생 수 확인)
5. 확인 → 소프트 삭제 처리
6. 학생 목록에서 사라짐 (숨김 처리)

**삭제된 학생 복구 플로우 (로드맵 1단계):**
1. 학생 목록 화면에서 "삭제된 학생" 필터 선택
2. 삭제된 학생 목록 표시
3. 복구할 학생 선택 후 "복구" 버튼 클릭
4. 재학생 목록에 복귀

**일괄 졸업 처리 플로우 (로드맵 1단계):**
1. 학생 목록 화면 진입
2. 졸업 대상 학생 체크박스 선택 (다중 선택)
3. "졸업 처리" 버튼 클릭
4. 확인 모달 표시 (선택된 학생 수 확인)
5. 확인 → 졸업 처리 완료
6. 학생 목록에서 사라짐 (숨김 처리)

**졸업생 조회 플로우 (로드맵 1단계):**
1. 학생 목록 화면에서 "졸업생" 필터 선택
2. 졸업생 목록 표시
3. 졸업 취소 가능 (필요 시)

### 상태 전이

```
[학생 목록 (?page=N)] → (학생 클릭) → [학생 상세]
[학생 상세] → (목록으로 복귀) → [학생 목록 (?page=N)] ← 페이지 유지
[학생 상세] → (인라인 수정) → [학생 수정 완료] → [학생 상세]
[학생 목록] → (학생 추가) → [학생 생성 완료] → [학생 목록 (?page=1)]
[학생 목록] → (다중 선택 + 일괄 삭제) → [학생 소프트 삭제] → [학생 목록]
[학생 목록 (삭제된 학생 필터)] → (복구) → [학생 목록 (재학생)]
[학생 목록] → (졸업/진급) → [그룹 이동 완료] → [학생 목록]
[학생 목록] → (검색/필터 변경) → [학생 목록 (?page=1)] ← 페이지 리셋
```

## UI/UX (해당 시)

### 화면/컴포넌트

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 학생 목록 | 전체 학생 리스트 (페이지네이션) | 검색 필터, 삭제 필터, 학생 테이블, 다중 선택 체크박스, 일괄 삭제/복구 버튼, 페이지 네비게이션 |
| 학생 상세 | 학생 정보 조회/수정 | 학생 정보 (인라인 수정), 뒤로 가기 |
| 학생 추가 | 신규 학생 등록 | 정보 입력 폼, 그룹 선택, 저장 버튼 |

### 화면별 상세 (로드맵 1단계)

#### 학생 목록 화면

| 요소 | 설명 |
|------|------|
| 삭제 필터 | 재학생(기본) / 삭제된 학생 포함 / 삭제된 학생만 |
| 검색 필터 | 이름, 세례명, 축일로 검색 |
| 테이블 헤더 | 선택 체크박스, 이름, 세례명, 나이, 그룹, 연락처 |
| 테이블 행 | 클릭 시 상세 페이지 이동 (전체 행이 클릭 영역) |
| 다중 선택 | 헤더의 전체 선택 체크박스, 각 행의 개별 체크박스 |
| 삭제 버튼 | 선택된 학생이 있을 때만 활성화 (재학생 필터에서만 표시) |
| 복구 버튼 | 삭제된 학생 필터에서만 표시 |
| 추가 버튼 | 신규 학생 등록 |
| 페이지네이션 | 페이지당 10명, URL 쿼리 파라미터(`?page=N`)로 상태 동기화 |

#### 버튼 배치

```
┌─────────────────────────────────────────────────────────┐
│ [삭제]  [추가]          필터: [재학생 ▼]  검색: [____]   │
├─────────────────────────────────────────────────────────┤
│ ☐ │ 이름     │ 세례명  │ 나이 │ 그룹    │ 연락처       │
├─────────────────────────────────────────────────────────┤
│ ☑ │ 홍길동   │ 베드로  │ 14  │ 중1-1반 │ 010-1234-... │
│ ☑ │ 김철수   │ 바오로  │ 14  │ 중1-1반 │ 010-9876-... │
│ ☐ │ 박영희   │ 마리아  │ 15  │ 중1-2반 │ 010-5555-... │
└─────────────────────────────────────────────────────────┘
                      [< 1 2 3 ... >]
```

#### 학생 상세 화면

| 요소 | 설명 |
|------|------|
| 학생 정보 | 이름, 세례명, 성별, 나이, 연락처, 축일, 메모 (모두 인라인 수정 가능) |
| 그룹 선택 | 소속 그룹 변경 드롭다운 |
| 성별 선택 | 남/여 드롭다운 |
| 삭제 배지 | 삭제된 학생인 경우 "삭제됨" 태그 표시 |
| 뒤로 가기 | 학생 목록으로 복귀 |

#### 삭제 확인 모달

```
┌─────────────────────────────────────┐
│ 학생 삭제                            │
├─────────────────────────────────────┤
│                                     │
│ 선택한 N명의 학생을 삭제합니다.       │
│                                     │
│ - 홍길동 (중1-1반)                   │
│ - 김철수 (중1-1반)                   │
│                                     │
│ ※ 출석 기록은 보존됩니다.            │
│ ※ "삭제된 학생" 필터에서 복구할 수    │
│   있습니다.                          │
│                                     │
├─────────────────────────────────────┤
│             [취소]  [삭제]           │
└─────────────────────────────────────┘
```

### 레이아웃 원칙

| 요소 | 정렬 | 비고 |
|------|------|------|
| 검색/삭제 필터 | 중앙 | 화면 중앙에 max-width 적용 |
| 학생 테이블 | 중앙 | 화면 중앙에 배치 |
| 액션 버튼 영역 | 중앙 | 테이블과 동일한 너비 |
| 페이지네이션 | 중앙 | 테이블 아래 중앙 정렬 |
| 학생 상세 컨텐츠 | 중앙 | 일관된 max-width 유지 |

### 디자인 개선 (로드맵 1단계)

| 항목 | 개선 내용 |
|------|----------|
| 테이블 스타일 | 깔끔한 행 구분선, 호버 효과, 선택 상태 하이라이트 |
| 버튼 스타일 | 일관된 버튼 크기/색상, 비활성화 상태 명확히 표시 |
| 간격/여백 | 적절한 padding/margin으로 시각적 여유 확보 |
| 인터랙션 | 클릭 가능한 영역 명확히 표시 (커서, 호버 효과) |
| 인라인 수정 | 필드 클릭 시 수정 모드 진입, 포커스 아웃 시 자동 저장 |
| 피드백 | 로딩 상태, 성공/실패 토스트 메시지 |
| 확인 다이얼로그 | 삭제 시 확인 모달 (실수 방지) |

### 권한별 차이

| 권한 | 접근 가능 기능 |
|------|---------------|
| 인증된 사용자 | 본인 계정 그룹의 학생 전체 CRUD |

## 페이지네이션 상태 유지 (로드맵 1단계)

> 상세 페이지에서 목록으로 복귀 시 이전 페이지 번호를 유지합니다.

### 현재 문제

- 페이지네이션 상태가 React 로컬 state(`useState`)에만 존재
- `navigate('/students')`로 복귀 시 컴포넌트가 다시 마운트되어 page=1로 리셋
- 브라우저 뒤로가기에서도 동일한 문제 발생

### 해결 방식: URL 쿼리 파라미터

페이지 번호를 URL 쿼리 파라미터(`?page=N`)로 동기화합니다.

**URL 형식:**
```
/students              → page=1 (기본값)
/students?page=3       → page=3
```

### 동작 규칙

| 상황 | URL 변화 | 페이지 |
|------|----------|--------|
| 목록 최초 진입 | `/students` | 1 (기본값) |
| 페이지 변경 | `/students?page=3` | 3 |
| 상세 → 목록 복귀 | `/students?page=3` (유지) | 3 |
| 브라우저 뒤로가기 | 이전 URL 복원 | 유지 |
| 검색/필터 변경 | `/students?page=1` | 1 (리셋) |
| 학생 추가 완료 | `/students` | 1 (리셋) |
| URL에 비정상 page | `/students` | 1 (기본값) |

### 구현 방향

1. **URL → State 동기화**: 컴포넌트 마운트 시 URL의 `page` 파라미터를 읽어 초기 페이지 설정
2. **State → URL 동기화**: 페이지 변경 시 URL 쿼리 파라미터 업데이트 (`replace` 모드로 히스토리 누적 방지)
3. **상세 페이지 이동**: `navigate(`/students/${id}`)` (현재 URL이 히스토리에 남음)
4. **목록 복귀**: `navigate(-1)` 또는 `navigate('/students?page=N')` → 이전 URL 복원

## 데이터/도메인 변경

### 엔티티/스키마

**Student 테이블**

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | bigint (PK) | 학생 고유 식별자 |
| society_name | varchar(50) | 이름 (필수) |
| catholic_name | varchar(50) | 세례명 |
| gender | varchar(1) | 성별 (M: 남, F: 여) |
| age | bigint | 나이 |
| contact | bigint | 연락처 |
| description | mediumtext | 상세 설명 |
| baptized_at | varchar(10) | 축일 |
| group_id | bigint (FK) | 소속 그룹 ID |
| create_at | datetime | 생성일시 |
| update_at | datetime | 수정일시 |
| delete_at | datetime | 삭제일시 (소프트 삭제) |
| graduated_at | datetime | 졸업일시 |

### 마이그레이션

- 변경 내용: 없음 (기존 스키마 유지)

## API/인터페이스

### tRPC 프로시저

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `student.list` | query | 학생 목록 조회 (페이지네이션, 검색, 삭제 필터) |
| `student.get` | query | 학생 상세 조회 |
| `student.create` | mutation | 학생 생성 |
| `student.update` | mutation | 학생 수정 (인라인 수정용) |
| `student.delete` | mutation | 학생 삭제 (소프트) |
| `student.bulkDelete` | mutation | 학생 일괄 삭제 (로드맵 1단계) |
| `student.restore` | mutation | 삭제된 학생 복구 (로드맵 1단계) |
| `student.graduate` | mutation | 그룹 이동 (진급/졸업) |

> **Note**: `student.graduate`는 학년별 그룹 이동 처리입니다. 나이 증가는 별도 스케줄러가 담당합니다.

### 레거시 REST (참고용)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/student` | 학생 목록 조회 (페이지네이션, 검색, 삭제 필터) |
| POST | `/api/student` | 학생 생성 |
| GET | `/api/student/:studentId` | 학생 상세 조회 |
| PUT | `/api/student/:studentId` | 학생 수정 |
| DELETE | `/api/student/:studentId` | 학생 삭제 (소프트) |
| DELETE | `/api/student/bulk` | 학생 일괄 삭제 (로드맵 1단계) |
| POST | `/api/student/restore` | 삭제된 학생 복구 (로드맵 1단계) |
| POST | `/api/student/graduation` | 졸업/진급 처리 |

### 요청/응답

**GET /api/student?searchOption=societyName&searchWord=홍&page=1**

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "page": 1,
    "size": 10,
    "totalPage": 3,
    "students": [
      {
        "_id": 1,
        "societyName": "홍길동",
        "catholicName": "베드로",
        "gender": "M",
        "age": 14,
        "contact": 1012345678,
        "description": "메모",
        "baptizedAt": "06-29",
        "groupId": 1
      }
    ]
  }
}
```

**POST /api/student**

요청:
```json
{
  "societyName": "김철수",
  "catholicName": "바오로",
  "gender": "M",
  "age": 13,
  "contact": 1098765432,
  "description": "",
  "baptizedAt": "01-25",
  "groupId": 1
}
```

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "student": { ... }
  }
}
```

**GET /api/student** (삭제 필터 - 로드맵 1단계)

- 파라미터 없음: 재학생만 (deletedAt=null) - 기본값
- `includeDeleted=true`: 전체 (삭제된 학생 포함)
- `onlyDeleted=true`: 삭제된 학생만

> **Note**: `status` 파라미터는 졸업 기능 용도로 예약됨

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "page": 1,
    "size": 10,
    "totalPage": 3,
    "students": [...]
  }
}
```

**DELETE /api/student/bulk** (일괄 삭제 - 로드맵 1단계)

요청:
```json
{
  "studentIds": [1, 2, 3]
}
```

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "deletedCount": 3,
    "students": [
      { "id": 1, "societyName": "홍길동", "deletedAt": "2026-01-22T10:00:00Z" },
      { "id": 2, "societyName": "김철수", "deletedAt": "2026-01-22T10:00:00Z" }
    ]
  }
}
```

**POST /api/student/restore** (삭제 복구 - 로드맵 1단계)

요청:
```json
{
  "studentIds": [1, 2]
}
```

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "restoredCount": 2
  }
}
```

**POST /api/student/graduation**

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "row": 15
  }
}
```

## 비즈니스 로직

### 학생 목록 조회/검색

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

### 삭제 필터 적용 (로드맵 1단계)

```
IF onlyDeleted == true THEN
  where.delete_at IS NOT NULL
ELSE IF includeDeleted == true THEN
  // delete_at 조건 없음 (전체)
ELSE
  where.delete_at = null (기본값: 재학생만)
```

### 학생 상세/생성/수정/삭제

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

### 학생 일괄 삭제 (로드맵 1단계)

```
IF studentIds is empty array THEN
  throw BAD_REQUEST("studentIds is required")
existingStudents = StudentRepository.findByIds(studentIds, delete_at is null)
FOR EACH student IN existingStudents
  set delete_at = now
deletedCount = existingStudents.length
return { deletedCount, students with id, societyName, deletedAt }
```

### 삭제된 학생 복구 (로드맵 1단계)

```
IF studentIds is empty array THEN
  throw BAD_REQUEST("studentIds is required")
existingStudents = StudentRepository.findByIds(studentIds, delete_at IS NOT NULL)
FOR EACH student IN existingStudents
  set delete_at = null
restoredCount = existingStudents.length
return { restoredCount }
```

### 진급 처리 (student.promote)

```
IF accountName == "초등부" THEN
  map group names: 유치부->1학년->2학년->3학년->4학년->5학년->6학년->예비 중1
  move students in each group to next group (age >= 8 only)
ELSE IF accountName == "중고등부" THEN
  move age 19 -> 고3, age 20 -> 성인
ELSE
  return 0
```

### 연례 나이 증가

```
매년 1월 1일 00:00에
UPDATE student SET age = age + 1
```

### 졸업 처리 (로드맵 1단계)

```
입력: { ids: string[], accountId: string }
1. 트랜잭션 시작
2. 대상 학생 조회
   조건: id IN ids AND graduatedAt IS NULL AND deletedAt IS NULL AND group.accountId = accountId
3. FOR EACH student
     SET graduatedAt = 현재시간(KST)
4. 결과 반환: { graduatedCount }
```

### 졸업 취소 (로드맵 1단계)

```
입력: { ids: string[], accountId: string }
1. 트랜잭션 시작
2. 대상 학생 조회
   조건: id IN ids AND graduatedAt IS NOT NULL AND deletedAt IS NULL AND group.accountId = accountId
3. FOR EACH student
     SET graduatedAt = NULL
4. 결과 반환: { cancelledCount }
```

## 권한/보안

- **접근 제어**:
  - 모든 학생 API: Bearer 토큰 필수
  - 학생 목록은 계정 소속 그룹으로 필터링
- **감사/로그**:
  - 학생 CRUD 로깅
  - 졸업/진급 처리 로깅

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 잘못된 studentId | 400 BAD_REQUEST 반환 |
| 존재하지 않는 학생 | 404 NOT_FOUND 반환 |
| 검색 옵션이 유효하지 않음 | 필터 무시, 전체 조회 |
| 검색어 비어 있음 | 해당 필터 무시 |
| page 누락/비정상 | 1로 기본값 처리 |
| 졸업/진급 대상 없음 | row=0 반환 |
| 토큰 누락 | 401 UNAUTHORIZED 반환 |
| 일괄 삭제 시 빈 배열 | 400 BAD_REQUEST 반환 (로드맵 1단계) |
| 일괄 삭제 시 일부 학생 없음 | 존재하는 학생만 삭제, 결과에 deletedCount 반환 (로드맵 1단계) |
| 이미 삭제된 학생 재삭제 | 화면에 안 보임 (불가능) (로드맵 1단계) |
| 복구 시 빈 배열 | 400 BAD_REQUEST 반환 (로드맵 1단계) |
| 인라인 수정 시 필수 필드 누락 | 400 BAD_REQUEST 반환 |

## 성능/제약

- 예상 트래픽: 계정당 학생 수 수십~수백 명
- 제약 사항:
  - 페이지당 10명 고정
  - 검색 옵션: societyName, catholicName, baptizedAt
  - 일괄 처리: 최대 100명 (로드맵 1단계)
  - 트랜잭션: 전체 성공 또는 전체 실패 (로드맵 1단계)

## 측정/모니터링

- **이벤트**:
  - 학생 CRUD
  - 그룹 이동 처리 (`student.graduate` - 수동 호출)
  - 나이 증가 스케줄러 (`Scheduler.studentAge` - 매년 1월 1일 자동)
- **알림/경보**:
  - 없음 (현재 스코프)

## 스케줄러 vs graduate API

| 기능 | 역할 | 트리거 | 대상 |
|------|------|--------|------|
| **스케줄러** (`Scheduler.studentAge`) | 모든 학생 나이 +1 | 매년 1월 1일 자동 | 전체 학생 |
| **graduate API** (`student.graduate`) | 학년별 그룹 이동 | 수동 호출 | 초등부: 학년 진급, 6학년→예비중1 / 중고등부: 20세→성인 |

> **Note**: 스케줄러는 나이만 증가시키고, 실제 그룹 이동(진급/졸업)은 교사가 graduate API를 호출해야 합니다.

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 학생 목록 조회 → page, size, totalPage, students 반환
2. **TC-2**: 검색 조건 적용 → 필터링된 학생 목록 반환
3. **TC-3**: 학생 생성/수정/삭제 → 처리된 학생 정보 반환
4. **TC-4**: 졸업/진급 처리 → row 수 반환
5. **TC-5** (로드맵 1단계): 삭제 필터 적용 (includeDeleted/onlyDeleted)
6. **TC-6** (로드맵 1단계): 학생 일괄 삭제 → deletedCount 반환
7. **TC-7** (로드맵 1단계): 삭제된 학생 복구 → restoredCount 반환
8. **TC-8** (로드맵 1단계): 삭제된 학생의 출석 기록 조회 가능

### 예외 케이스

1. **TC-E1**: 잘못된 studentId → 400 반환
2. **TC-E2**: 존재하지 않는 학생 조회 → 404 반환
3. **TC-E3**: 토큰 없이 API 호출 → 401 반환
4. **TC-E4** (로드맵 1단계): 일괄 삭제 빈 배열 → 400 반환
5. **TC-E5** (로드맵 1단계): 복구 빈 배열 → 400 반환

### UI 테스트 시나리오 (로드맵 1단계)

1. **TC-UI-1**: 학생 행 클릭 → 상세 페이지로 이동
2. **TC-UI-2**: 인라인 수정 → 포커스 아웃 시 자동 저장
3. **TC-UI-3**: 다중 선택 체크박스 → 선택된 학생 수 표시
4. **TC-UI-4**: 삭제 버튼 → 선택된 학생이 없으면 비활성화
5. **TC-UI-5**: 삭제 확인 모달 → 확인/취소 동작
6. **TC-UI-6**: 삭제 필터 변경 → 목록 갱신
7. **TC-UI-7**: 호버 효과 → 행에 마우스 올리면 하이라이트
8. **TC-UI-8**: 3페이지에서 학생 상세 이동 → 목록 복귀 시 3페이지 유지
9. **TC-UI-9**: 3페이지에서 브라우저 뒤로가기 → 3페이지 유지
10. **TC-UI-10**: 검색/필터 변경 → 1페이지로 리셋
11. **TC-UI-11**: URL에 `?page=abc` 입력 → 1페이지로 기본값 처리

## 의사결정 (로드맵 1단계)

| 항목 | 결정 | 비고 |
|------|------|------|
| 삭제 대상 | 재학생만 | 삭제된 학생 필터에서는 복구만 가능 |
| 삭제 방식 | 소프트 삭제 | deletedAt 필드 |
| 출석 데이터 | 절대 삭제 안 함 | 프로젝트 핵심 |
| 복구 기능 | 지원 | 삭제된 학생 필터에서 복구 |

---

## 엑셀 Import (로드맵 1단계)

> 로드맵 1단계 "온보딩 자동화" 중 엑셀 Import 기능

### 배경

**현재 문제점**
1. 학생 개별 등록: 한 명씩 수동 입력해야 함
2. 온보딩 병목: 초기 학생 명단 등록에 많은 시간 소요
3. 기존 엑셀 데이터: 대부분의 본당이 이미 엑셀로 학생 명단 관리 중

**목표 상태**
- 엑셀 파일(.xlsx, .xls)을 업로드하여 **학생 일괄 등록**
- 템플릿 제공으로 **데이터 형식 표준화**
- 업로드 전 **미리보기 및 검증**

### 사용자 플로우 (엑셀 Import)

1. 사용자가 학생 명단 화면에서 "엑셀 업로드" 버튼 클릭
2. 템플릿 다운로드 또는 파일 선택
3. 파일 업로드 후 미리보기 표시
4. 데이터 검증 결과 확인 (오류 행 표시)
5. 확인 후 일괄 등록 실행
6. 결과 (성공/실패 건수) 표시

### 상태 전이 (엑셀 Import)

```
[대기] → (파일 선택) → [파일 로드]
[파일 로드] → (파싱 완료) → [미리보기]
[미리보기] → (검증 오류) → [오류 표시] → (수정) → [미리보기]
[미리보기] → (확인) → [등록 중]
[등록 중] → (완료) → [결과 표시] → [대기]
```

### 엑셀 Import UI

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 학생 목록 | 기존 화면 | "엑셀 업로드" 버튼 추가 |
| 업로드 모달 | 파일 업로드 UI | 파일 선택, 템플릿 다운로드 링크 |
| 미리보기 | 업로드 데이터 확인 | 테이블, 오류 행 하이라이트 |
| 결과 | 등록 결과 | 성공/실패 건수, 오류 상세 |

### 템플릿 형식

| 열 | 헤더명 | 필수 | 색상 | 예시 |
|-----|--------|------|------|------|
| A | 이름 | O | 노란색 | 홍길동 |
| B | 세례명 | X | 없음 | 베드로 |
| C | 성별 | X | 없음 | 남 또는 여 |
| D | 나이 | X | 없음 | 14 |
| E | 연락처 | X | 없음 | 01012345678 |
| F | 축일 | X | 없음 | 06-29 |
| G | 그룹명 | O | 노란색 | 중1-1반 |
| H | 메모 | X | 없음 | 특이사항 |

**템플릿 규칙**
- 1행: 헤더 (컬럼명)
- 필수값: 노란색 배경
- 선택값: 배경색 없음
- 2행부터: 데이터 입력

### 엑셀 Import API

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `student.importPreview` | mutation | 엑셀 파싱 + 검증 (등록 전 미리보기) |
| `student.importExecute` | mutation | 검증된 데이터 일괄 등록 |
| `student.importTemplate` | query | 템플릿 파일 다운로드 URL |

**student.importPreview({ file: FormData })**

```json
{
  "valid": true,
  "totalRows": 25,
  "validRows": 23,
  "errorRows": 2,
  "preview": [
    { "row": 1, "societyName": "홍길동", "groupName": "중1-1반", "valid": true },
    { "row": 2, "societyName": "", "groupName": "중1-1반", "valid": false, "error": "이름 필수" }
  ],
  "errors": [
    { "row": 2, "field": "societyName", "message": "이름은 필수입니다" }
  ]
}
```

**student.importExecute({ sessionId: string })**

```json
{
  "success": true,
  "created": 23,
  "failed": 2,
  "failedDetails": [
    { "row": 2, "error": "이름 필수" }
  ]
}
```

### 엑셀 Import 예외 케이스

| 상황 | 처리 방법 |
|------|----------|
| 잘못된 파일 형식 | 오류 메시지 + 업로드 거부 |
| 필수 필드 누락 | 해당 행 오류 표시, 부분 등록 가능 |
| 존재하지 않는 그룹명 | 오류 표시 (미리 그룹 등록 필요) |
| 중복 학생 (이름만 같음) | 허용 (동명이인) |
| 중복 학생 (이름+세례명 같음) | 경고 표시 후 등록 가능 |
| 파일 크기 초과 | 오류 메시지 + 업로드 거부 |

### 엑셀 Import 제약

- 파일 크기: 최대 5MB
- 행 수: 최대 1000행
- 처리 시간: 대용량 시 비동기 처리 고려

### 엑셀 Import 의사결정 (확정)

| 항목 | 결정 | 비고 |
|------|------|------|
| 존재하지 않는 그룹 | 오류 표시 | 미리 그룹 등록 필요 |
| 중복 학생 (이름만 같음) | 허용 | 동명이인 가능 |
| 중복 학생 (이름+세례명 같음) | 경고 표시 | "이미 등록한 학생일 수 있습니다" |

---

## 졸업 처리 상세 (로드맵 1단계)

> 졸업 처리 API 레벨 상세 및 예외 케이스

### 기존 프로시저 이름 변경

> **Breaking Change**: 기존 `student.graduate` (그룹 이동/진급)를 `student.promote`로 변경합니다.

| 기존 이름 | 신규 이름 | 설명 |
|-----------|-----------|------|
| `student.graduate` | `student.promote` | 그룹 이동 (진급) - 기존 기능 |

**변경 이유**: "graduate"가 의미상 "졸업 처리"에 더 적합하며, 기존 기능은 실제로 "진급(promote)" 또는 "그룹 이동"에 해당합니다.

### 졸업 처리 API 레벨 예외

| 상황 | 처리 방법 | 응답 코드 |
|------|----------|----------|
| 빈 studentIds 배열 | 에러 반환 | 400 BAD_REQUEST |
| 존재하지 않는 학생 ID | 존재하는 학생만 처리, 결과에 처리된 수 반환 | 200 (부분 성공) |
| 다른 계정의 학생 ID 포함 | 본인 계정 학생만 처리, 타 계정 학생 무시 | 200 (부분 성공) |
| 토큰 누락/만료 | 인증 에러 | 401 UNAUTHORIZED |
| 100명 초과 요청 | 에러 반환 | 400 BAD_REQUEST |
| 이미 졸업한 학생 재졸업 요청 | 무시 (처리 수에서 제외) | 200 |
| 재학생 졸업 취소 요청 | 무시 (처리 수에서 제외) | 200 |

### 졸업 처리 제약

| 항목 | 제약 | 초과 시 처리 |
|------|------|-------------|
| 일괄 처리 | 최대 100명 | 400 BAD_REQUEST 반환 ("최대 100명까지 처리 가능합니다") |
| 트랜잭션 | 전체 성공 또는 전체 실패 | 실패 시 롤백, 에러 메시지 반환 |

> **Note**: 100명 초과 시 잘림(truncation) 없이 에러를 반환합니다. 클라이언트에서 100명 단위로 분할 요청해야 합니다.

### 졸업 처리 의사결정 (확정)

| 항목 | 결정 | 비고 |
|------|------|------|
| 졸업 처리 방식 | 상태 변경 (데이터 보존) | 삭제 아님 |
| 졸업생 표시 | 기본 숨김 + 필터로 조회 | |
| 데이터 이관 | 후순위 (3단계) | 다른 계정으로 전달 |
| 졸업 시점 | 수동 (주일학교마다 다름) | |

---

**작성일**: 2026-01-13
**수정일**: 2026-02-08 (페이지네이션 상태 유지 구현 완료)
**작성자**: PM 에이전트
**상태**: Approved

> **Note**: 기존 구현 완료된 기능은 Approved 상태이며, 엑셀 Import는 미구현 상태입니다.
