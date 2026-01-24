# Development: 통계

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 상위 문서

- PRD: `docs/specs/prd/school-attendance.md` (로드맵 1단계)
- 기능 설계: `docs/specs/functional-design/statistics.md` (우수 출석 + 대시보드 통계 포함)
- Feature: `docs/specs/current/functional/features/statistics.md`
- Task: `docs/specs/current/functional/tasks/statistics.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| #1 | DB 마이그레이션 | O |
| #2 | tRPC 스키마 정의 | O |
| #3 | 출석률 API | O |
| #4 | 평균 출석 인원 API | O |
| #5 | 성별 분포 API | O |
| #6 | 그룹 순위 API | O |
| #7 | 그룹별 우수 학생 API | O |
| #8 | 전체 우수 학생 API | O |
| #9 | 그룹별 상세 통계 API | O |
| #10 | Frontend hooks | O |
| #11 | 대시보드 UI | O |

## 구현 개요

대시보드에 출석 통계를 표시하기 위한 Backend API 및 Frontend 컴포넌트를 구현한다.

---

## #1: DB 마이그레이션

### Prisma 스키마 변경

```prisma
model Student {
  // 기존 필드...
  gender    String?   @db.VarChar(10)  // M, F, null
}
```

### 마이그레이션 명령

```bash
pnpm prisma db push
```

---

## #2: tRPC 스키마 정의

### Input 스키마

```
# 공통 입력
StatisticsInput {
  year?: number  # 기본값: 현재 연도
}

# TOP 조회용
TopStatisticsInput extends StatisticsInput {
  limit?: number  # 기본값: 5
}
```

### Output 스키마

```
# 출석률 응답
AttendanceRateOutput {
  year: number
  period: string           # "weekly" | "monthly" | "yearly"
  startDate: string        # YYYY-MM-DD
  endDate: string          # YYYY-MM-DD
  attendanceRate: number   # 0-100
  avgAttendance: number    # 평균 출석 인원
  totalStudents: number    # 전체 학생 수
}

# 성별 분포 응답
GenderDistributionOutput {
  year: number
  male: { count: number, rate: number }
  female: { count: number, rate: number }
  unknown: { count: number, rate: number }
}

# 그룹 순위 응답
TopGroupsOutput {
  year: number
  groups: [
    {
      groupId: string
      groupName: string
      attendanceRate: number
    }
  ]
}

# 그룹별 우수 학생 응답
TopByGroupOutput {
  year: number
  groups: [
    {
      groupId: string
      groupName: string
      students: [
        { id: string, societyName: string, score: number }
      ]
    }
  ]
}

# 전체 우수 학생 응답
TopOverallOutput {
  year: number
  students: [
    {
      id: string
      societyName: string
      groupName: string
      score: number
    }
  ]
}
```

---

## #3: 출석률 API

### 프로시저

- **이름**: `statistics.weekly`, `statistics.monthly`, `statistics.yearly`
- **타입**: query
- **인증**: 필요 (Bearer 토큰)

### 비즈니스 로직

```
FUNCTION getAttendanceRate(accountId, year, period)
  # 1. 기간 계산
  IF period == "weekly" THEN
    startDate = thisWeekSunday(year)
    endDate = thisWeekSaturday(year)
  ELSE IF period == "monthly" THEN
    startDate = firstDayOfMonth(year, currentMonth)
    endDate = lastDayOfMonth(year, currentMonth)
  ELSE IF period == "yearly" THEN
    startDate = "{year}-01-01"
    endDate = "{year}-12-31"

  # 2. 계정 소속 그룹의 학생 조회
  groups = findGroupsByAccountId(accountId)
  students = findStudentsByGroups(groups)
  totalStudents = students.count

  # 3. 기간 내 출석 데이터 조회
  attendances = findAttendancesByDateRange(students, startDate, endDate)

  # 4. 출석 일수 계산 (해당 기간 내 주일/토요일 수)
  totalDays = countSundaysAndSaturdays(startDate, endDate)

  # 5. 출석률 계산
  # 출석률 = (출석 횟수 / (전체 학생 수 * 출석 일수)) * 100
  expectedAttendances = totalStudents * totalDays
  actualAttendances = attendances.count
  attendanceRate = (actualAttendances / expectedAttendances) * 100

  # 6. 평균 출석 인원
  avgAttendance = actualAttendances / totalDays

  RETURN {
    year,
    period,
    startDate,
    endDate,
    attendanceRate: round(attendanceRate, 1),
    avgAttendance: round(avgAttendance, 1),
    totalStudents
  }
```

### 주간 날짜 계산

```
FUNCTION thisWeekSunday(year)
  today = currentDate()
  dayOfWeek = today.dayOfWeek  # 0=일요일
  sunday = today - dayOfWeek days
  RETURN sunday

FUNCTION thisWeekSaturday(year)
  sunday = thisWeekSunday(year)
  RETURN sunday + 6 days
```

---

## #4: 평균 출석 인원 API

### 프로시저

- **이름**: `statistics.avgAttendance`
- **타입**: query
- **인증**: 필요

### 비즈니스 로직

```
FUNCTION getAvgAttendance(accountId, year)
  # 주간/월간/연간 출석률 API와 동일한 로직 사용
  weekly = getAttendanceRate(accountId, year, "weekly")
  monthly = getAttendanceRate(accountId, year, "monthly")
  yearly = getAttendanceRate(accountId, year, "yearly")

  RETURN {
    year,
    weekly: {
      avgAttendance: weekly.avgAttendance,
      startDate: weekly.startDate,
      endDate: weekly.endDate
    },
    monthly: {
      avgAttendance: monthly.avgAttendance,
      startDate: monthly.startDate,
      endDate: monthly.endDate
    },
    yearly: {
      avgAttendance: yearly.avgAttendance,
      startDate: yearly.startDate,
      endDate: yearly.endDate
    }
  }
```

---

## #5: 성별 분포 API

### 프로시저

- **이름**: `statistics.byGender`
- **타입**: query
- **인증**: 필요

### 비즈니스 로직

```
FUNCTION getGenderDistribution(accountId, year)
  # 1. 계정 소속 그룹의 학생 조회
  groups = findGroupsByAccountId(accountId)
  students = findStudentsByGroups(groups)

  # 2. 성별 그룹화
  maleStudents = students.filter(s => s.gender == "M")
  femaleStudents = students.filter(s => s.gender == "F")
  unknownStudents = students.filter(s => s.gender == null)

  # 3. 각 성별의 연간 출석 데이터 조회
  maleAttendances = findAttendancesByYear(maleStudents, year)
  femaleAttendances = findAttendancesByYear(femaleStudents, year)
  unknownAttendances = findAttendancesByYear(unknownStudents, year)

  # 4. 출석률 계산
  totalDays = countSundaysAndSaturdays(year)

  FUNCTION calcRate(students, attendances)
    IF students.count == 0 THEN RETURN 0
    expected = students.count * totalDays
    RETURN (attendances.count / expected) * 100

  RETURN {
    year,
    male: {
      count: maleStudents.count,
      rate: round(calcRate(maleStudents, maleAttendances), 1)
    },
    female: {
      count: femaleStudents.count,
      rate: round(calcRate(femaleStudents, femaleAttendances), 1)
    },
    unknown: {
      count: unknownStudents.count,
      rate: round(calcRate(unknownStudents, unknownAttendances), 1)
    }
  }
```

---

## #6: 그룹 순위 API

### 프로시저

- **이름**: `statistics.topGroups`
- **타입**: query
- **인증**: 필요

### 비즈니스 로직

```
FUNCTION getTopGroups(accountId, year, limit)
  # 1. 계정 소속 그룹 조회
  groups = findGroupsByAccountId(accountId)

  # 2. 각 그룹별 출석률 계산
  groupRates = []
  FOR EACH group IN groups
    students = findStudentsByGroupId(group.id)
    IF students.count == 0 THEN CONTINUE

    attendances = findAttendancesByYear(students, year)
    totalDays = countSundaysAndSaturdays(year)
    expected = students.count * totalDays
    rate = (attendances.count / expected) * 100

    groupRates.add({
      groupId: group.id,
      groupName: group.name,
      attendanceRate: round(rate, 1)
    })

  # 3. 출석률 높은 순 정렬 후 상위 N개 반환
  groupRates.sortDescending(by: attendanceRate)
  RETURN {
    year,
    groups: groupRates.take(limit)
  }
```

---

## #7: 그룹별 우수 학생 API

### 프로시저

- **이름**: `statistics.topByGroup`
- **타입**: query
- **인증**: 필요

### 비즈니스 로직

```
FUNCTION getTopByGroup(accountId, year, limit)
  # 1. 계정 소속 그룹 조회
  groups = findGroupsByAccountId(accountId)

  # 2. 각 그룹별 우수 학생 TOP N 계산
  result = []
  FOR EACH group IN groups
    students = findStudentsByGroupId(group.id)
    IF students.count == 0 THEN CONTINUE

    # 학생별 출석 점수 계산
    studentScores = []
    FOR EACH student IN students
      attendances = findAttendancesByYear(student.id, year)
      score = attendances.count  # 출석 횟수 = 점수
      studentScores.add({
        id: student.id,
        societyName: student.societyName,
        score: score
      })

    # 점수 높은 순 정렬 후 상위 N개
    studentScores.sortDescending(by: score)

    result.add({
      groupId: group.id,
      groupName: group.name,
      students: studentScores.take(limit)
    })

  RETURN {
    year,
    groups: result
  }
```

---

## #8: 전체 우수 학생 API

### 프로시저

- **이름**: `statistics.topOverall`
- **타입**: query
- **인증**: 필요

### 비즈니스 로직

```
FUNCTION getTopOverall(accountId, year, limit)
  # 1. 계정 소속 그룹의 모든 학생 조회
  groups = findGroupsByAccountId(accountId)
  allStudents = []
  FOR EACH group IN groups
    students = findStudentsByGroupId(group.id)
    FOR EACH student IN students
      student.groupName = group.name
      allStudents.add(student)

  # 2. 학생별 출석 점수 계산
  studentScores = []
  FOR EACH student IN allStudents
    attendances = findAttendancesByYear(student.id, year)
    score = attendances.count
    studentScores.add({
      id: student.id,
      societyName: student.societyName,
      groupName: student.groupName,
      score: score
    })

  # 3. 점수 높은 순 정렬 후 상위 N개
  studentScores.sortDescending(by: score)

  RETURN {
    year,
    students: studentScores.take(limit)
  }
```

---

## #9: 그룹별 상세 통계 API

### 프로시저

- **이름**: `statistics.groupStatistics`
- **타입**: query
- **인증**: 필요

### 비즈니스 로직

```
FUNCTION getGroupStatistics(accountId, year)
  # 1. 계정 소속 그룹 조회
  groups = findGroupsByAccountId(accountId)

  # 2. 기간 계산 (주간/월간/연간)
  weeklyRange = getWeeklyRange(year)
  monthlyRange = getMonthlyRange(year)
  yearlyRange = getYearlyRange(year)

  # 3. 각 그룹별 통계 계산
  groupStats = []
  FOR EACH group IN groups
    students = findStudentsByGroupId(group.id)
    studentIds = students.map(s => s.id)

    # 각 기간별 출석률/평균 인원 계산
    weekly = calculatePeriodStats(studentIds, weeklyRange)
    monthly = calculatePeriodStats(studentIds, monthlyRange)
    yearly = calculatePeriodStats(studentIds, yearlyRange)

    groupStats.add({
      groupId: group.id,
      groupName: group.name,
      weekly: { attendanceRate, avgAttendance, startDate, endDate },
      monthly: { attendanceRate, avgAttendance, startDate, endDate },
      yearly: { attendanceRate, avgAttendance, startDate, endDate },
      totalStudents: students.count
    })

  RETURN {
    year,
    groups: groupStats
  }
```

---

## #10: Frontend hooks

### useDashboardStatistics 훅

```
FUNCTION useStatistics(year)
  # React Query로 각 API 병렬 호출
  weeklyQuery = useQuery("statistics.weekly", { year })
  monthlyQuery = useQuery("statistics.monthly", { year })
  yearlyQuery = useQuery("statistics.yearly", { year })
  avgQuery = useQuery("statistics.avgAttendance", { year })
  genderQuery = useQuery("statistics.byGender", { year })
  topGroupsQuery = useQuery("statistics.topGroups", { year, limit: 5 })
  topByGroupQuery = useQuery("statistics.topByGroup", { year, limit: 5 })
  topOverallQuery = useQuery("statistics.topOverall", { year, limit: 5 })

  RETURN {
    weekly: weeklyQuery.data,
    monthly: monthlyQuery.data,
    yearly: yearlyQuery.data,
    avgAttendance: avgQuery.data,
    byGender: genderQuery.data,
    topGroups: topGroupsQuery.data,
    topByGroup: topByGroupQuery.data,
    topOverall: topOverallQuery.data,
    isLoading: any query is loading,
    error: first error if any
  }
```

---

## #11: 대시보드 UI

### 컴포넌트 구조

```
DashboardPage
├── StatsGrid
│   ├── AttendanceRateCard (주간)
│   ├── AttendanceRateCard (월간)
│   ├── AttendanceRateCard (연간)
│   ├── AvgAttendanceCard (주간/월간/연간)
│   ├── GenderDistributionCard
│   ├── TopGroupsCard
│   ├── TopByGroupCard
│   └── TopOverallCard
└── QuickMenuGrid (기존 메뉴 바로가기)
```

### 레이아웃

```
┌─────────────────────────────────────────────────┐
│ 안녕하세요, OOO님!                               │
├─────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│ │ 주간 출석률 │ │ 월간 출석률 │ │ 연간 출석률 │       │
│ │   85.5%   │ │   78.2%   │ │   82.1%   │       │
│ └───────────┘ └───────────┘ └───────────┘       │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐       │
│ │ 주간 평균  │ │ 월간 평균  │ │ 연간 평균  │       │
│ │  45.2명   │ │  42.8명   │ │  43.5명   │       │
│ └───────────┘ └───────────┘ └───────────┘       │
├─────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────────────┐ │
│ │    성별 분포     │ │    그룹별 출석률 TOP 5   │ │
│ │ 남: 55% 여: 45% │ │ 1. 중1-1반 92.5%        │ │
│ └─────────────────┘ │ 2. 중2-1반 88.2%        │ │
│                     │ ...                     │ │
│                     └─────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │          전체 우수 출석 학생 TOP 5           │ │
│ │ 1. 홍길동 (중1-1반) - 95점                   │ │
│ │ 2. 김철수 (중2-1반) - 92점                   │ │
│ │ ...                                         │ │
│ └─────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐        │
│ │ 그룹  │ │ 학생  │ │ 출석부 │ │ 통계  │        │
│ │ 관리  │ │ 관리  │ │       │ │       │        │
│ └───────┘ └───────┘ └───────┘ └───────┘        │
└─────────────────────────────────────────────────┘
```

### 카드 컴포넌트

```
StatCard {
  title: string
  value: string | number
  suffix?: string  # "%" 또는 "명"
  isLoading?: boolean
  error?: string
}
```

---

## 에러 처리

| 에러 상황 | 에러 코드 | 응답 |
|----------|----------|------|
| 토큰 누락 | 401 | UNAUTHORIZED |
| 권한 없는 접근 | 403 | FORBIDDEN |
| 서버/DB 오류 | 500 | INTERNAL_SERVER_ERROR |

---

## 테스트 시나리오

### Backend

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 주간 출석률 조회 | year: 2026 | attendanceRate, avgAttendance 반환 |
| 월간 출석률 조회 | year: 2026 | attendanceRate, avgAttendance 반환 |
| 연간 출석률 조회 | year: 2026 | attendanceRate, avgAttendance 반환 |
| 성별 분포 조회 | year: 2026 | male/female/unknown 분포 반환 |
| 그룹 TOP 5 조회 | year: 2026, limit: 5 | 최대 5개 그룹 반환 |
| 전체 우수 학생 조회 | year: 2026, limit: 5 | 최대 5명 반환 |
| 토큰 없이 요청 | - | 401 반환 |

### Frontend

| 시나리오 | 동작 | 기대 결과 |
|---------|------|----------|
| 대시보드 로드 | 페이지 진입 | 모든 통계 카드 표시 |
| 로딩 상태 | API 호출 중 | 각 카드에 스피너 표시 |
| 데이터 없음 | 출석 데이터 0 | "데이터 없음" 표시 |
| API 오류 | 500 응답 | 에러 메시지 표시 |

---

## 테스트 구현

### Backend 통합 테스트

**파일**: `apps/api/test/integration/statistics.test.ts`

**테스트 케이스 (20개)**:

| 프로시저 | 테스트 케이스 |
|---------|-------------|
| `statistics.excellent` | 우수 학생 조회 성공, UNAUTHORIZED 에러 |
| `statistics.weekly` | 주간 출석률 조회 성공, UNAUTHORIZED 에러 |
| `statistics.monthly` | 월간 출석률 조회 성공, UNAUTHORIZED 에러 |
| `statistics.yearly` | 연간 출석률 조회 성공, UNAUTHORIZED 에러 |
| `statistics.avgAttendance` | 평균 출석 인원 조회 성공, UNAUTHORIZED 에러 |
| `statistics.byGender` | 성별 분포 조회 성공, UNAUTHORIZED 에러 |
| `statistics.topGroups` | 그룹 순위 조회 성공, UNAUTHORIZED 에러 |
| `statistics.topByGroup` | 그룹별 우수 학생 조회 성공, UNAUTHORIZED 에러 |
| `statistics.topOverall` | 전체 우수 학생 조회 성공, UNAUTHORIZED 에러 |
| `statistics.groupStatistics` | 그룹별 상세 통계 조회 성공, UNAUTHORIZED 에러 |

**테스트 환경**:
- Prisma 모킹 (`mockPrismaClient`)
- JWT 토큰 생성 (`createMockToken`)
- `Prisma.sql` 템플릿 모킹 (Vitest setup)

### Frontend 훅 테스트

**파일**: `apps/web/test/hooks/useStatistics.test.ts`

**테스트 케이스 (9개)**:

| 훅 | 테스트 케이스 |
|----|-------------|
| `useStatistics` | excellentStudents 반환 검증 |
| `useDashboardStatistics` | 대시보드 통계 데이터 반환 검증 |
| `useDashboardStatistics` | 주간 출석률 데이터 구조 검증 |
| `useDashboardStatistics` | 평균 출석 인원 데이터 구조 검증 |
| `useDashboardStatistics` | 성별 분포 데이터 구조 검증 |
| `useDashboardStatistics` | 그룹별 출석률 순위 데이터 구조 검증 |
| `useDashboardStatistics` | 전체 우수 학생 데이터 구조 검증 |
| `useDashboardStatistics` | 그룹별 상세 통계 데이터 구조 검증 |
| `useDashboardStatistics` | isLoading 상태 검증 |

**테스트 환경**:
- tRPC 훅 모킹 (`vi.mock('~/lib/trpc')`)
- Vitest + jsdom

### 테스트 커버리지

| 영역 | 테스트 수 | 커버리지 |
|------|----------|---------|
| Backend 통합 테스트 | 20개 | 모든 프로시저 성공/에러 케이스 |
| Frontend 훅 테스트 | 9개 | 훅 반환값/데이터 구조 검증 |
| **총합** | **29개** | - |

---

## AI 구현 지침

### Backend 파일 위치

```
apps/api/src/
├── domains/
│   └── statistics/
│       ├── application/
│       │   ├── get-attendance-rate.usecase.ts   # 주간/월간/연간 출석률
│       │   ├── get-avg-attendance.usecase.ts
│       │   ├── get-by-gender.usecase.ts
│       │   ├── get-top-groups.usecase.ts
│       │   ├── get-top-by-group.usecase.ts
│       │   ├── get-top-overall.usecase.ts
│       │   └── get-group-statistics.usecase.ts  # 그룹별 상세 통계
│       └── presentation/
│           └── statistics.router.ts
└── app.router.ts
```

### Frontend 파일 위치

```
apps/web/src/
├── pages/
│   └── DashboardPage.tsx
├── components/
│   └── dashboard/
│       ├── index.ts
│       ├── StatCard.tsx
│       ├── AttendanceRateChart.tsx      # Recharts 막대 차트
│       ├── AvgAttendanceChart.tsx       # Recharts 막대 차트
│       ├── GenderDistributionChart.tsx  # Recharts 도넛 차트
│       ├── TopRankingCard.tsx
│       └── GroupStatisticsTable.tsx     # 그룹별 상세 통계 테이블
└── features/
    └── statistics/
        └── hooks/
            └── useStatistics.ts         # useDashboardStatistics 포함
```

### 참고할 기존 패턴

- 기존 통계: `apps/api/src/domains/statistics/`
- tRPC 스키마: `packages/trpc/src/schemas/`
- React Query 훅: `apps/web/src/features/*/hooks/`

---

**작성일**: 2026-01-22
**리뷰 상태**: Approved