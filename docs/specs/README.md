# Specs Index

이 문서는 SDD(Spec-Driven Development) 문서의 인덱스입니다.

## 문서 현황 요약

| 분류                        | 완성도  | 상세                                                            |
|---------------------------|------|---------------------------------------------------------------|
| **Current Functional**    | 100% | 10개 도메인 기능 설계에 통합 + 계정 모델 전환 + 학년/부서 그룹핑 완료               |
| **Target Functional**     | -    | 미착수 3건 (P1 미사 참례 + P2 가정 통신문 + P2 반편성), 조직 생성 UX 개선 + 관리자 양도 + 전례력 개선 구현 완료 |
| **Target Non-Functional** | -    | SECURITY 1건 완료, ANALYTICS 1건 완료, PERFORMANCE 3건 미착수 |

## 관련 문서

| 문서                           | 설명                                        |
|------------------------------|-------------------------------------------|
| `.claude/rules/specs.md`     | SDD 워크플로우 + 문서 작성 규칙                      |

---

## PRD & 기능 설계

> **작성자**: SDD 작성자

### PRD (제품 요구사항 문서)

| 문서명           | 경로                                    | 상태               | 비고                |
|---------------|---------------------------------------|------------------|-------------------|
| 주일학교 출석부 프로그램 | `docs/specs/prd/school-attendance.md` | Approved (구현 완료) | 회원가입 포함 (로드맵 1단계) |
| 개인정보 제공동의     | `docs/specs/prd/privacy-consent.md`   | Approved (구현 완료) | 로드맵 2단계           |
| 계정 자기 관리       | `docs/specs/prd/account-self-management.md` | Approved (구현 완료) | 로드맵 2단계           |
| 랜딩 페이지 FAQ     | `docs/specs/prd/landing-faq.md`             | Approved (구현 완료)  | 로드맵 2단계           |
| 셀프 온보딩 (최소 가이드) | `docs/specs/prd/self-onboarding.md`         | Approved (구현 완료) | 로드맵 2단계           |
| 전례 시기/전례력 달력   | `docs/specs/prd/liturgical-calendar.md`     | Approved (구현 완료) | 로드맵 2단계           |
| 세례명 축일자 명단 + 통계 총계 | `docs/specs/prd/patron-saint-feast.md` | Approved (구현 완료) | 로드맵 2단계           |
| 통계 스냅샷           | `docs/specs/prd/statistics-snapshot.md`     | Approved (구현 완료) | 로드맵 2단계           |
| 통계 졸업생 필터링       | `docs/specs/prd/statistics-graduation-filter.md` | Approved (구현 완료) | 로드맵 2단계           |
| 학생 엑셀 Import     | `docs/specs/prd/student-excel-import.md`         | Approved (구현 완료) | 로드맵 2단계           |
| 학생 등록 관리        | `docs/specs/prd/student-registration.md`         | Approved (구현 완료) | 로드맵 2단계 (4단계 선행)  |
| 계정 모델 전환        | `docs/specs/prd/account-model-transition.md`     | Approved (구현 완료) | 로드맵 3단계           |
| 졸업일 정규화 + 나이 기반 필터링 | `docs/specs/prd/graduation-normalization.md` | Approved (구현 완료) | 로드맵 2단계           |
| 학년/부서 두 축 그룹핑    | `docs/specs/prd/dual-axis-grouping.md`       | Approved (구현 완료) | 로드맵 2단계           |
| 관리자 양도             | `docs/specs/prd/admin-transfer.md`           | Approved (구현 완료) | 로드맵 2단계           |
| 조직 생성 UX 개선        | `docs/specs/prd/organization-create-ux.md`   | Approved (구현 완료) | 로드맵 2단계           |
| 전례력 개선 (특전미사 + 성주간/성삼일) | `docs/specs/prd/liturgical-enhancement.md` | Approved (구현 완료) | 로드맵 2단계           |

### Functional Design (기능 설계)

> **병합 규칙**: 기능 설계 문서는 **도메인별 단일 문서**로 관리합니다.
> 상세: `.claude/rules/specs.md` "기능 개선 시 병합 규칙" 참조

| 도메인          | 경로                                                      | 포함 내용                                                      |
|--------------|---------------------------------------------------------|------------------------------------------------------------|
| Auth/Account | `auth-account.md` + `auth-account-extended.md`          | 기본 인증 + 회원가입 / UI 개선, 개인정보 동의, 계정 관리, 셀프 온보딩, 관리자 양도     |
| Account Model | `account-model-transition.md` + `account-model-transition-flows.md` | 데이터 모델 / 플로우, API, 접근 제어                                   |
| Landing      | `landing-page.md`                                       | 랜딩 페이지 + FAQ + 메타 태그/브랜딩                                   |
| Group        | `group-management.md`                                   | 기본 + 일괄 삭제 + 페이지네이션 상태 유지                                  |
| Dual Grouping | `dual-axis-grouping.md` + `dual-axis-grouping-flows.md` | 학년/부서 두 축 그룹핑, 데이터 모델 / 플로우, API, UI                       |
| Student      | `student-management.md` + `-import.md` + `-registration.md` | 기본 CRUD / 엑셀 Import / 등록 관리                                |
| Attendance   | `attendance-management.md`                              | 기본 + 달력 UI + 자동 저장                                         |
| Statistics   | `statistics.md`                                         | 대시보드 통계 + 스냅샷 + 졸업생 필터링                                    |
| Liturgical   | `liturgical-calendar.md`                                | 전례 시기 계산 + 대시보드 전례 카드                                      |
| 도메인 용어 변경    | `domain-terminology-change.md`                          | 그룹→학년, 멤버→학생 UI 라벨 변경 (횡단 관심사)                             |

---

> **SSoT**: 구현 완료된 기능의 진실 원천은 **기능 설계 문서 + 코드베이스**. Task/Development는 구현 완료 후 삭제.

---

## TARGET (구현 예정)

> 개선/이행 예정인 기능입니다.
> 경로: `docs/specs/target/`

### FUNCTIONAL (로드맵 2단계 — 유저 확장 + 가톨릭 특화)

| 우선순위 | 기능명          | SDD 상태 | 비고                                         |
|------|--------------|--------|--------------------------------------------|
| P1   | 조직 생성 UX 개선  | **구현 완료** | organization_type 오선택 방지 + 동일 본당/모임 중복 방지 검증 |
| P1   | 미사 참례 확인     | 미착수    | 학생별 미사 참례 횟수 기록 (첫영성체 준비 필수 조건)            |
| P2   | 가정 통신문 자동 생성 | 미착수    | 월별 출석/일정/공지 템플릿 기반 PDF/이미지 내보내기            |
| P2   | 반편성 자동화      | 미착수    | 신학기 학년 진급 시 반 자동 재배정, 교사-반 매칭              |
| P1   | 관리자 양도        | **구현 완료** | ADMIN→TEACHER 역할 교환, 조직 관리 권한 이전              |
| P2   | 컨텍스트 배너      | 미착수    | 퍼널 병목 구간 상태 기반 배너로 다음 행동 유도 (03-13 승인)     |
| P2   | 전례력 개선 (특전미사 + 성주간/성삼일) | **구현 완료** | 토요일→일요일 전례 표시 + 성주간/성삼일 시기/전례색 구분 |

**의존성 체인:**
- 행사 메모 카드: 계정 모델 전환 완료 + 수요 검증 2곳 후 등록 (`docs/brainstorm/2026-02-23.md`)

### 보류 (Hold)

> 현재 보류 항목 없음

**SDD 문서 작성 시 경로:**
- Task: `docs/specs/target/functional/tasks/{name}.md`
- Development: `docs/specs/target/functional/development/{name}-{role}.md` (role: backend, frontend, design)

### SECURITY (Non-Functional)

| 우선순위 | 기능명                  | SDD 상태 | 비고                                                   |
|------|----------------------|--------|------------------------------------------------------|
| P1   | Refresh token 인증 확장  | **구현 완료** | RTR + Token Family, 브라우저 재시작 후 자동 로그인 |

### ANALYTICS (Non-Functional)

| 우선순위 | 기능명                  | SDD 상태 | 비고                                                   |
|------|----------------------|--------|------------------------------------------------------|
| P1   | GA4 커스텀 디멘션 (계정명+단체명) | **구현 완료** | account_name + organization_name user properties 추가 |
| P2   | 이탈 감지 자동 알림 (운영자용) | 미착수    | 7일/14일 미활동 계정 이메일 알림 — SMTP 인프라 활용 (03-13 승인) |

### PERFORMANCE (Non-Functional)

| 우선순위 | 기능명                       | SDD 상태 | 비고                                                       |
|------|---------------------------|--------|---------------------------------------------------------|
| P2   | 웹 테스트 확대                 | 미작성    | 커버리지 ~2% → 주요 페이지/훅 테스트 추가                               |
| P2   | 졸업 처리 배치 쿼리 최적화       | 미착수    | GraduateStudentsUseCase N+1 쿼리 → updateMany 리팩토링           |
| P2   | 학생 목록 이중 쿼리 최적화       | 미착수    | StudentListPage 졸업 처리 시 active/graduated 두 훅이 각각 invalidate → 2회 API 호출 |

**웹 테스트 확대:**
- 현재 API 통합 테스트 6개 + 유틸 테스트 4개만 존재
- 웹 컴포넌트/훅 테스트 거의 없음 (~2% 커버리지)

**졸업 처리 배치 쿼리 최적화:**
- 현재 학생당 개별 UPDATE + 스냅샷 생성 (N+1 패턴)
- `updateMany`로 졸업 처리 1쿼리 + 스냅샷 N쿼리로 개선 가능
- 50명 이상 배치 시 체감 성능 차이 발생

**학생 목록 이중 쿼리 최적화:**
- StudentListPage에서 재학생/졸업생 두 개의 `useStudents` 훅 사용
- 졸업 처리/취소 시 `utils.student.list.invalidate()`가 양쪽 훅 모두 트리거 → 2회 API 호출
- 단일 쿼리 + 클라이언트 필터링 또는 선택적 invalidation으로 개선 가능

---

## Templates

### 작성자 (PRD/기능 설계/SDD)

| 문서 유형       | 경로                                          |
|-------------|---------------------------------------------|
| PRD         | `docs/specs/templates/prd.md`               |
| 기능 설계       | `docs/specs/templates/functional_design.md` |
| Task        | `docs/specs/templates/task.md`              |
| Development | `docs/specs/templates/development.md`       |

