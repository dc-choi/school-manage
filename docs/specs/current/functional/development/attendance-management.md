# Development: 출석 관리

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 상위 문서

- PRD: `docs/specs/prd/school-attendance.md` (로드맵 1단계)
- 기능 설계: `docs/specs/functional-design/attendance-management.md` (기본 + 달력 UI + 자동 저장 포함)
- Feature: `docs/specs/current/functional/features/attendance-management.md`
- Task: `docs/specs/current/functional/tasks/attendance-management.md`

## 구현 대상 업무

### 기존 테이블 UI

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| A1 | 그룹 출석 현황 조회 | O |
| A2 | 출석 일괄 입력 | O |
| A3 | 출석 일괄 삭제 | O |
| A4 | 테이블 자동 저장 (로드맵 1단계) | O |

### 달력 UI (로드맵 1단계)

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| B1 | 의무축일 계산 로직 | O |
| B2 | 월별 달력 데이터 API | O |
| B3 | 날짜별 상세 조회 API | O |
| B4 | 달력 UI 컴포넌트 | O |
| B5 | 출석 입력 모달 | O |
| B6 | 자동 저장 기능 | O |
| B7 | 달력-모달 연동 | O |

## 구현 개요

그룹별 출석 데이터를 조회하고, 출석 입력/삭제를 일괄 처리한다. 입력 여부는 `isFull` 플래그로 구분한다.
달력 형태의 출석부 UI를 구현한다. Backend에서 의무축일 계산 및 월별 달력 데이터 API를 제공하고, Frontend에서 달력 UI와 출석 입력 모달을 구현한다.

---

## 기존 테이블 UI 구현

### 데이터 모델

#### 입력 (Input)

출석 조회
```
GET /api/group/:groupId/attendance?year=YYYY
Authorization: Bearer <accessToken>
```

출석 입력/삭제
```
POST /api/attendance
Authorization: Bearer <accessToken>
{
  year?: number
  attendance: Array<{
    _id: number     // studentId
    month: number
    day: number
    data: string
  }>
  isFull: boolean   // true: 입력, false: 삭제
}
```

#### 출력 (Output)

공통 응답 래퍼
```
{
  code: number
  message: string
  result?: object
}
```

출석 조회
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

출석 입력/삭제
```
{
  result: {
    account: string
    row: number
    isFull: boolean
  }
}
```

### 상태 변경

- 출석 입력: `attendance` 테이블 insert/update
- 출석 삭제: `attendance` 테이블 delete (물리 삭제)

### 비즈니스 로직

#### 1. 출석 조회

```
IF groupId is not a positive number THEN
  throw BAD_REQUEST
IF year is invalid THEN year = currentYear
sunday/saturday = getYearDate(year)
students = StudentRepository.findAll(groupId)
attendances = AttendanceRepository.findAll(student_id in students)
return { year, sunday, saturday, students, attendances }
```

#### 2. 출석 입력 (isFull=true)

```
FOR EACH item in attendance
  date = YYYYMMDD from (year, month, day)
  existing = AttendanceRepository.get(studentId, date)
  IF existing is null THEN create
  ELSE update content
return number of created/updated rows
```

#### 3. 출석 삭제 (isFull=false)

```
FOR EACH item in attendance
  date = YYYYMMDD from (year, month, day)
  existing = AttendanceRepository.get(studentId, date)
  IF existing is not null THEN delete
return number of deleted rows
```

### 검증 규칙 (Validation)

| 필드 | 규칙 | 에러 메시지 |
|------|------|------------|
| groupId | 양수 숫자 | "BAD_REQUEST: groupId is wrong" |
| attendance | 배열, 길이 > 0 | "BAD_REQUEST: param is wrong" |
| isFull | boolean 필수 | "BAD_REQUEST: param is wrong" |
| year | 숫자 또는 미입력 | 미입력 시 현재 연도 |

### A4: 테이블 자동 저장 (로드맵 1단계)

#### 컴포넌트 상태

```
AttendancePage
├── selectedGroupId: string          # 선택된 그룹 ID
├── selectedYear: number             # 선택된 연도
├── saveStatus: SaveStatus           # 저장 상태 ("idle" | "saving" | "saved" | "error")
└── attendanceMap: Map<key, value>   # 학생-날짜별 출석 데이터
```

#### 자동 저장 트리거

```
FUNCTION handleAttendanceChange(studentId, month, day, value)
  # 1. 빈 값이면 저장하지 않음
  IF value == "" THEN
    RETURN

  # 2. 저장 상태 업데이트
  setSaveStatus("saving")

  TRY
    # 3. 개별 출석 1건 저장
    result = attendance.update({
      year: selectedYear,
      attendance: [{
        id: studentId,
        month: month,
        day: day,
        data: value
      }],
      isFull: false
    })

    # 4. 저장 완료 표시
    setSaveStatus("saved")

    # 5. 2초 후 상태 초기화
    setTimeout(() => setSaveStatus("idle"), 2000)

  CATCH error
    setSaveStatus("error")
    console.error("저장 실패:", error)
```

#### 저장 상태 인디케이터 UI

```
┌─────────────────────────────────────────┐
│ [그룹 선택] [연도 선택]    [저장 상태]  │
└─────────────────────────────────────────┘

저장 상태 표시:
- idle: (표시 없음)
- saving: 🔄 저장 중...
- saved: ✓ 저장 완료 (초록색)
- error: ✗ 저장 실패 (빨간색)
```

#### 기존 수동 저장 버튼 제거

```
변경 전: [저장 (N건)] 버튼 + pendingChanges 상태 관리
변경 후: 셀 변경 즉시 저장 + saveStatus 상태 표시
```

---

## 달력 UI 구현

### B1: 의무축일 계산 로직

#### 프로시저

- **이름**: `liturgical.holydays`
- **타입**: query
- **인증**: 필요 (Bearer 토큰)

#### 데이터 모델

**요청 (Input)**
```
{
  year: number (필수) - 조회할 년도 (예: 2026)
}
```

**응답 (Output)**
```
{
  year: number,
  holydays: [
    {
      date: string,    # "YYYY-MM-DD" 형식
      name: string     # 축일명
    }
  ]
}
```

#### 비즈니스 로직

**1. 고정 축일 계산**

```
FUNCTION getFixedHolydays(year)
  holydays = []

  # 고정 날짜 축일
  holydays.add({ date: "{year}-01-01", name: "천주의 성모 마리아 대축일" })
  holydays.add({ date: "{year}-08-15", name: "성모 승천 대축일" })
  holydays.add({ date: "{year}-11-01", name: "모든 성인 대축일" })
  holydays.add({ date: "{year}-12-25", name: "성탄 대축일" })

  # 한국 성직자·수도자·신자들의 축일 (9월 둘째 주일)
  secondSundayOfSeptember = getSecondSundayOf(year, 9)
  holydays.add({ date: secondSundayOfSeptember, name: "한국 성직자·수도자·신자들의 축일" })

  RETURN holydays
```

**2. 이동 축일 계산 (부활 기준)**

```
FUNCTION getMovableHolydays(year)
  holydays = []

  # 부활 대축일 계산 (Computus 알고리즘)
  easter = calculateEaster(year)
  holydays.add({ date: easter, name: "부활 대축일" })

  # 부활 기준 이동 축일
  holydays.add({ date: easter + 39일, name: "예수 승천 대축일" })
  holydays.add({ date: easter + 49일, name: "성령 강림 대축일" })
  holydays.add({ date: easter + 56일, name: "지극히 거룩하신 삼위일체 대축일" })
  holydays.add({ date: easter + 60일, name: "지극히 거룩하신 그리스도의 성체 성혈 대축일" })
  holydays.add({ date: easter + 68일, name: "예수 성심 대축일" })

  # 그리스도 왕 대축일 (대림 제1주일 전 주일 = 11월 마지막 주일)
  lastSundayOfNovember = getLastSundayOf(year, 11)
  holydays.add({ date: lastSundayOfNovember, name: "그리스도 왕 대축일" })

  RETURN holydays
```

**3. 부활 대축일 계산 (Anonymous Gregorian Algorithm)**

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

**4. N번째 주일 계산**

```
FUNCTION getSecondSundayOf(year, month)
  firstDay = date(year, month, 1)
  dayOfWeek = firstDay.dayOfWeek  # 0=일요일

  IF dayOfWeek == 0 THEN
    firstSunday = 1
  ELSE
    firstSunday = 8 - dayOfWeek

  secondSunday = firstSunday + 7
  RETURN date(year, month, secondSunday)
```

### B2: 월별 달력 데이터 API

#### 프로시저

- **이름**: `attendance.calendar`
- **타입**: query
- **인증**: 필요 (Bearer 토큰)

#### 데이터 모델

**요청 (Input)**
```
{
  year: number (필수) - 조회할 년도
  month: number (필수) - 조회할 월 (1-12)
  groupId: string (필수) - 그룹 ID
}
```

**응답 (Output)**
```
{
  year: number,
  month: number,
  totalStudents: number,  # 그룹 전체 학생 수
  days: [
    {
      date: string,           # "YYYY-MM-DD"
      dayOfWeek: number,      # 0=일, 1=월, ..., 6=토
      attendance: {
        present: number,      # 출석 인원 (미사 OR 교리 참석)
        total: number         # 전체 학생 수
      },
      holyday: string | null  # 의무축일명 (해당 시)
    }
  ]
}
```

#### 비즈니스 로직

```
FUNCTION getCalendarData(year, month, groupId, accountId)
  # 1. 권한 검증: accountId가 groupId를 소유하는지 확인
  group = findGroupByIdAndAccountId(groupId, accountId)
  IF group == null THEN
    THROW FORBIDDEN

  # 2. 해당 월의 날짜 목록 생성
  days = generateMonthDays(year, month)

  # 3. 의무축일 목록 조회
  holydays = getHolydaysForMonth(year, month)

  # 4. 해당 월의 출석 데이터 조회
  attendanceData = getMonthlyAttendance(year, month, groupId)

  # 5. 그룹의 전체 학생 수 조회
  totalStudents = countStudentsByGroupId(groupId)

  # 6. 날짜별 데이터 조합
  result = []
  FOR EACH day IN days
    dayData = {
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      attendance: {
        present: attendanceData[day.date]?.count ?? 0,
        total: totalStudents
      },
      holyday: holydays[day.date] ?? null
    }
    result.add(dayData)

  RETURN {
    year: year,
    month: month,
    totalStudents: totalStudents,
    days: result
  }
```

### B3: 날짜별 상세 조회 API

#### 프로시저

- **이름**: `attendance.dayDetail`
- **타입**: query
- **인증**: 필요 (Bearer 토큰)

#### 데이터 모델

**요청 (Input)**
```
{
  groupId: string (필수) - 그룹 ID
  date: string (필수) - 조회할 날짜 ("YYYY-MM-DD" 형식)
}
```

**응답 (Output)**
```
{
  date: string,
  holyday: string | null,
  students: [
    {
      id: string,
      societyName: string,
      content: string  # "◎" | "○" | "△" | ""
    }
  ]
}
```

#### 비즈니스 로직

```
FUNCTION getDayDetail(groupId, date, accountId)
  # 1. 권한 검증
  group = findGroupByIdAndAccountId(groupId, accountId)
  IF group == null THEN
    THROW FORBIDDEN

  # 2. 의무축일 확인
  holyday = getHolydayForDate(date)

  # 3. 학생 목록 조회
  students = findStudentsByGroupId(groupId)

  # 4. 해당 날짜 출석 데이터 조회
  attendances = findAttendancesByDateAndStudentIds(date, students.map(s => s.id))

  # 5. 학생별 출석 상태 매핑
  result = []
  FOR EACH student IN students
    attendance = attendances.find(a => a.studentId == student.id)
    result.add({
      id: student.id,
      societyName: student.societyName,
      content: attendance?.content ?? ""
    })

  RETURN {
    date: date,
    holyday: holyday,
    students: result
  }
```

### B4: 달력 UI 컴포넌트

#### 컴포넌트 구조

```
CalendarPage
├── GroupSelector           # 그룹 선택 드롭다운 (기존)
├── CalendarHeader          # 년/월 표시, 이전/다음 버튼
├── CalendarGrid            # 7x6 달력 그리드
│   └── CalendarCell[]      # 날짜 셀
└── AttendanceModal         # 출석 입력 모달 (B5)
```

#### CalendarHeader

**상태**
```
currentYear: number   # 현재 표시 년도
currentMonth: number  # 현재 표시 월 (1-12)
```

**동작**
```
FUNCTION onPrevMonth()
  IF currentMonth == 1 THEN
    currentYear = currentYear - 1
    currentMonth = 12
  ELSE
    currentMonth = currentMonth - 1
  refetchCalendarData()

FUNCTION onNextMonth()
  IF currentMonth == 12 THEN
    currentYear = currentYear + 1
    currentMonth = 1
  ELSE
    currentMonth = currentMonth + 1
  refetchCalendarData()
```

#### CalendarGrid

**레이아웃**
```
# 7열 x 6행 그리드 (최대 42셀)
# 첫 번째 행: 요일 헤더 (일, 월, 화, 수, 목, 금, 토)
# 나머지 행: 날짜 셀

FUNCTION generateCalendarGrid(year, month, days)
  grid = []

  # 해당 월 1일의 요일 (0=일요일)
  firstDayOfWeek = date(year, month, 1).dayOfWeek

  # 이전 달 날짜로 채우기
  FOR i = 0 TO firstDayOfWeek - 1
    grid.add({ type: "empty" })

  # 해당 월 날짜 채우기
  FOR EACH day IN days
    grid.add({ type: "day", data: day })

  # 다음 달 날짜로 채우기 (42셀까지)
  WHILE grid.length < 42
    grid.add({ type: "empty" })

  RETURN grid
```

#### CalendarCell

**표시 내용**
```
┌─────────────────┐
│ 12              │  ← 날짜
│ 10/15           │  ← 출석 현황 (present/total)
│ [축일 아이콘]    │  ← 의무축일 시
└─────────────────┘
```

**스타일**
```
IF cell.holyday != null THEN
  backgroundColor = "red-100"  # 의무축일: 빨간색 배경
ELSE IF cell.dayOfWeek == 0 THEN
  textColor = "red"  # 일요일: 빨간색 텍스트
ELSE IF cell.dayOfWeek == 6 THEN
  textColor = "blue"  # 토요일: 파란색 텍스트

IF cell.attendance.present == cell.attendance.total THEN
  attendanceColor = "green"  # 전원 출석: 초록색
ELSE IF cell.attendance.present == 0 THEN
  attendanceColor = "gray"  # 미입력: 회색
ELSE
  attendanceColor = "default"
```

### B5: 출석 입력 모달

#### 데이터 모델

**모달 상태**
```
{
  isOpen: boolean,
  selectedDate: string,        # "YYYY-MM-DD"
  holydayName: string | null,
  students: [
    {
      id: string,
      societyName: string,
      mass: boolean,       # 미사 참석
      catechism: boolean,  # 교리 참석
      status: string       # "◎" | "○" | "△" | "-"
    }
  ],
  saveStatus: "idle" | "saving" | "saved" | "error"
}
```

#### 출석 상태 계산

```
FUNCTION calculateStatus(mass, catechism)
  IF mass AND catechism THEN
    RETURN "◎"  # 출석 (둘 다)
  ELSE IF mass AND NOT catechism THEN
    RETURN "○"  # 미사만
  ELSE IF NOT mass AND catechism THEN
    RETURN "△"  # 교리만
  ELSE
    RETURN "-"  # 결석
```

### B6: 자동 저장 기능

#### 저장 트리거

```
FUNCTION onCheckboxChange(studentId, field, value)
  # 1. 로컬 상태 즉시 업데이트
  updateStudentCheckbox(studentId, field, value)

  # 2. 상태 재계산
  student = findStudent(studentId)
  student.status = calculateStatus(student.mass, student.catechism)

  # 3. 저장 요청 (디바운스 없이 즉시)
  saveAttendance(studentId, selectedDate, student.mass, student.catechism)
```

#### 저장 API 호출

```
FUNCTION saveAttendance(studentId, date, mass, catechism)
  setSaveStatus("saving")

  TRY
    content = calculateStatus(mass, catechism)
    result = attendance.update({
      year: date.year,
      attendance: [{
        id: studentId,
        month: date.month,
        day: date.day,
        data: content
      }],
      isFull: content != "-"  # 결석이면 삭제, 그 외 저장
    })
    setSaveStatus("saved")

    # 2초 후 상태 초기화
    setTimeout(() => setSaveStatus("idle"), 2000)
  CATCH error
    setSaveStatus("error")
    showErrorMessage("저장 실패. 재시도해주세요.")
```

### B7: 달력-모달 연동

#### 모달 닫기 시 달력 갱신

```
FUNCTION onModalClose()
  # 1. 모달 닫기
  modal.isOpen = false

  # 2. 달력 데이터 갱신 (React Query 캐시 무효화)
  invalidateCalendarQuery(groupId, year, month)
```

---

## 에러 처리

| 에러 상황 | 에러 코드 | 응답 |
|----------|----------|------|
| 잘못된 groupId | 400 | BAD_REQUEST: groupId is wrong |
| attendance/isFull 누락 | 400 | BAD_REQUEST: param is wrong |
| 토큰 누락 | 401 | UNAUTHORIZED |
| 권한 없는 그룹 | 403 | FORBIDDEN |
| 서버/DB 오류 | 500 | INTERNAL_SERVER_ERROR |
| 이동 축일 계산 오류 | - | 해당 축일 제외, 로그 기록 |
| 잘못된 년도 (< 1583) | - | 빈 배열 반환 (그레고리력 이전) |

---

## 테스트 시나리오

### 기존 테이블 UI

#### 정상 케이스

1. **출석 조회**: `group.attendance` → year/sunday/saturday/students/attendances 반환
2. **출석 입력**: `isFull=true` → row 반환
3. **출석 삭제**: `isFull=false` → row 반환

#### 예외 케이스

1. **attendance 누락**: `attendance.update` → 400 반환
2. **isFull 누락**: `attendance.update` → 400 반환
3. **토큰 누락**: 보호된 엔드포인트 → 401 반환

#### 테이블 자동 저장 (A4)

| 시나리오 | 동작 | 기대 결과 |
|---------|------|----------|
| 셀 값 변경 | select 값 O/X/? 선택 | 즉시 저장 API 호출, 저장 상태 표시 |
| 빈 값 선택 | select 값 - 선택 | 저장하지 않음 |
| 저장 완료 | API 성공 | "저장 완료" 표시, 2초 후 사라짐 |
| 저장 실패 | 네트워크 오류 | "저장 실패" 표시 |
| 그룹 전환 | 다른 그룹 선택 | 이미 저장 완료 상태, 새 그룹 데이터 로드 |

### 달력 UI

#### Backend 테스트

**liturgical.holydays**

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 2026년 의무축일 조회 | year: 2026 | 고정 5개 + 이동 7개 = 12개 축일 |
| 부활 대축일 확인 | year: 2026 | "2026-04-05" |
| 성탄 대축일 확인 | year: 2026 | "2026-12-25" |

**attendance.calendar**

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 정상 조회 | year: 2026, month: 1, groupId: 1 | 31일 데이터 + 출석 현황 |
| 의무축일 포함 | year: 2026, month: 1 | 1/1에 holyday: "천주의 성모 마리아 대축일" |
| 출석 없는 날 | 출석 데이터 없음 | present: 0 |
| 권한 없는 그룹 | 다른 계정의 groupId | FORBIDDEN |

**attendance.dayDetail**

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 정상 조회 | groupId: 1, date: "2024-01-07" | 학생 목록 + 출석 상태 |
| 의무축일 정보 | date: "2024-01-01" | holyday: "천주의 성모 마리아 대축일" |
| 권한 없는 그룹 | 다른 계정의 groupId | FORBIDDEN |

#### Frontend 테스트

| 시나리오 | 동작 | 기대 결과 |
|---------|------|----------|
| 달력 로드 | 페이지 진입 | 현재 월 달력 표시 |
| 월 이동 | 다음 월 클릭 | 다음 월 데이터 로드 |
| 날짜 클릭 | 날짜 셀 클릭 | 출석 모달 오픈 |
| 출석 체크 | 체크박스 클릭 | 즉시 저장 + 상태 업데이트 |
| 모달 닫기 | 닫기 버튼 | 달력 현황 갱신 |

---

## 구현 시 주의사항

- 모든 응답은 HTTP 200으로 내려가며, `code` 필드로 성공/실패를 구분한다.
- 출석 삭제는 물리 삭제로 처리한다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

### Backend 파일 위치 (tRPC)

```
apps/api/src/
├── domains/
│   ├── attendance/
│   │   ├── application/
│   │   │   ├── get-calendar.usecase.ts
│   │   │   └── get-day-detail.usecase.ts
│   │   └── presentation/
│   │       └── attendance.router.ts
│   └── liturgical/
│       ├── application/
│       │   └── get-holydays.usecase.ts
│       └── presentation/
│           └── liturgical.router.ts
└── app.router.ts
```

### Frontend 파일 위치

```
apps/web/src/
├── pages/
│   └── attendance/
│       └── AttendancePage.tsx
├── components/
│   └── attendance/
│       ├── CalendarHeader.tsx
│       ├── CalendarGrid.tsx
│       ├── CalendarCell.tsx
│       └── AttendanceModal.tsx
└── features/
    └── attendance/
        └── hooks/
            └── useCalendar.ts
```

### 테스트 위치

- `apps/api/test/integration/attendance.test.ts`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-22
**리뷰 상태**: Approved
