# 기능 설계: 통계

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- PRD: `docs/specs/prd/patron-saint-feast.md` (그룹별 통계 총계 행)
- PRD: `docs/specs/prd/statistics-snapshot.md` (통계 스냅샷)
- PRD: `docs/specs/prd/statistics-graduation-filter.md` (졸업생 필터링)

## 기능 범위

| 기능 | 설명 | 상태 |
|------|------|------|
| 우수 출석 학생 | 연도별 우수 출석 학생 TOP 10 | 구현 완료 |
| 대시보드 통계 (1단계) | 출석률, 성별 분포, 학년별 순위 | 구현 완료 |
| 학년별 통계 총계 행 (2단계) | 학년별 통계 테이블 마지막에 전체 총계 표시 | 미구현 |
| 통계 스냅샷 (2단계) | 엔티티 변경 이력 기반 과거 연도 정확한 통계 조회 | 구현 완료 |
| 통계 졸업생 필터링 (2단계) | 조회 기간 시작일 기준 졸업생 통계 포함/제외 | 구현 완료 |

---

## 우수 출석 학생

- 연도 선택(기본: 현재 연도) → 우수 출석 학생 상위 10명 조회
- 점수: ◎=2점, ○/△=1점, 그 외=0점
- raw SQL 사용, snake_case 필드명 (`society_name`, `count`)

---

## 대시보드 통계 (1단계)

로그인 후 대시보드에 통계 카드 표시:

| 카드 | 내용 |
|------|------|
| 주간/월간 출석률 | 기간별 출석률 % |
| 이번 주 출석 현황 | 출석 학생 수 / 전체 |
| 성별 분포 | 남/여 출석 비율 |
| 학년별 출석률 순위 | TOP 5 |
| 학년별 상세 통계 | 각 학년 주간/월간/연간 출석률 + 평균 인원 |
| 전체 우수 출석 학생 | TOP 5 |

---

## 학년별 통계 총계 행 (2단계)

- 학년별 상세 통계 테이블 마지막에 "총계" 행 표시
- 프론트엔드에서 기존 API 응답 기반 집계 (별도 API 없음)
- 인원: `Sigma(totalStudents)`, 출석률: 가중 평균 `Sigma(율 x 인원) / Sigma(인원)`, 평균 출석: `Sigma(avgAttendance)`

---

## 통계 스냅샷 (2단계)

학생/그룹 변경 시 스냅샷 자동 저장 → 과거 연도 통계에서 당시 이름/학년 기준으로 표시.

- **StudentSnapshot**: studentId, societyName, catholicName, gender, groupId, snapshotAt
- **GroupSnapshot**: groupId, name, snapshotAt
- **Attendance.groupId**: 출석 시점의 그룹 ID 저장
- **조회 규칙**: `snapshotAt <= 기준일`의 가장 최근 스냅샷 사용, 없으면 현재 엔티티 폴백
- **스냅샷 트리거**: Student/Group 생성, 수정, 졸업 처리, 학년 전환

---

## 통계 졸업생 필터링 (2단계)

### 필터링 규칙

**조회 기간 시작일** 기준으로 졸업 여부를 판단합니다:

| 조건 | 포함 여부 | 예시 |
|------|----------|------|
| `graduatedAt IS NULL` | 포함 | 재학생 |
| `graduatedAt >= 기간_시작일` | 포함 | 기간 시작 시점에 아직 졸업 전 |
| `graduatedAt < 기간_시작일` | **제외** | 기간 시작 전에 이미 졸업 |

기간 시작일 결정:
- 주간 조회 (month + week): 해당 주 시작일
- 월간 조회 (month): 해당 월 1일
- 연간 조회 (year만): 해당 연도 1월 1일

### 적용 대상

| UseCase | 쿼리 유형 | 졸업 필터 |
|---------|----------|----------|
| GetAttendanceRateUseCase | Prisma | `graduatedAt >= startDate` |
| GetByGenderUseCase | Prisma | `graduatedAt >= graduationCutoff` |
| GetGroupStatisticsUseCase | Prisma | `graduatedAt >= graduationCutoff` |
| GetTopGroupsUseCase | Prisma | `graduatedAt >= graduationCutoff` |
| GetExcellentStudentsUseCase | Raw SQL | `YEAR(graduated_at) >= year` (연도만 수신) |
| GetTopOverallUseCase | Raw SQL | `graduated_at >= startDateStr` |

---

## API/인터페이스

| 프로시저 | 설명 | 주요 응답 |
|----------|------|----------|
| `statistics.excellent` | 우수 출석 학생 TOP 10 | excellentStudents[] |
| `statistics.weekly` | 주간 출석률 | attendanceRate, avgAttendance, totalStudents |
| `statistics.monthly` | 월간 출석률 | attendanceRate, avgAttendance, totalStudents |
| `statistics.yearly` | 연간 출석률 | attendanceRate, avgAttendance, totalStudents |
| `statistics.byGender` | 성별 분포 | male/female/unknown(count, rate) |
| `statistics.topGroups` | 학년별 출석률 순위 TOP 5 | groups[](groupName, attendanceRate) |
| `statistics.topOverall` | 전체 우수 학생 TOP 5 | students[](societyName, groupName, score) |
| `statistics.groupStatistics` | 학년별 상세 통계 | groups[](weekly/monthly/yearly 출석률 + 평균 인원) |

## 비즈니스 로직

| 기능 | 핵심 로직 |
|------|----------|
| 우수 출석 학생 | raw SQL ◎=2, ○/△=1 합산, TOP 10. 스냅샷 + 졸업 필터 적용 |
| 출석률 | 출석 횟수 / (학생 수 x 일요일 수) x 100. 졸업 필터 적용 |
| 성별 분포 | 성별 분류 → 각 성별 출석률. 스냅샷 gender + 졸업 필터 적용 |
| 학년 순위 | 학년별 출석률 내림차순. attendance.groupId + GroupSnapshot + 졸업 필터 적용 |
| 학년별 상세 | 주간/월간/연간 출석률 + 평균 인원. 졸업 필터 적용 |

> **졸업 필터**: 모든 통계에서 `graduatedAt IS NULL OR graduatedAt >= 조회_기간_시작일` 적용

## 권한/보안

- 모든 통계 API: Bearer 토큰 필수
- 계정 소속 학년의 학생만 집계

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| year 누락 | 현재 연도 대체 |
| 출석 데이터 없음 | 빈 배열 또는 0% |
| 성별 미지정 | "미지정" 카테고리 집계 |
| 토큰 누락 | 401 UNAUTHORIZED |
| 스냅샷 없음 | 현재 엔티티 폴백 |
| 삭제된 그룹 | GroupSnapshot name 사용, 없으면 "삭제된 학년" |
| 기간 시작 전 졸업 | 해당 학생 제외 |
| 전체 학생 졸업 | totalStudents 0, 출석률 0% |

---

**작성일**: 2026-01-13
**수정일**: 2026-02-24 (졸업생 필터링 → 기간 시작일 기반 구현 완료)
**작성자**: PM 에이전트 / SDD 작성자
**상태**: Approved
