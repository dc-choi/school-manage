# PRD: 졸업일 정규화 + 나이 기반 졸업 대상 필터링

> SDD 작성자가 작성하는 제품 요구사항 문서입니다.
> 사업 에이전트의 `docs/business/` 문서를 기반으로 작성합니다.

## 배경/문제 요약

- 참고: `docs/business/6_roadmap/roadmap.md` (2단계), `docs/specs/prd/statistics-graduation-filter.md` (기존 졸업 필터링)
- 문제:
  1. **졸업일이 정규화되지 않음**: 교사가 졸업 처리 시 `getNowKST()` (클릭 시점)이 `graduatedAt`에 기록됨. 학사 연도와 무관한 날짜가 저장되어 통계 기간 비교 시 부정확
  2. **졸업 대상 연령 기준 없음**: 졸업 처리 시 어떤 학생이 졸업 대상인지 연령 기준이 없어 교사가 수동으로 판단해야 함
  3. **Organization에 타입이 없음**: 초등부/중고등부/청년별 졸업 연령 기준을 적용할 수 없음
- 현재 상태: 통계는 `graduatedAt` 기반 시점 필터링 사용 중 (변경 없음). 졸업 처리 시 연령 기준 없음
- 목표 상태: Organization 타입별 졸업 연령 기준으로 졸업 대상 필터링 + 졸업일 학사 연도 말 정규화

## 목표/성공 기준

- **목표**: Organization 타입별 졸업 연령 기준으로 졸업 대상을 필터링하고, 졸업일을 학사 연도 말(12/31)로 정규화
- **성공 지표**:
  - 중고등부(MIDDLE_HIGH): age >= 20인 학생만 졸업 처리 대상
  - 초등부(ELEMENTARY): age >= 14인 학생만 졸업 처리 대상
  - 수동 졸업 처리 시 `graduatedAt`이 클릭 시점이 아닌 해당 연도 12/31로 기록
  - 기존 졸업 데이터의 `graduatedAt`이 정규화된 값으로 보정
- **측정 기간**: 배포 즉시 확인 가능

## 사용자/대상

- **주요 사용자**: 교리교사 (졸업 처리, 통계 조회)
- **사용 맥락**:
  - 졸업 처리 시 졸업 연령 미달 학생이 실수로 졸업될 수 있는 문제
  - 졸업 처리 시 날짜가 학사 연도와 맞지 않아 과거 연도 통계 비교 시 혼동

## 범위

### 포함

- Organization 모델에 `type` 필드 추가 (ELEMENTARY, MIDDLE_HIGH, YOUNG_ADULT)
- 졸업 처리 시 `graduatedAt` 정규화 (해당 연도 12/31)
- 졸업 처리 시 Organization.type별 maxAge 기반 졸업 대상 필터링 (`age >= maxAge`)
- 기존 데이터 마이그레이션 (graduatedAt 정규화)
- 모임 생성 UI에 타입 선택 추가

### 제외

- 자동 졸업 처리 (학생 자동 graduatedAt 설정) — 기존 수동 졸업 유지
- 통계 UseCase 변경 — 기존 `graduatedAt` 기반 시점 필터링 유지
- 학년/부서 두 축 그룹핑 (별도 태스크)
- 프로모션(학년 진급) 로직 변경

## 사용자 시나리오

1. **모임 생성 시 타입 선택**: 교리교사가 모임을 생성할 때 "초등부 / 중고등부 / 청년" 중 하나를 선택 (기본값: 중고등부)
2. **졸업 처리**: 교리교사가 학생 다중 선택 후 졸업 처리 → age >= maxAge인 학생만 졸업 대상, `graduatedAt`이 해당 연도 12/31로 기록
3. **졸업 대상 미달**: age < maxAge인 학생은 졸업 처리에서 제외 (무시)

## 요구사항

### 필수 (Must)

- [ ] Organization.type 필드 추가: `ELEMENTARY` (초등부), `MIDDLE_HIGH` (중고등부), `YOUNG_ADULT` (청년). NOT NULL, 기본값 `MIDDLE_HIGH`
- [ ] 타입별 졸업 연령 상수 정의: 초등부 14세, 중고등부 20세, 청년 제한 없음
- [ ] 졸업 처리 시 `age >= maxAge`인 학생만 졸업 대상으로 필터링 (YOUNG_ADULT는 연령 제한 없이 전부 졸업 가능)
- [ ] 졸업 처리 시 `graduatedAt` = 해당 연도 12/31 00:00:00 KST로 정규화
- [ ] 모임 생성 UI에 타입 선택 드롭다운 추가 (기본값: 중고등부)
- [ ] 기존 데이터 마이그레이션:
  - Organization.type: 전체 `MIDDLE_HIGH` 기본 설정
  - 기존 `graduatedAt` 값 정규화: `graduatedAt = YEAR(graduatedAt)-12-31`

### 선택 (Should)

- [ ] 졸업 처리 통합 테스트에 나이 기반 필터링 케이스 추가

### 제외 (Out)

- 자동 졸업 처리 (스케줄러/배치)
- 청년부 졸업 연령 정의 (제한 없음으로 처리)
- 통계 UseCase 변경 (기존 graduatedAt 기반 필터 유지)
- 학년/부서 두 축 그룹핑 관련 변경
- 프로모션 로직 변경

## 제약/가정/리스크

- **제약**:
  - 없음
- **가정**:
  - `age`는 한국 나이 기준 (현재연도 - 출생연도 + 1). 매년 1/1 스케줄러로 +1 갱신
  - 졸업 대상 판단: `age >= maxAge` (한국 나이 기준 직접 비교)
  - 청년부(YOUNG_ADULT)는 졸업 연령 제한 없음 (전원 졸업 가능)
  - 기존 Organization의 기본 타입은 MIDDLE_HIGH (파일럿 대부분 중고등부)
  - age가 null인 학생(나이 미입력)은 졸업 대상 필터링 미적용 (졸업 가능)
- **리스크**:
  - 없음

## 의존성

- **내부**: Student 도메인, Organization 도메인
- **외부**: 없음

## 롤아웃/검증

- **출시 단계**: 단일 배포 (DB 마이그레이션 + 코드 변경)
- **이벤트/로그**: GA4 이벤트 변경 없음
- **검증 방법**:
  - 졸업 처리 시 age < maxAge 학생이 제외되는지 확인
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
**상태**: Approved (구현 완료)
