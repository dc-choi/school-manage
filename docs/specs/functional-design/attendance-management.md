# 기능 설계: 출석 관리

> PM 에이전트가 작성하는 기능 설계 문서입니다.
> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- 사업 문서: `docs/business/6_roadmap/roadmap.md`
- 피드백: `docs/business/0_feedback/feedback.md`


## 기능 범위

| 기능 | 설명 | 상태 |
|------|------|------|
| 기본 출석 관리 | 테이블 뷰, 일괄 저장 | 구현 완료 |
| 자동 저장 (로드맵 1단계) | 셀 변경 즉시 저장 | 구현 완료 |
| 달력 UI (로드맵 1단계) | 달력 형태, 모달 입력, 의무축일 표시 | 구현 완료 |

## 흐름/상태

### 사용자 플로우

1. 사용자가 그룹을 선택하여 출석 현황 화면 진입
2. 연도별 출석 캘린더(토요일/일요일)와 학생별 출석 현황 조회
3. 해당 날짜의 출석 상태 입력 (◎/○/△ 등)
4. 일괄 저장으로 변경 사항 반영
5. 필요시 출석 데이터 삭제

### 상태 전이

```
[출석 조회] → (출석 입력) → [입력 대기]
[입력 대기] → (저장) → [출석 저장 완료] → [출석 조회]
[출석 조회] → (출석 삭제) → [삭제 완료] → [출석 조회]
```

## UI/UX (해당 시)

### 화면/컴포넌트

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 출석 현황 | 그룹별 출석 테이블 | 연도 선택, 학생 목록 (세로), 날짜 (가로), 출석 입력 셀 |
| 출석 입력 셀 | 개별 출석 상태 입력 | 드롭다운 또는 텍스트 (◎/○/△) |

### 레이아웃 원칙

| 요소 | 정렬 | 비고 |
|------|------|------|
| 필터 영역 (그룹/연도) | 중앙 | 화면 중앙에 배치 |
| 저장 버튼 | 중앙 | 필터와 함께 중앙 정렬 |
| 출석 테이블 카드 | 중앙 | 화면 중앙에 배치 |
| 빈 상태 메시지 | 중앙 | 화면 중앙에 표시 |

### 권한별 차이

| 권한 | 접근 가능 기능 |
|------|---------------|
| 인증된 사용자 | 본인 계정 그룹의 출석 조회/입력/삭제 |

## 데이터/도메인 변경

### 엔티티/스키마

**Attendance 테이블**

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | bigint (PK) | 출석 고유 식별자 |
| date | varchar(50) | 출석일 (YYYYMMDD 형식) |
| content | varchar(50) | 출석 내용 (◎/○/△ 등) |
| student_id | bigint (FK) | 학생 ID |
| create_at | datetime | 생성일시 |
| update_at | datetime | 수정일시 |
| delete_at | datetime | 삭제일시 |

### 마이그레이션

- 변경 내용: 없음 (기존 스키마 유지)

## API/인터페이스

### tRPC 프로시저

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `group.attendance` | query | 그룹 출석 현황 조회 (테이블 뷰용) |
| `attendance.update` | mutation | 출석 일괄 입력/삭제 |
| `attendance.calendar` | query | 월별 달력 데이터 (출석 현황 + 의무축일) |
| `attendance.dayDetail` | query | 날짜별 출석 상세 (모달용) |

> **Note**: `attendance.calendar`, `attendance.dayDetail`은 달력 UI 기능 (로드맵 1단계)으로 추가됨. 상세: "달력 UI (로드맵 1단계)" 섹션 참조

### 레거시 REST (참고용)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/group/:groupId/attendance` | 그룹 출석 현황 조회 |
| POST | `/api/attendance` | 출석 일괄 입력/삭제 |

### 요청/응답

**GET /api/group/:groupId/attendance?year=2026**

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "year": 2026,
    "sunday": [[1, 5], [1, 12], [1, 19], [1, 26], ...],
    "saturday": [[1, 4], [1, 11], [1, 18], [1, 25], ...],
    "students": [
      {
        "_id": 1,
        "societyName": "홍길동",
        "catholicName": "베드로",
        "groupId": 1
      }
    ],
    "attendances": [
      {
        "_id": 1,
        "studentId": 1,
        "date": "20260105",
        "content": "◎"
      }
    ]
  }
}
```

**POST /api/attendance (입력: isFull=true)**

요청:
```json
{
  "year": 2026,
  "attendance": [
    { "_id": 1, "month": 1, "day": 5, "data": "◎" },
    { "_id": 1, "month": 1, "day": 12, "data": "○" },
    { "_id": 2, "month": 1, "day": 5, "data": "△" }
  ],
  "isFull": true
}
```

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "row": 3,
    "isFull": true
  }
}
```

**POST /api/attendance (삭제: isFull=false)**

요청:
```json
{
  "year": 2026,
  "attendance": [
    { "_id": 1, "month": 1, "day": 5, "data": "" }
  ],
  "isFull": false
}
```

응답:
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "account": "계정명",
    "row": 1,
    "isFull": false
  }
}
```

## 비즈니스 로직

### 출석 조회

```
IF groupId is not a positive number THEN
  throw BAD_REQUEST
IF year is invalid THEN year = currentYear
sunday/saturday = getYearDate(year)
students = StudentRepository.findAll(groupId)
attendances = AttendanceRepository.findAll(student_id in students)
return { year, sunday, saturday, students, attendances }
```

### 출석 입력 (isFull=true)

```
FOR EACH item in attendance
  date = YYYYMMDD from (year, month, day)
  existing = AttendanceRepository.get(studentId, date)
  IF existing is null THEN create
  ELSE update content
return number of created/updated rows
```

### 출석 삭제 (isFull=false)

```
FOR EACH item in attendance
  date = YYYYMMDD from (year, month, day)
  existing = AttendanceRepository.get(studentId, date)
  IF existing is not null THEN delete
return number of deleted rows
```

### 부활 대축일 계산 (Anonymous Gregorian Algorithm)

```
FUNCTION calculateEaster(year)
  a = year % 19
  b = year / 100 (정수 나눗셈)
  c = year % 100
  d = b / 4 (정수 나눗셈)
  e = b % 4
  f = (b + 8) / 25 (정수 나눗셈)
  g = (b - f + 1) / 3 (정수 나눗셈)
  h = (19 * a + b - d - g + 15) % 30
  i = c / 4 (정수 나눗셈)
  k = c % 4
  l = (32 + 2 * e + 2 * i - h - k) % 7
  m = (a + 11 * h + 22 * l) / 451 (정수 나눗셈)
  month = (h + l - 7 * m + 114) / 31 (정수 나눗셈)
  day = ((h + l - 7 * m + 114) % 31) + 1
  RETURN date(year, month, day)
```

### 달력 데이터 조회 (로드맵 1단계)

```
FUNCTION getCalendarData(year, month, groupId, accountId)
  group = findGroupByIdAndAccountId(groupId, accountId)
  IF group == null THEN THROW FORBIDDEN
  days = generateMonthDays(year, month)
  holydays = getHolydaysForMonth(year, month)
  attendanceData = getMonthlyAttendance(year, month, groupId)
  totalStudents = countStudentsByGroupId(groupId)
  FOR EACH day IN days
    dayData = {
      date, dayOfWeek,
      attendance: { present: attendanceData[day.date]?.count ?? 0, total: totalStudents },
      holyday: holydays[day.date] ?? null
    }
  RETURN { year, month, totalStudents, days }
```

### 출석 상태 계산 (로드맵 1단계)

```
FUNCTION calculateStatus(mass, catechism)
  IF mass AND catechism THEN RETURN "◎"
  ELSE IF mass AND NOT catechism THEN RETURN "○"
  ELSE IF NOT mass AND catechism THEN RETURN "△"
  ELSE RETURN "-"
```

## 권한/보안

- **접근 제어**:
  - 모든 출석 API: Bearer 토큰 필수
- **감사/로그**:
  - 출석 입력/삭제 로깅

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 잘못된 groupId | 400 BAD_REQUEST 반환 |
| attendance 배열 누락/비어 있음 | 400 BAD_REQUEST 반환 |
| isFull 누락 | 400 BAD_REQUEST 반환 |
| year 누락/비정상 | 현재 연도로 대체 |
| 토큰 누락 | 401 UNAUTHORIZED 반환 |

## 성능/제약

- 예상 트래픽: 그룹당 학생 수십 명 × 연간 50~100회 출석
- 제약 사항:
  - 일괄 처리로 다수의 출석 레코드 동시 처리

## 삭제 정책 (의도된 설계)

| 엔티티 | 삭제 방식 | 이유 |
|--------|----------|------|
| Group | 소프트 삭제 | 이력 보존, 복구 가능 |
| Student | 소프트 삭제 | 이력 보존, 복구 가능 |
| **Attendance** | **물리 삭제** | 개별 레코드 복구 필요성 낮음 |

> **Note**: 출석 데이터는 학생/그룹과 달리 개별 레코드 단위의 복구 필요성이 낮고, 학생 삭제 시 관련 출석도 함께 정리되는 것이 자연스러우므로 물리 삭제를 사용합니다.

## 측정/모니터링

- **이벤트**:
  - 출석 조회
  - 출석 일괄 입력
  - 출석 일괄 삭제
- **알림/경보**:
  - 없음 (현재 스코프)

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 그룹 출석 조회 → year, sunday, saturday, students, attendances 반환
2. **TC-2**: 출석 일괄 입력 (isFull=true) → row 수 반환
3. **TC-3**: 출석 일괄 삭제 (isFull=false) → row 수 반환

### 예외 케이스

1. **TC-E1**: attendance 배열 누락 → 400 반환
2. **TC-E2**: isFull 누락 → 400 반환
3. **TC-E3**: 토큰 없이 API 호출 → 401 반환

---

## 자동 저장 (로드맵 1단계)

> 로드맵 1단계 "출석부 UX 개선" 중 자동 저장 기능

### 배경

**현재 문제점**
1. 수동 저장 버튼 클릭 필요: 변경 후 반드시 "저장" 버튼을 눌러야 함
2. 저장 누락 위험: 저장 안 하고 페이지 이탈 시 데이터 손실
3. 그룹 전환 시 불편: 다른 그룹으로 이동 전 저장해야 함
4. 초등부 이탈 원인: "입력 불편, 초기 가치 체감 부족" (피드백)

**목표 상태**
- 출석 셀 변경 시 **즉시 서버에 저장** (개별 출석 1건씩)
- 저장 상태를 **시각적으로 표시** (저장 중/완료/오류)
- **저장 버튼 유지**: 명시적 전체 동기화 (사용자 심리적 안정감)
- 네트워크 오류 시 **재시도 로직** 제공

### 사용자 플로우 (자동 저장)

**기본 플로우**
1. 사용자가 출석 셀 값 변경
2. 시스템이 **즉시** 해당 출석 1건 저장
3. 저장 상태 인디케이터 표시
4. 저장 완료 후 인디케이터 사라짐

**그룹 전환 플로우**
1. 그룹 A 선택 → 학생 목록 표시
2. 출석 셀 변경 → 즉시 저장됨
3. 그룹 B로 변경 → 기존 데이터 이미 저장 완료
4. 그룹 B 학생 목록 표시 → 출석 입력 계속

**명시적 저장 플로우**
1. 사용자가 "저장" 버튼 클릭
2. 전체 데이터 한번 더 동기화
3. "저장 완료" 피드백 표시

### 상태 전이 (자동 저장)

```
[대기] → (값 변경) → [저장 중]
[저장 중] → (성공) → [저장 완료] → [대기]
[저장 중] → (실패) → [오류] → (재시도) → [저장 중]
```

### 저장 상태 인디케이터

| 상태 | 표시 | 색상 |
|------|------|------|
| 저장 중 | 스피너 + "저장 중..." | 파란색 |
| 저장 완료 | 체크 아이콘 (2초 후 사라짐) | 초록색 |
| 오류 | 느낌표 + "재시도" 버튼 | 빨간색 |

### 자동 저장 요청 방식

**자동 저장 (셀 변경 시)**: 개별 출석 1건 즉시 전송
```json
{
  "year": 2026,
  "attendance": [
    { "_id": 1, "month": 1, "day": 5, "data": "O" }
  ],
  "isFull": false
}
```

**명시적 저장 (버튼 클릭 시)**: 전체 데이터 동기화
```json
{
  "year": 2026,
  "attendance": [
    { "_id": 1, "month": 1, "day": 5, "data": "O" },
    { "_id": 2, "month": 1, "day": 5, "data": "X" }
  ],
  "isFull": true
}
```

### 자동 저장 예외 케이스

| 상황 | 처리 방법 |
|------|----------|
| 네트워크 오류 | 오류 상태 표시 + 재시도 버튼 |
| 연속 입력 | 각 변경마다 개별 요청 |
| 그룹 전환 | 이미 저장 완료 상태 (별도 처리 불필요) |
| 동시 편집 충돌 | Last Write Wins (현재 정책 유지) |

### 자동 저장 의사결정 (확정)

| 항목 | 결정 | 비고 |
|------|------|------|
| 저장 방식 | 즉시 저장 (debounce 없음) | 셀 변경 즉시 개별 저장 |
| 저장 버튼 | 유지 | 전체 동기화 + 심리적 안정감 |
| 오프라인 대응 | 미지원 | 1단계 스코프 외 |

---

## 달력 UI (로드맵 1단계)

> 로드맵 1단계 "출석부 UX 개선" 중 달력 UI 기능

### 배경

**현재 문제점**
1. 테이블 형태의 한계: 월별 전체 현황 파악 어려움
2. 날짜 선택 불편: 특정 날짜 출석 입력 시 스크롤 필요
3. 의무축일/행사 구분 없음: 일반 주일과 특별 날짜 구분 불가

**목표 상태**
- **달력 형태**로 출석부 UI 전면 개편
- 날짜 클릭 → **모달창**에서 출석 입력
- **의무축일/행사** 달력에 표시 (천주교 전례력 기반)
- **자동 저장** 적용 (즉시 저장)

### 사용자 플로우 (달력 UI)

**기본 플로우**
1. 그룹 선택 (상단 드롭다운, 현재와 동일)
2. 달력에서 월별 출석 현황 확인
3. 날짜 클릭 → 출석 입력 모달 오픈
4. 학생 출석 체크 → 즉시 저장
5. 모달 닫기 → 달력에 반영

**월 이동 플로우**
1. 이전/다음 월 버튼 클릭
2. 해당 월 달력 + 출석 현황 로드

### 상태 전이 (달력 UI)

```
[달력 보기] → (날짜 클릭) → [출석 모달]
[출석 모달] → (출석 체크) → [즉시 저장] → [출석 모달]
[출석 모달] → (닫기) → [달력 보기 (갱신)]
```

### 화면 구성

| 영역 | 설명 |
|------|------|
| 상단 | 그룹 선택 드롭다운 (현재와 동일) |
| 달력 헤더 | 년/월 표시, 이전/다음 월 버튼 |
| 달력 본문 | 7열 (일~토) x 5~6행 |
| 날짜 셀 | 날짜 + 출석 현황 + 특별일 표시 |

### 달력 날짜 셀

| 요소 | 표시 내용 |
|------|----------|
| 날짜 | 1, 2, 3, ... |
| 출석 현황 | 출석 N명 / 전체 M명 |
| 의무축일 | 빨간색 배경 또는 아이콘 |

### 출석 입력 모달

| 요소 | 설명 |
|------|------|
| 헤더 | 선택한 날짜 (예: 2026년 1월 12일 주일) |
| 의무축일 표시 | 축일명 (해당 시) |
| 학생 목록 | 출석 체크 영역 |
| 저장 상태 | 인디케이터 (저장 중/완료/오류) |

### 출석 체크 방식 (확정)

**체크박스 목록** 방식 사용

| 학생 | 미사 | 교리 | 결과 |
|------|------|------|------|
| 홍길동 | ✓ | ✓ | ◎ (출석) |
| 김철수 | ✓ | | ○ (미사만) |
| 박영희 | | ✓ | △ (교리만) |
| 이민수 | | | 결석 |

**모달 레이아웃**
```
┌─────────────────────────────────────┐
│ 2026년 1월 12일 주일                 │
├─────────────────────────────────────┤
│ 학생명      │ 미사 │ 교리 │ 상태   │
├─────────────────────────────────────┤
│ 홍길동      │  ☑  │  ☑  │   ◎   │
│ 김철수      │  ☑  │  ☐  │   ○   │
│ 박영희      │  ☐  │  ☑  │   △   │
│ 이민수      │  ☐  │  ☐  │   -   │
└─────────────────────────────────────┘
│            저장 상태: 저장 완료 ✓    │
└─────────────────────────────────────┘
```

### 의무축일 표시

| 구분 | 표시 방법 | 예시 |
|------|----------|------|
| 의무축일 | 빨간색 배경 또는 아이콘 | 부활, 성탄 |
| 일반 주일 | 기본 색상 | - |

### 의무축일 계산

**고정 축일 (천주교 전례력)**
| 축일 | 날짜 |
|------|------|
| 천주의 성모 마리아 대축일 | 1월 1일 |
| 성모 승천 대축일 | 8월 15일 |
| 모든 성인 대축일 | 11월 1일 |
| 한국 성직자·수도자·신자들의 축일 | 9월 둘째 주일 |
| 성탄 대축일 | 12월 25일 |

**이동 축일 (부활 기준 계산)**
| 축일 | 계산 |
|------|------|
| 부활 대축일 | 춘분 후 첫 보름달 다음 주일 |
| 예수 승천 대축일 | 부활 후 40일 (목요일 또는 주일) |
| 성령 강림 대축일 | 부활 후 50일 |
| 지극히 거룩하신 삼위일체 대축일 | 성령 강림 후 첫 주일 |
| 지극히 거룩하신 그리스도의 성체 성혈 대축일 | 삼위일체 후 목요일 또는 주일 |
| 예수 성심 대축일 | 성체 성혈 후 금요일 |
| 그리스도 왕 대축일 | 대림 제1주일 전 주일 |

### 달력 UI API

**attendance.calendar({ year: 2026, month: 1, groupId: 1 })**

```json
{
  "year": 2026,
  "month": 1,
  "days": [
    {
      "date": "2026-01-05",
      "dayOfWeek": 0,
      "attendance": { "present": 12, "total": 15 },
      "holyday": null
    },
    {
      "date": "2026-01-12",
      "dayOfWeek": 0,
      "attendance": { "present": 14, "total": 15 },
      "holyday": null
    }
  ]
}
```

**liturgical.holydays({ year: 2026 })**

```json
{
  "year": 2026,
  "holydays": [
    { "date": "2026-01-01", "name": "천주의 성모 마리아 대축일" },
    { "date": "2026-04-05", "name": "부활 대축일" },
    { "date": "2026-12-25", "name": "성탄 대축일" }
  ]
}
```

### 달력 UI 예외 케이스

| 상황 | 처리 방법 |
|------|----------|
| 출석 데이터 없는 날짜 | 0명/전체 표시 |
| 주일 아닌 날짜 클릭 | 출석 입력 허용 (행사 등) |
| 의무축일 계산 오류 | 고정 축일만 표시, 로그 기록 |
| 네트워크 오류 | 오류 인디케이터 + 재시도 |

### 달력 UI 의사결정 (확정)

| 항목 | 결정 | 비고 |
|------|------|------|
| 출석 체크 방식 | 체크박스 목록 (미사/교리) | ◎○△ 표기 활용 |
| 행사 관리 | 후순위 (3단계) | 의무축일만 1단계에서 구현 |

---

**작성일**: 2026-01-13 (기본), 2026-01-14 (자동 저장/달력 UI 병합)
**작성자**: PM 에이전트
**상태**: Approved (구현 완료)
