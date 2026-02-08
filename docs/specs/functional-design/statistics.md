# 기능 설계: 통계

> PM 에이전트가 작성하는 기능 설계 문서입니다.
> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- 사업 문서: `docs/business/6_roadmap/roadmap.md`


## 기능 범위

| 기능 | 설명 | 상태 |
|------|------|------|
| 우수 출석 학생 | 연도별 우수 출석 학생 TOP 10 | 구현 완료 |
| 대시보드 통계 (로드맵 1단계) | 출석률, 성별 분포, 그룹별 순위 | 구현 완료 |

---

## 기본 통계: 우수 출석 학생

### 사용자 플로우 (우수 출석)

1. 사용자가 통계 화면 진입
2. 연도 선택 (기본값: 현재 연도)
3. 해당 연도의 우수 출석 학생 상위 10명 조회
4. 시상 대상 선정 등에 활용

### 상태 전이 (우수 출석)

```
[통계 화면] → (연도 선택) → [통계 조회] → [결과 표시]
```

### UI/UX (우수 출석)

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 통계 | 우수 출석 학생 랭킹 | 연도 선택, 순위 테이블 (이름, 점수) |

| 요소 | 정렬 | 비고 |
|------|------|------|
| 연도 선택 필터 | 중앙 | 화면 중앙에 배치 |
| 순위 테이블 | 중앙 | 화면 중앙에 배치 |
| 빈 상태 메시지 | 중앙 | 화면 중앙에 표시 |

### 점수 계산 규칙

| 출석 내용 | 점수 |
|----------|------|
| ◎ (쌍동그라미) | 2점 |
| ○ (동그라미) | 1점 |
| △ (세모) | 1점 |
| 그 외 | 0점 |

### 우수 출석 API

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `statistics.excellent` | query | 우수 출석 학생 조회 |

**statistics.excellent({ year: 2026 })**

```json
{
  "excellentStudents": [
    { "id": "1", "society_name": "홍길동", "count": 85 },
    { "id": "2", "society_name": "김철수", "count": 78 },
    { "id": "3", "society_name": "이영희", "count": 72 }
  ]
}
```

### 필드명 규칙

| 필드 | 형식 | 이유 |
|------|------|------|
| `society_name` | snake_case | raw SQL 쿼리 결과 (DB 컬럼명 그대로 사용) |
| `id` | string | BigInt → string 변환 (직렬화) |
| `count` | number | BigInt → number 변환 |

> **Note**: 다른 API는 Prisma를 통해 camelCase로 변환되지만, 통계 API는 성능상 raw SQL을 사용하여 snake_case가 그대로 노출됩니다.

---

## 대시보드 통계 (로드맵 1단계)

### 배경

현재 통계 기능은 별도 페이지에서 "우수 출석 학생 TOP 10"만 제공합니다.
사용자가 로그인 후 바로 현황을 파악할 수 있도록 **대시보드에 통계를 통합**합니다.

**현재 → 변경**
```
현재: 로그인 → 대시보드 (빈 화면) → 통계 페이지 이동 → 확인
변경: 로그인 → 대시보드 (통계 카드들) → 상세 필요 시 클릭
```

### 사용자 플로우 (대시보드)

1. 사용자가 로그인
2. 대시보드에서 통계 카드들 확인
3. 필요 시 상세 페이지로 이동

### 대시보드 통계 카드

| 카드 | 내용 | 비고 |
|------|------|------|
| **주간 출석률** | 이번 주 출석률 % | 퍼센트 표시 |
| **월간 출석률** | 이번 달 출석률 % | 퍼센트 표시 |
| **이번 주 출석 현황** | 이번 주 출석한 학생 수/전체 | 예: 45/50명 |
| **성별 분포** | 남/여 출석 비율 | 막대 또는 원형 |
| **그룹별 출석률 순위** | 출석률 높은 그룹 TOP 5 | 리스트 |
| **그룹별 우수 학생** | 각 그룹마다 TOP 5 | 그룹별 탭/아코디언 |
| **전체 우수 출석 학생** | 전체 TOP 5 | 리스트 |

### 데이터/도메인 변경

**Student 테이블** - `gender` 필드 추가

| 필드 | 타입 | 설명 |
|------|------|------|
| gender | varchar(10) | 성별 (M/F/null) |

**마이그레이션**
```sql
ALTER TABLE student ADD COLUMN gender VARCHAR(10) NULL;
```

### 대시보드 통계 API

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `statistics.weekly` | query | 주간 출석률 |
| `statistics.monthly` | query | 월간 출석률 |
| `statistics.yearly` | query | 연간 출석률 |
| `statistics.avgAttendance` | query | 평균 출석 인원 (주간/월간/연간) |
| `statistics.byGender` | query | 성별 출석 분포 |
| `statistics.topGroups` | query | 그룹별 출석률 순위 TOP 5 |
| `statistics.topByGroup` | query | 각 그룹별 우수 학생 TOP 5 |
| `statistics.topOverall` | query | 전체 우수 출석 학생 TOP 5 |

**statistics.weekly({ year: 2026 })**

```json
{
  "year": 2026,
  "weekStart": "2026-01-12",
  "weekEnd": "2026-01-18",
  "attendanceRate": 85.5
}
```

**statistics.byGender({ year: 2026 })**

```json
{
  "year": 2026,
  "male": { "count": 120, "rate": 87.5 },
  "female": { "count": 95, "rate": 82.3 },
  "unknown": { "count": 5, "rate": 80.0 }
}
```

**statistics.topGroups({ year: 2026, limit: 5 })**

```json
{
  "year": 2026,
  "groups": [
    { "groupId": "1", "groupName": "중1-1반", "attendanceRate": 92.5 },
    { "groupId": "3", "groupName": "중2-1반", "attendanceRate": 88.2 }
  ]
}
```

**statistics.topByGroup({ year: 2026, limit: 5 })**

```json
{
  "year": 2026,
  "groups": [
    {
      "groupId": "1",
      "groupName": "중1-1반",
      "students": [
        { "id": "1", "societyName": "홍길동", "score": 95 },
        { "id": "2", "societyName": "김철수", "score": 88 }
      ]
    }
  ]
}
```

**statistics.topOverall({ year: 2026, limit: 5 })**

```json
{
  "year": 2026,
  "students": [
    { "id": "1", "societyName": "홍길동", "groupName": "중1-1반", "score": 95 },
    { "id": "5", "societyName": "박영희", "groupName": "중2-1반", "score": 92 }
  ]
}
```

## 비즈니스 로직

### 우수 출석 학생 조회

```
FUNCTION getExcellentStudents(accountId, year)
  # raw SQL로 점수 계산 (◎=2점, ○=1점, △=1점)
  # 계정 소속 그룹의 학생만 대상
  # 점수 높은 순 정렬, 상위 10명 반환
  return { excellentStudents: [{ id, society_name, count }] }
```

### 출석률 계산

```
FUNCTION getAttendanceRate(accountId, year, period)
  # 1. 기간 계산 (weekly/monthly/yearly)
  startDate, endDate = calculatePeriodRange(year, period)

  # 2. 계정 소속 그룹의 학생 조회
  students = findStudentsByAccount(accountId)
  totalStudents = students.count

  # 3. 기간 내 출석 데이터 조회
  attendances = findAttendancesByDateRange(students, startDate, endDate)

  # 4. 출석 일수 계산 (해당 기간 내 주일/토요일 수)
  totalDays = countSundaysAndSaturdays(startDate, endDate)

  # 5. 출석률 = (출석 횟수 / (전체 학생 수 * 출석 일수)) * 100
  expectedAttendances = totalStudents * totalDays
  attendanceRate = (attendances.count / expectedAttendances) * 100

  # 6. 평균 출석 인원
  avgAttendance = attendances.count / totalDays

  return { year, period, startDate, endDate, attendanceRate, avgAttendance, totalStudents }
```

### 성별 분포 계산

```
FUNCTION getGenderDistribution(accountId, year)
  students = findStudentsByAccount(accountId)
  maleStudents = students.filter(s => s.gender == "M")
  femaleStudents = students.filter(s => s.gender == "F")
  unknownStudents = students.filter(s => s.gender == null)

  totalDays = countSundaysAndSaturdays(year)
  FUNCTION calcRate(students, attendances)
    IF students.count == 0 THEN RETURN 0
    expected = students.count * totalDays
    RETURN (attendances.count / expected) * 100

  return { year, male: { count, rate }, female: { count, rate }, unknown: { count, rate } }
```

### 그룹 순위 계산

```
FUNCTION getTopGroups(accountId, year, limit)
  groups = findGroupsByAccountId(accountId)
  groupRates = []
  FOR EACH group IN groups
    students = findStudentsByGroupId(group.id)
    IF students.count == 0 THEN CONTINUE
    attendances = findAttendancesByYear(students, year)
    rate = (attendances.count / (students.count * totalDays)) * 100
    groupRates.add({ groupId, groupName, attendanceRate })
  groupRates.sortDescending(by: attendanceRate)
  return { year, groups: groupRates.take(limit) }
```

---

## 권한/보안

- **접근 제어**:
  - 모든 통계 API: Bearer 토큰 필수
  - 계정 소속 그룹의 학생만 집계
- **감사/로그**:
  - 통계 조회 로깅

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| year 누락 | 현재 연도로 대체 |
| 해당 연도 출석 데이터 없음 | 빈 배열 또는 0% 반환 |
| 성별 미지정 학생 | "미지정" 카테고리로 집계 |
| 토큰 누락 | 401 UNAUTHORIZED 반환 |

## 성능/제약

- 대시보드 로드 시 여러 API 병렬 호출
- 캐시 적용 고려 (1분 TTL)
- 우수 출석 집계 쿼리: raw SQL 사용

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 연도 지정 조회 → 해당 연도 우수 학생 목록 반환
2. **TC-2**: 연도 미지정 조회 → 현재 연도 기준 반환
3. **TC-3**: 대시보드 진입 → 모든 통계 카드 로드
4. **TC-4**: 주간/월간 출석률 정상 계산
5. **TC-5**: 성별 분포 정상 표시
6. **TC-6**: 그룹별 TOP 5, 전체 TOP 5 정상 표시

### 예외 케이스

1. **TC-E1**: 출석 데이터 없음 → 빈 배열 또는 "데이터 없음" 표시
2. **TC-E2**: 토큰 없이 접근 → 401 반환

---

**작성일**: 2026-01-13
**수정일**: 2026-01-24 (우수 출석 + 대시보드 통계 병합)
**작성자**: PM 에이전트
**상태**: Approved (API 구현 완료)
