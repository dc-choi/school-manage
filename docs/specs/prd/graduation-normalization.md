# PRD: 졸업일 정규화 + 통계 나이 기반 필터링

> SDD 작성자가 작성하는 제품 요구사항 문서입니다.
> 사업 에이전트의 `docs/business/` 문서를 기반으로 작성합니다.

## 배경/문제 요약

- 참고: `docs/business/6_roadmap/roadmap.md` (2단계), `docs/specs/prd/statistics-graduation-filter.md` (기존 졸업 필터링)
- 문제:
  1. **졸업일이 정규화되지 않음**: 교사가 졸업 처리 시 `getNowKST()` (클릭 시점)이 `graduatedAt`에 기록됨. 학사 연도와 무관한 날짜가 저장되어 통계 기간 비교 시 부정확
  2. **나이 기반 자동 필터링 없음**: 졸업 처리하지 않은 학생도 연령 초과 시 통계에서 제외해야 하나, 현재 `graduatedAt` 기반 시점 필터링만 존재
  3. **Organization에 타입이 없음**: 초등부/중고등부/청년별 졸업 연령 기준을 적용할 수 없음
  4. **Student의 `age` 필드가 정적 숫자**: 등록 시점의 나이(만 나이)가 저장되며 시간 경과에 따라 갱신되지 않음. 연도별 나이 계산에는 출생연도가 필요하나, 사용자 입력 방식(`age`)은 유지
- 현재 상태: 통계 6개 UseCase에 `graduatedAt IS NULL OR graduatedAt >= 조회_기간_시작일` 시점 필터만 적용
- 목표 상태: Organization 타입별 졸업 연령 기준으로 통계 자동 필터링 + 졸업일 학사 연도 말 정규화

## 목표/성공 기준

- **목표**: Organization 타입 + 출생연도 기반으로 졸업 연령 초과 학생을 통계에서 자동 제외하고, 졸업일을 학사 연도 말(12/31)로 정규화
- **성공 지표**:
  - 중고등부(MIDDLE_HIGH): 출생연도 2006년 학생 → 2026년 통계에서 자동 제외 (2025-12-31 기준 졸업)
  - 초등부(ELEMENTARY): 출생연도 2012년 학생 → 2026년 통계에서 자동 제외 (2025-12-31 기준 졸업)
  - 수동 졸업 처리 시 `graduatedAt`이 클릭 시점이 아닌 해당 연도 12/31로 기록
  - 기존 졸업 데이터의 `graduatedAt`이 정규화된 값으로 보정
- **측정 기간**: 배포 즉시 확인 가능

## 사용자/대상

- **주요 사용자**: 교리교사 (통계 조회, 사제 보고)
- **사용 맥락**:
  - 졸업 처리를 하지 않은 학생이 나이가 많아도 통계에 계속 포함되는 문제
  - 졸업 처리 시 날짜가 학사 연도와 맞지 않아 과거 연도 통계 비교 시 혼동

## 범위

### 포함

- Organization 모델에 `type` 필드 추가 (ELEMENTARY, MIDDLE_HIGH, YOUTH)
- Student 모델에 내부 `birthYear` 컬럼 추가 (사용자 입력 `age`에서 파생, UI 변경 없음)
- 졸업 처리 시 `graduatedAt` 정규화 (해당 연도 12/31)
- 통계 6개 UseCase에 출생연도 기반 나이 필터링 추가
- 기존 데이터 마이그레이션 (graduatedAt 정규화 + birthYear 파생)
- 모임 생성 UI에 타입 선택 추가

### 제외

- 자동 졸업 처리 (학생 자동 graduatedAt 설정) — 기존 수동 졸업 유지
- 학년/부서 두 축 그룹핑 (별도 태스크)
- 프로모션(학년 진급) 로직 변경

## 사용자 시나리오

1. **모임 생성 시 타입 선택**: 교리교사가 모임을 생성할 때 "초등부 / 중고등부 / 청년" 중 하나를 선택 (기본값: 중고등부)
2. **학생 등록 시 나이 입력 (기존과 동일)**: 교리교사가 학생을 등록할 때 나이(예: 14)를 입력 → 백엔드가 내부적으로 `birthYear = 현재연도 - age` 자동 계산
3. **통계 자동 필터링**: 교리교사가 2026년 통계를 조회 → 중고등부에서 2026년 기준 20세 이상 학생은 자동 제외
4. **수동 졸업 처리**: 교리교사가 학생을 졸업 처리 → `graduatedAt`이 해당 연도 12/31로 기록
5. **과거 연도 통계 비교**: 2025년 통계 조회 시 해당 연도 기준 나이로 필터링 적용

## 요구사항

### 필수 (Must)

- [ ] Organization.type 필드 추가: `ELEMENTARY` (초등부), `MIDDLE_HIGH` (중고등부), `YOUTH` (청년). 기본값 `MIDDLE_HIGH` (기존 조직 대부분 중고등부)
- [ ] 타입별 졸업 연령 상수 정의: 초등부 14세, 중고등부 20세, 청년 제한 없음
- [ ] Student.birthYear(Int) 내부 컬럼 추가: `age` 필드 유지 + 생성/수정 시 `birthYear = 현재연도 - age` 자동 파생
- [ ] 졸업 처리 시 `graduatedAt` = 해당 연도 12/31 00:00:00 KST로 정규화
- [ ] 통계 6개 UseCase에 출생연도 기반 필터링 추가:
  - GetAttendanceRateUseCase
  - GetByGenderUseCase
  - GetGroupStatisticsUseCase
  - GetTopGroupsUseCase
  - GetExcellentStudentsUseCase (raw SQL)
  - GetTopOverallUseCase (raw SQL)
- [ ] 모임 생성 UI에 타입 선택 드롭다운 추가 (기본값: 중고등부)
- [ ] 기존 데이터 마이그레이션:
  - Organization.type: 전체 `MIDDLE_HIGH` 기본 설정
  - Student.birthYear 파생: `birthYear = YEAR(createdAt) - age` (age가 있는 학생만)
  - 기존 `graduatedAt` 값 정규화: `graduatedAt = YEAR(graduatedAt)-12-31`

### 선택 (Should)

- [ ] 통계 통합 테스트에 나이 기반 필터링 케이스 추가

### 제외 (Out)

- 자동 졸업 처리 (스케줄러/배치)
- 청년부 졸업 연령 정의 (제한 없음으로 처리)
- 학년/부서 두 축 그룹핑 관련 변경
- 프로모션 로직 변경

## 제약/가정/리스크

- **제약**:
  - 기존 `age` 필드가 정적 숫자(만 나이)이므로 출생연도 변환 시 ±1년 오차 가능
- **가정**:
  - `age`는 만 나이(국제 나이) 기준. 사용자 입력 방식 변경 없음
  - 내부 `birthYear` 파생: 생성 시 `현재연도 - age`, 기존 데이터 `YEAR(createdAt) - age`
  - 연도별 나이 계산: `queryYear - birthYear` (예: 2026년 통계에서 birthYear 2006 학생 → 20세)
  - 졸업 연도 계산: `graduationYear = birthYear + maxAge - 1` (해당 나이가 되기 전 해 12/31에 졸업)
    - 예: 출생 2006년, 중고등부(20세) → `2006 + 20 - 1 = 2025` → 2025-12-31 졸업
  - Organization에 `type`이 null인 경우 나이 기반 필터링 미적용 (기존 동작 유지)
  - 청년부(YOUTH)는 졸업 연령 제한 없음
  - 기존 Organization의 기본 타입은 MIDDLE_HIGH (파일럿 대부분 중고등부). 초등부/청년부는 운영자가 DB에서 변경 또는 모임 설정에서 변경
  - `birthYear`가 null인 학생(age 미입력)은 나이 기반 필터링 미적용
- **리스크**:
  - `birthYear` 파생 시 ±1년 오차: 등록 시점과 실제 생년 차이. `age` 수정 시 `birthYear`도 재계산되므로 수용 가능

## 의존성

- **내부**: Statistics 도메인 (6개 UseCase), Student 도메인, Organization 도메인
- **외부**: 없음

## 롤아웃/검증

- **출시 단계**: 단일 배포 (DB 마이그레이션 + 코드 변경)
- **이벤트/로그**: GA4 이벤트 변경 없음
- **검증 방법**:
  - 나이 초과 학생이 있는 계정에서 통계 비교 (필터 적용 전/후)
  - 졸업 처리 후 `graduatedAt` 값이 12/31인지 확인
  - 기존 졸업 데이터의 `graduatedAt`이 정규화되었는지 확인

## 오픈 이슈

- 없음

## 연결 문서

- 사업 문서: `docs/business/6_roadmap/roadmap.md` (2단계)
- 기존 PRD: `docs/specs/prd/statistics-graduation-filter.md` (시점 기반 졸업 필터링)
- 기능 설계: `docs/specs/functional-design/statistics.md` (통계)
- 기능 설계: `docs/specs/functional-design/student-management.md` (학생 관리)

---

**작성일**: 2026-03-12
**작성자**: SDD 작성자
**상태**: Draft
