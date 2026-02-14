# 기능 설계: 통계

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

### 사용자 플로우

1. 통계 화면 진입 → 연도 선택 (기본: 현재 연도)
2. 해당 연도 우수 출석 학생 상위 10명 조회
3. 시상 대상 선정 등에 활용

### 점수 계산 규칙

| 출석 내용 | 점수 |
|----------|------|
| ◎ (쌍동그라미) | 2점 |
| ○ (동그라미) | 1점 |
| △ (세모) | 1점 |
| 그 외 | 0점 |

### 필드명 규칙

| 필드 | 형식 | 이유 |
|------|------|------|
| `society_name` | snake_case | raw SQL 결과 (DB 컬럼명 그대로) |
| `id` | string | BigInt → string 변환 |
| `count` | number | BigInt → number 변환 |

> **Note**: 통계 API는 성능상 raw SQL을 사용하여 snake_case가 노출됩니다.

---

## 대시보드 통계 (로드맵 1단계)

### 배경

현재: 로그인 → 빈 대시보드 → 통계 페이지 별도 이동
변경: 로그인 → 대시보드에 통계 카드들 바로 표시

### 대시보드 통계 카드

| 카드 | 내용 |
|------|------|
| 주간 출석률 | 이번 주 출석률 % |
| 월간 출석률 | 이번 달 출석률 % |
| 이번 주 출석 현황 | 출석한 학생 수 / 전체 (예: 45/50명) |
| 성별 분포 | 남/여 출석 비율 (막대 또는 원형) |
| 그룹별 출석률 순위 | 출석률 높은 그룹 TOP 5 |
| 그룹별 상세 통계 | 각 그룹 주간/월간/연간 출석률 + 평균 인원 |
| 전체 우수 출석 학생 | 전체 TOP 5 |

### 데이터/도메인 변경

Student 테이블에 `gender` 필드 (varchar(10), nullable) 추가됨.

## API/인터페이스

### tRPC 프로시저

| 프로시저 | 타입 | 설명 |
|----------|------|------|
| `statistics.excellent` | query | 우수 출석 학생 TOP 10 |
| `statistics.weekly` | query | 주간 출석률 + 평균 출석 인원 |
| `statistics.monthly` | query | 월간 출석률 + 평균 출석 인원 |
| `statistics.yearly` | query | 연간 출석률 + 평균 출석 인원 |
| `statistics.byGender` | query | 성별 출석 분포 |
| `statistics.topGroups` | query | 그룹별 출석률 순위 TOP 5 |
| `statistics.topOverall` | query | 전체 우수 출석 학생 TOP 5 |
| `statistics.groupStatistics` | query | 그룹별 상세 통계 (주간/월간/연간 출석률 + 평균 출석 인원) |

### 주요 필드

| 프로시저 | 요청 필드 | 응답 필드 |
|----------|----------|----------|
| `excellent` | year(number) | excellentStudents(array: id, society_name, count) |
| `weekly` | year(number) | year, weekStart, weekEnd, attendanceRate |
| `monthly` | year(number) | year, attendanceRate |
| `byGender` | year(number) | year, male/female/unknown(count, rate) |
| `topGroups` | year(number), limit(number) | year, groups(array: groupId, groupName, attendanceRate) |
| `topOverall` | year(number), limit(number) | year, students(array: id, societyName, groupName, score) |
| `groupStatistics` | year(number) | groups(array: groupId, groupName, weekly/monthly/yearly 출석률 + 평균 인원) |

## 비즈니스 로직

| 기능 | 동작 요약 |
|------|----------|
| 우수 출석 학생 | raw SQL로 ◎=2점, ○=1점, △=1점 합산 → 계정 소속 학생만, 점수 높은 순 TOP 10 |
| 출석률 + 평균 출석 인원 | 기간별 출석 횟수 / (전체 학생 수 × 주일·토요일 수) × 100, 평균 인원 = 출석 횟수 / 주일·토요일 수 |
| 성별 분포 | 성별로 학생 분류 → 각 성별 출석률 계산 (미지정은 "unknown") |
| 그룹 순위 | 각 그룹별 출석률 계산 → 내림차순 정렬, limit 적용 |
| 그룹별 상세 통계 | 각 그룹의 주간/월간/연간 출석률 + 평균 출석 인원을 한 번에 반환 |

## 권한/보안

- 모든 통계 API: Bearer 토큰 필수
- 계정 소속 그룹의 학생만 집계

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| year 누락 | 현재 연도로 대체 |
| 출석 데이터 없음 | 빈 배열 또는 0% 반환 |
| 성별 미지정 학생 | "미지정" 카테고리로 집계 |
| 토큰 누락 | 401 UNAUTHORIZED |

## 성능/제약

- 대시보드 로드 시 여러 API 병렬 호출
- 캐시 적용 고려 (1분 TTL)
- 우수 출석 집계: raw SQL 사용

## 테스트 시나리오

### 정상 케이스

1. 연도 지정 조회 → 해당 연도 우수 학생 목록 반환
2. 연도 미지정 → 현재 연도 기준 반환
3. 대시보드 진입 → 모든 통계 카드 로드
4. 주간/월간 출석률 정상 계산
5. 성별 분포, 그룹별 TOP 5, 전체 TOP 5 정상 표시

### 예외 케이스

1. 출석 데이터 없음 → 빈 배열 또는 "데이터 없음"
2. 토큰 없이 접근 → 401

---

**작성일**: 2026-01-13
**수정일**: 2026-02-12 (문서 축약 - 동작 명세 수준으로 정리)
**작성자**: PM 에이전트
**상태**: Approved (구현 완료)
