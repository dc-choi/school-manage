# 기능 설계: 그룹 관리

> PM 에이전트가 작성하는 기능 설계 문서입니다.
> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`

## 흐름/상태

### 사용자 플로우

**기본 플로우:**
1. 사용자가 로그인 후 그룹 목록 화면 진입
2. 계정에 속한 그룹 목록 조회
3. 그룹 추가 또는 특정 그룹 선택
4. 그룹 선택 시 해당 그룹의 상세 페이지로 이동

**상세 페이지 플로우 (로드맵 1단계):**
1. 그룹 상세 페이지에서 그룹 정보 확인
2. 그룹명 인라인 수정 가능
3. 소속 학생 목록 조회
4. 출석 현황 화면으로 이동
5. 그룹 목록으로 복귀 → **이전 페이지 번호 유지** (페이지네이션 도입 시)

**일괄 삭제 플로우 (로드맵 1단계):**
1. 그룹 목록에서 다중 선택 체크박스 활성화
2. 삭제할 그룹 선택
3. 일괄 삭제 버튼 클릭
4. 확인 후 소프트 삭제 처리

### 상태 전이

```
[그룹 목록] → (그룹 클릭) → [그룹 상세]
[그룹 상세] → (학생 목록 조회) → [그룹 상세 + 학생 목록]
[그룹 상세] → (인라인 수정) → [그룹 수정 완료] → [그룹 상세]
[그룹 상세] → (출석 현황) → [출석 현황 화면]
[그룹 목록] → (그룹 추가) → [그룹 생성 완료] → [그룹 목록]
[그룹 목록] → (다중 선택 + 일괄 삭제) → [그룹 소프트 삭제] → [그룹 목록]
```

## UI/UX (해당 시)

### 화면/컴포넌트

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 그룹 목록 | 계정의 모든 그룹 표시 | 그룹 테이블, 추가 버튼, 다중 선택 체크박스, 일괄 삭제 버튼 |
| 그룹 상세 | 그룹 정보 및 소속 학생 | 그룹명 (인라인 수정), 학생 목록 테이블, 출석 현황 링크 |
| 그룹 추가 | 신규 그룹 생성 | 그룹명 입력란, 저장 버튼 |

### 화면별 상세 (로드맵 1단계)

#### 그룹 목록 화면

| 요소 | 설명 |
|------|------|
| 테이블 헤더 | 선택 체크박스, 그룹명, 학생 수, 생성일 |
| 테이블 행 | 클릭 시 상세 페이지 이동 (전체 행이 클릭 영역) |
| 다중 선택 | 헤더의 전체 선택 체크박스, 각 행의 개별 체크박스 |
| 일괄 삭제 버튼 | 선택된 그룹이 있을 때만 활성화 |
| 추가 버튼 | 신규 그룹 생성 |

#### 그룹 상세 화면

| 요소 | 설명 |
|------|------|
| 그룹명 | 인라인 수정 가능 (클릭 또는 편집 아이콘으로 수정 모드 진입) |
| 학생 목록 | 소속 학생 테이블 (이름, 세례명, 나이 등) |
| 출석 현황 버튼 | 출석 현황 페이지로 이동 |
| 뒤로 가기 | 그룹 목록으로 복귀 |

### 레이아웃 원칙

| 요소 | 정렬 | 비고 |
|------|------|------|
| 그룹 테이블 | 중앙 | 화면 중앙에 max-width 적용 |
| 액션 버튼 영역 | 중앙 | 테이블과 동일한 너비 |
| 그룹 상세 컨텐츠 | 중앙 | 일관된 max-width 유지 |
| 학생 테이블 | 중앙 | 상세 화면 내 중앙 배치 |

### 디자인 개선 (로드맵 1단계)

| 항목 | 개선 내용 |
|------|----------|
| 테이블 스타일 | 깔끔한 행 구분선, 호버 효과, 선택 상태 하이라이트 |
| 버튼 스타일 | 일관된 버튼 크기/색상, 비활성화 상태 명확히 표시 |
| 간격/여백 | 적절한 padding/margin으로 시각적 여유 확보 |
| 인터랙션 | 클릭 가능한 영역 명확히 표시 (커서, 호버 효과) |
| 피드백 | 로딩 상태, 성공/실패 토스트 메시지 |
| 확인 다이얼로그 | 삭제 시 확인 모달 (실수 방지) |

### 권한별 차이

| 권한 | 접근 가능 기능 |
|------|---------------|
| 인증된 사용자 | 본인 계정의 그룹 전체 CRUD |

## 페이지네이션 상태 유지 (로드맵 1단계)

> 현재 그룹 목록은 전체 로드 방식(페이지네이션 없음)입니다.
> 계정당 그룹 수가 10개 이내로 페이지네이션이 불필요하지만, 향후 페이지네이션 도입 시 학생 관리와 동일한 URL 쿼리 파라미터 패턴을 적용합니다.

### 현재 상태

- 그룹 목록: 전체 로드 (`trpc.group.list.useQuery()`)
- 페이지네이션 없음 → 상세 복귀 시 상태 유실 문제 미해당

### 향후 방향

- 그룹 수 증가 시 페이지네이션 도입
- 도입 시 학생 관리와 동일한 URL 쿼리 파라미터 패턴 적용 (`/groups?page=N`)

## 데이터/도메인 변경

### 엔티티/스키마

**Group 테이블**

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | bigint (PK) | 그룹 고유 식별자 |
| name | varchar(50) | 그룹명 (예: 중1-1반) |
| account_id | bigint (FK) | 소속 계정 ID |
| create_at | datetime | 생성일시 |
| update_at | datetime | 수정일시 |
| delete_at | datetime | 삭제일시 (소프트 삭제) |

### 마이그레이션

- 변경 내용: 없음 (기존 스키마 유지)

## API/인터페이스

### tRPC 프로시저

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `group.list` | query | 그룹 목록 조회 |
| `group.get` | query | 그룹 상세 조회 (학생 목록 포함) |
| `group.create` | mutation | 그룹 생성 |
| `group.update` | mutation | 그룹 수정 (인라인 수정용) |
| `group.delete` | mutation | 그룹 삭제 (소프트) |
| `group.bulkDelete` | mutation | 그룹 일괄 삭제 (로드맵 1단계) |
| `group.attendance` | query | 그룹 출석 현황 조회 |

### 레거시 REST (참고용)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/group` | 그룹 목록 조회 |
| POST | `/api/group` | 그룹 생성 |
| GET | `/api/group/:groupId` | 그룹 상세 조회 (학생 목록 포함) |
| PUT | `/api/group/:groupId` | 그룹 수정 |
| DELETE | `/api/group/:groupId` | 그룹 삭제 (소프트) |
| DELETE | `/api/group/bulk` | 그룹 일괄 삭제 (로드맵 1단계) |
| GET | `/api/group/:groupId/attendance` | 그룹 출석 현황 조회 |

### 요청/응답

**GET /api/group**

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "groups": [
      { "_id": 1, "name": "중1-1반", "accountId": 1 },
      { "_id": 2, "name": "중1-2반", "accountId": 1 }
    ]
  }
}
```

**POST /api/group**

요청:
```json
{
  "name": "중1-3반"
}
```

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "group": { "_id": 3, "name": "중1-3반", "accountId": 1 }
  }
}
```

**GET /api/group/:groupId** (상세 조회 - 학생 목록 포함)

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "group": {
      "_id": 1,
      "name": "중1-1반",
      "accountId": 1,
      "studentCount": 5
    },
    "students": [
      { "_id": 1, "societyName": "홍길동", "catholicName": "베드로", "age": 14 },
      { "_id": 2, "societyName": "김철수", "catholicName": "바오로", "age": 14 }
    ]
  }
}
```

**DELETE /api/group/bulk** (일괄 삭제 - 로드맵 1단계)

요청:
```json
{
  "groupIds": [1, 2, 3]
}
```

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "deletedCount": 3
  }
}
```

**GET /api/group/:groupId/attendance?year=2026**

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "year": 2026,
    "sunday": [[1, 5], [1, 12], ...],
    "saturday": [[1, 4], [1, 11], ...],
    "students": [
      { "_id": 1, "societyName": "홍길동", "groupId": 1, ... }
    ],
    "attendances": [
      { "_id": 1, "studentId": 1, "date": "20260105", "content": "O" }
    ]
  }
}
```

## 비즈니스 로직

### 그룹 목록

```
accountId = token.account.id
groups = GroupRepository.findAll(accountId, delete_at is null)
return groups
```

### 그룹 상세 조회

```
IF groupId is not a positive number THEN
  throw BAD_REQUEST("groupId is wrong")
Fetch group by groupId where delete_at is null
IF not found THEN throw NOT_FOUND
return group
```

### 그룹 생성/수정/삭제

```
create:
  insert { name, account_id }
modify:
  update { name, account_id } by groupId
remove:
  set delete_at = now by groupId
```

### 그룹 출석 현황 조회

```
IF groupId is not a positive number THEN
  throw BAD_REQUEST
IF year is invalid THEN year = currentYear
sunday/saturday = getYearDate(year)
students = StudentRepository.findAll(groupId)
attendance = AttendanceRepository.findAll(student_id in students)
return { year, sunday, saturday, students, attendance }
```

### 그룹 상세 조회 - 학생 목록 포함 (로드맵 1단계)

```
IF groupId is not a positive number THEN
  throw BAD_REQUEST("groupId is wrong")
Fetch group by groupId where delete_at is null
IF not found THEN throw NOT_FOUND
students = StudentRepository.findAll(groupId, delete_at is null)
studentCount = students.length
return { group with studentCount, students }
```

### 그룹 일괄 삭제 (로드맵 1단계)

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

## 권한/보안

- **접근 제어**:
  - 모든 그룹 API: Bearer 토큰 필수
  - 현재: 계정 소유권 검증 미구현 → TARGET 등록됨 (`auth-ownership-validation`)
- **감사/로그**:
  - 그룹 생성/수정/삭제 로깅

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 잘못된 groupId (문자열 등) | 400 BAD_REQUEST 반환 |
| 존재하지 않는 그룹 조회 | 404 NOT_FOUND 반환 |
| 그룹명 누락 | DB 에러 또는 400 반환 |
| year 누락/비정상 | 현재 연도로 대체 처리 |
| 토큰 누락 | 401 UNAUTHORIZED 반환 |
| 일괄 삭제 시 빈 배열 | 400 BAD_REQUEST 반환 (로드맵 1단계) |
| 일괄 삭제 시 일부 그룹 없음 | 존재하는 그룹만 삭제, 결과에 deletedCount 반환 (로드맵 1단계) |
| 인라인 수정 시 빈 그룹명 | 400 BAD_REQUEST 반환 |

## 성능/제약

- 예상 트래픽: 계정당 그룹 수 10개 이내
- 제약 사항:
  - 그룹 삭제는 소프트 삭제 (delete_at 설정)
  - 삭제된 그룹은 목록에서 제외됨

## 측정/모니터링

- **이벤트**:
  - 그룹 CRUD 작업
  - 출석 현황 조회
- **알림/경보**:
  - 없음 (현재 스코프)

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 그룹 목록 조회 → account, groups 배열 반환
2. **TC-2**: 그룹 생성 → 생성된 그룹 정보 반환
3. **TC-3**: 그룹 수정 → 수정된 그룹 정보 반환
4. **TC-4**: 그룹 삭제 → 삭제 완료 후 목록에서 제외
5. **TC-5**: 그룹 출석 현황 조회 → year, sunday, saturday, students, attendances 반환
6. **TC-6** (로드맵 1단계): 그룹 상세 조회 → 그룹 정보 + 학생 목록 반환
7. **TC-7** (로드맵 1단계): 그룹 일괄 삭제 → deletedCount 반환, 목록에서 제외

### 예외 케이스

1. **TC-E1**: 잘못된 groupId → 400 반환
2. **TC-E2**: 존재하지 않는 그룹 조회 → 404 반환
3. **TC-E3**: 토큰 없이 API 호출 → 401 반환
4. **TC-E4** (로드맵 1단계): 일괄 삭제 빈 배열 → 400 반환
5. **TC-E5** (로드맵 1단계): 인라인 수정 빈 그룹명 → 400 반환

### UI 테스트 시나리오 (로드맵 1단계)

1. **TC-UI-1**: 그룹 행 클릭 → 상세 페이지로 이동
2. **TC-UI-2**: 그룹명 인라인 수정 → 수정 완료 후 반영
3. **TC-UI-3**: 다중 선택 체크박스 → 선택된 그룹 수 표시
4. **TC-UI-4**: 일괄 삭제 버튼 → 선택된 그룹이 없으면 비활성화
5. **TC-UI-5**: 삭제 확인 모달 → 확인/취소 동작
6. **TC-UI-6**: 호버 효과 → 행에 마우스 올리면 하이라이트

---

**작성일**: 2026-01-13
**수정일**: 2026-02-08 (페이지네이션 상태 유지 구현 완료)
**작성자**: PM 에이전트
**상태**: Approved

> **Note**: 기존 구현 완료된 기능은 Approved 상태이며, 로드맵 1단계로 표시된 항목은 신규 개발 필요.
