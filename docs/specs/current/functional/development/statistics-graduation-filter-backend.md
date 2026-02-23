# Development: 통계 졸업생 필터링 (백엔드)

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 상위 문서

- PRD: `docs/specs/prd/statistics-graduation-filter.md`
- 기능 설계: `docs/specs/functional-design/statistics.md` (통계 졸업생 필터링 섹션)
- Task: `docs/specs/target/functional/tasks/statistics-graduation-filter.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| B1 | Prisma 기반 통계 졸업 필터 | O |
| B2 | Raw SQL 기반 통계 졸업 필터 | O |
| B3 | 통합 테스트 | O |

## 구현 개요

6개 통계 UseCase의 Student 조회 조건에 `graduatedAt` 기반 연도 필터를 추가한다. 조회 연도 이전에 졸업한 학생을 통계에서 제외한다.

## 레이어별 책임

### Router
- 변경 없음 (기존 tRPC Router 유지)

### UseCase (Application)
- 6개 UseCase의 Student 조회 조건에 졸업 필터 추가
- Router, 스키마, 응답 구조 변경 없음

## 비즈니스 로직

### 공통 졸업 필터 조건

```
입력: year (조회 연도)
기준일: year년 1월 1일

포함 조건:
  graduatedAt IS NULL (재학중)
  OR graduatedAt >= 기준일 (해당 연도 또는 이후에 졸업)

제외 조건:
  graduatedAt < 기준일 (해당 연도 이전에 이미 졸업)
```

### B1: Prisma ORM 기반 UseCase (4개)

**대상 파일:**
- `apps/api/src/domains/statistics/application/get-attendance-rate.usecase.ts`
- `apps/api/src/domains/statistics/application/get-by-gender.usecase.ts`
- `apps/api/src/domains/statistics/application/get-group-statistics.usecase.ts`
- `apps/api/src/domains/statistics/application/get-top-groups.usecase.ts`

**변경 내용:**

각 UseCase에서 Student 조회 시 WHERE 조건에 졸업 필터를 추가한다.

```
기존 조건:
  groupId IN (groupIds)
  AND deletedAt IS NULL

변경 조건:
  groupId IN (groupIds)
  AND deletedAt IS NULL
  AND (graduatedAt IS NULL OR graduatedAt >= 해당연도 1월 1일)
```

**UseCase별 변경 위치:**

| UseCase | 메서드 | 변경 대상 |
|---------|--------|----------|
| GetAttendanceRateUseCase | execute | `database.student.count()` WHERE 조건 |
| GetByGenderUseCase | execute | `database.student.findMany()` WHERE 조건 |
| GetGroupStatisticsUseCase | execute | `database.student.findMany()` WHERE 조건 |
| GetTopGroupsUseCase | execute | `database.student.findMany()` WHERE 조건 |

**졸업 기준일 계산:**

```
graduationCutoff = new Date(year, 0, 1)  // 해당 연도 1월 1일
```

### B2: Raw SQL 기반 UseCase (2개)

**대상 파일:**
- `apps/api/src/domains/statistics/application/get-excellent-students.usecase.ts`
- `apps/api/src/domains/statistics/application/get-top-overall.usecase.ts`

**변경 내용:**

SQL WHERE 절에 졸업 필터를 추가한다.

```
기존:
  AND s.delete_at IS NULL

변경:
  AND s.delete_at IS NULL
  AND (s.graduated_at IS NULL OR YEAR(s.graduated_at) >= 조회연도)
```

**UseCase별 변경 위치:**

| UseCase | 변경 대상 |
|---------|----------|
| GetExcellentStudentsUseCase | `$queryRaw` SQL WHERE 절 |
| GetTopOverallUseCase | `$queryRaw` SQL WHERE 절 |

**Raw SQL에서 연도 비교:**

```
YEAR(s.graduated_at) >= ${year}
```

> Note: GetExcellentStudentsUseCase의 year 변수는 string이므로 number 변환 필요

### B3: 통합 테스트

**대상 파일:**
- `apps/api/test/integration/statistics.test.ts`

**추가 테스트 케이스:**

#### TC-1: 졸업 학생이 해당 연도 통계에서 제외됨

```
설정:
  - 재학생 1명 (graduatedAt: null)
  - 2023년 졸업생 1명 (graduatedAt: 2023-12-15)

조회: year = 2024

기대:
  - totalStudents = 1 (재학생만)
  - 2023년 졸업생은 통계에서 제외
```

#### TC-2: 졸업 학생이 졸업 연도 통계에는 포함됨

```
설정:
  - 재학생 1명 (graduatedAt: null)
  - 2024년 졸업생 1명 (graduatedAt: 2024-06-15)

조회: year = 2024

기대:
  - totalStudents = 2 (재학생 + 2024 졸업생)
  - 2024년 졸업생은 2024년 통계에 포함
```

#### TC-3: 모든 학생이 졸업한 경우

```
설정:
  - 2023년 졸업생 2명 (graduatedAt: 2023-12-15)
  - 재학생 0명

조회: year = 2024

기대:
  - totalStudents = 0
  - attendanceRate = 0
```

**테스트 구현 방식:**

기존 `statistics.weekly` 테스트 패턴을 참조하되, `student.count` / `student.findMany` 모킹 시 졸업 학생을 포함/제외하여 반환값을 다르게 설정한다.

> Note: Prisma 모킹에서는 WHERE 조건이 자동으로 적용되지 않으므로, 모킹 반환값 자체를 졸업 필터 적용 후 결과로 설정한다.

## 에러 처리

변경 없음 (기존 에러 처리 유지)

## 구현 시 주의사항

- [ ] GetAttendanceRateUseCase의 `student.count`와 나머지 UseCase의 `student.findMany`는 인터페이스가 다르지만 WHERE 조건 추가 방식은 동일
- [ ] GetExcellentStudentsUseCase의 `year` 변수가 string 타입이므로 SQL 파라미터에 number 변환 필요
- [ ] 기존 테스트의 모킹 호출 순서가 변경되지 않도록 주의 (student.count, student.findMany 호출 위치 유지)

## AI 구현 지침

### 파일 위치
- UseCase: `apps/api/src/domains/statistics/application/get-*.usecase.ts` (6개)
- 테스트: `apps/api/test/integration/statistics.test.ts`

### 참고할 기존 패턴
- Prisma OR 조건: `OR: [{ field: null }, { field: { gte: value } }]`
- Raw SQL 파라미터: `Prisma.sql` 태그드 템플릿
- 테스트 모킹: `mockPrismaClient.student.count.mockResolvedValueOnce()`

---

**작성일**: 2026-02-24
**리뷰 상태**: Draft
