# Specs Index

이 문서는 SDD(Spec-Driven Development) 문서의 인덱스입니다.

## 문서 현황 요약

| 분류                        | 완성도  | 상세                                                            |
|---------------------------|------|---------------------------------------------------------------|
| **Current Functional**    | 100% | 9개 도메인 기능 설계에 통합 + 계정 모델 전환 완료                              |
| **Target Functional**     | -    | 3단계 미착수 4건 (P0 계정 모델 전환 + P0 졸업생 필터링 + P1 엑셀 Import + P0 등록 관리 완료) |
| **Target Non-Functional** | -    | UI 1건 (반응형 구현 완료), SECURITY 1건 완료 + 1건 미착수, PERFORMANCE 1건 미착수 |

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

### Functional Design (기능 설계)

> **병합 규칙**: 기능 설계 문서는 **도메인별 단일 문서**로 관리합니다.
> 상세: `.claude/rules/specs.md` "기능 개선 시 병합 규칙" 참조

| 도메인          | 경로                                                      | 포함 내용                                                      |
|--------------|---------------------------------------------------------|------------------------------------------------------------|
| Auth/Account | `auth-account.md` + `auth-account-extended.md`          | 기본 인증 + 회원가입 / UI 개선, 개인정보 동의, 계정 관리, 셀프 온보딩              |
| Account Model | `account-model-transition.md` + `account-model-transition-flows.md` | 데이터 모델 / 플로우, API, 접근 제어                                   |
| Landing      | `landing-page.md`                                       | 랜딩 페이지 + FAQ + 메타 태그/브랜딩                                   |
| Group        | `group-management.md`                                   | 기본 + 일괄 삭제 + 페이지네이션 상태 유지                                  |
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
| ~~P0~~ | ~~통계 졸업생 필터링~~ | **완료** | 조회 기간 시작일 기준 졸업 필터 — 6개 UseCase 적용 완료 |
| ~~P0~~ | ~~계정 모델 전환 (공유→개인)~~ | **완료** | 개인 계정 + 본당/모임 합류 구조. StudentGroup N:M 도입. 38개 계정 마이그레이션 SQL 포함 |
| P0   | 졸업일 정규화 + 통계 나이 기반 필터링 | 미착수    | 졸업 시 graduatedAt 정규화 + 통계에서 졸업 나이 이상 제외 (중고등부 20살, 초등부 14살) + 기존 데이터 보정 (프로모션 미변경) |
| ~~P1~~ | ~~학생 엑셀 Import~~ | **완료** | 엑셀 파일로 학생 일괄 등록. GA4 입력 부담 시그널 + 파워 유저 100명+ 등록 수요 |
| ~~P0~~ | ~~학생 등록 관리~~ | **완료** | 연/학기 단위 등록 이력 관리 (Registration 테이블). 등록 시즌 대응. 4단계 "등록 관리"의 핵심 선행 (전자서명·보상 제외) |
| P1   | 미사 참례 확인     | 미착수    | 학생별 미사 참례 횟수 기록 (첫영성체 준비 필수 조건)            |
| P2   | 가정 통신문 자동 생성 | 미착수    | 월별 출석/일정/공지 템플릿 기반 PDF/이미지 내보내기            |
| P1   | 학년/부서 두 축 그룹핑 | 미착수    | StudentGroup N:M 활용하여 학생을 학년 그룹 + 부서 그룹에 동시 소속. 기존 컬럼 정리 (Group.accountId, Student.groupId 제거 + NOT NULL 전환) 포함 |
| P2   | 반편성 자동화      | 미착수    | 신학기 학년 진급 시 반 자동 재배정, 교사-반 매칭              |

**의존성 체인:**
- ~~계정 모델 전환 (P0)~~ ← 행사 메모 카드, 사제 보고용 공유 링크, Organization 단위 구독의 선행 조건 (**완료**)
- ~~계정 모델 전환 (P0)~~ ← 학년/부서 두 축 그룹핑 (P1) — 계정 모델 전환의 deferred Step 4 포함 (**선행 완료**)
- 브레인스토밍 조건부 승인 항목은 계정 모델 전환 완료 + 검증 후 등록 예정 (`docs/brainstorm/2026-02-21.md`, `2026-02-23.md` 참조)

### 보류 (Hold)

> 현재 보류 항목 없음

**SDD 문서 작성 시 경로:**
- Task: `docs/specs/target/functional/tasks/{name}.md`
- Development: `docs/specs/target/functional/development/{name}-{role}.md` (role: backend, frontend, design)

### SECURITY (Non-Functional)

| 우선순위 | 기능명                  | SDD 상태 | 비고                                                   |
|------|----------------------|--------|------------------------------------------------------|
| ~~P1~~ | ~~계정 소유권 검증 강화~~    | **완료**  | 계정 모델 전환 시 organizationId 기반 소유권 검증으로 전면 전환           |
| P1   | Refresh token 인증 확장  | 미작성    | 재명세 예정                                               |

**~~계정 소유권 검증 강화~~:** (계정 모델 전환에서 해결)
- scopedProcedure + organizationId 기반 소유권 검증으로 전면 전환
- group/student/attendance 모든 엔드포인트에서 organizationId 검증 적용 완료

**Refresh token 인증 확장:**
- 재명세 예정

### UI (Non-Functional)

| 우선순위 | 기능명          | SDD 상태      | 비고                                     |
|------|--------------|-------------|----------------------------------------|
| ~~P0~~ | ~~반응형 디자인 수정~~ | **구현 완료** | 사이드바/헤더/테이블 모바일 대응. 전 페이지 영향            |
| ~~P2~~ | ~~대시보드 축일자/전례력 카드 통일~~ | **구현 완료** | PatronFeastCard를 LiturgicalSeasonCard와 시각적 통일 (위치/스타일) |

**반응형 디자인 수정:**
- 기능 설계: `docs/specs/functional-design/responsive-design.md`
- 사이드바 모바일 미대응 (항상 80px 표시), 헤더 고정 패딩, Table 가로 스크롤 없음
- ~~EditableField 고정 너비~~ → EditableField 제거됨 (폼 기반 수정으로 전환), 미사용 Header.tsx 정리

**대시보드 축일자/전례력 카드 통일:**
- PatronFeastCard와 LiturgicalSeasonCard가 가톨릭 특화 정보임에도 위치/스타일 불일치
- 두 카드를 나란히 배치하고 카드 스타일 통일

### ANALYTICS (Non-Functional)

| 우선순위 | 기능명                  | SDD 상태 | 비고                                                   |
|------|----------------------|--------|------------------------------------------------------|
| P1   | GA4 account_id 커스텀 디멘션 | 미작성    | 클라이언트 GA4 이벤트에 account_id 추가 → 단체별 WAU 자동 측정 |

**GA4 account_id 커스텀 디멘션:**
- 현재 클라이언트(gtag.js) 19개 이벤트에 account_id 미포함 → GA4에서 단체별 분석 불가
- 로그인 시 analytics 모듈에 accountId 세팅, 이후 모든 이벤트에 자동 포함
- GA4 콘솔에서 커스텀 디멘션 등록 필요

### PERFORMANCE (Non-Functional)

| 우선순위 | 기능명                       | SDD 상태 | 비고                                                       |
|------|---------------------------|--------|---------------------------------------------------------|
| P2   | 웹 테스트 확대                 | 미작성    | 커버리지 ~2% → 주요 페이지/훅 테스트 추가                               |

**웹 테스트 확대:**
- 현재 API 통합 테스트 6개 + 유틸 테스트 4개만 존재
- 웹 컴포넌트/훅 테스트 거의 없음 (~2% 커버리지)

---

## Templates

### 작성자 (PRD/기능 설계/SDD)

| 문서 유형       | 경로                                          |
|-------------|---------------------------------------------|
| PRD         | `docs/specs/templates/prd.md`               |
| 기능 설계       | `docs/specs/templates/functional_design.md` |
| Task        | `docs/specs/templates/task.md`              |
| Development | `docs/specs/templates/development.md`       |

