# Specs Index

이 문서는 SDD(Spec-Driven Development) 문서의 인덱스입니다.

## 문서 현황 요약

| 분류                        | 완성도  | 상세                                                            |
|---------------------------|------|---------------------------------------------------------------|
| **Current Functional**    | 100% | 8개 도메인 기능 설계에 통합 + 통계 스냅샷 구현 완료                              |
| **Target Functional**     | -    | 2단계 미착수 3건                                                    |
| **Target Non-Functional** | -    | SECURITY 2건, PERFORMANCE 1건 미착수 |

## 관련 문서

| 문서                           | 설명                                        |
|------------------------------|-------------------------------------------|
| `docs/specs/WORKFLOW.md`     | SDD 워크플로우 (작성자 + 검수자)                     |
| `docs/specs/AGENT-TEAMS.md`  | Agent Teams 워크플로우 (구현/리뷰 병렬화)              |
| `.claude/rules/specs.md`     | SDD 가이드 + 역할 분리                           |

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

### Functional Design (기능 설계)

> **병합 규칙**: 기능 설계 문서는 SDD 문서와 동일하게 **도메인별 단일 문서**로 관리합니다.
> 상세: `docs/specs/WORKFLOW.md` "기능 개선 시 문서 병합 절차" 참조

| 도메인          | 경로                                                      | 포함 내용                                                      |
|--------------|---------------------------------------------------------|------------------------------------------------------------|
| Auth/Account | `docs/specs/functional-design/auth-account.md`          | 기본 인증/계정 관리 + 회원가입 + 서비스 소개/계정 모델 안내 + 전환율 개선 (로드맵 1단계) + 개인정보 제공동의 + 계정 자기 관리 + 셀프 온보딩 (로드맵 2단계) |
| Landing      | `docs/specs/functional-design/landing-page.md`          | 랜딩 페이지 + 포지셔닝 개선 (로드맵 1단계) + FAQ 섹션 + 메타 태그/브랜딩 정비 (로드맵 2단계) |
| Group        | `docs/specs/functional-design/group-management.md`      | 기본 + 일괄 삭제 + 페이지네이션 상태 유지 (로드맵 1단계)                        |
| Student      | `docs/specs/functional-design/student-management.md`    | 기본 + 일괄 삭제/복구 + 졸업 처리 + 엑셀 Import + 페이지네이션 상태 유지 (로드맵 1단계) + 이달의 축일자 목록 (로드맵 2단계) |
| Attendance   | `docs/specs/functional-design/attendance-management.md` | 기본 + 달력 UI + 자동 저장 (로드맵 1단계)                               |
| Statistics   | `docs/specs/functional-design/statistics.md`            | 우수 출석 학생 + 대시보드 통계 (로드맵 1단계) + 학년별 통계 총계 행 + 통계 스냅샷 (로드맵 2단계) |
| Liturgical   | `docs/specs/functional-design/liturgical-calendar.md`   | 전례 시기 계산 + 대시보드 전례 카드 (로드맵 2단계)                            |
| 도메인 용어 변경    | `docs/specs/functional-design/domain-terminology-change.md` | 그룹→학년, 멤버→학생 UI 라벨 변경 (로드맵 2단계, 횡단 관심사)                    |

---

## CURRENT (구현 완료)

> 이미 구현되어 운영 중인 기능입니다.
> 기존 Task/Development 문서는 기능 설계(functional-design)에 비즈니스 로직이 병합된 후 삭제되었습니다.
> 구현 완료된 기능의 SSoT(Single Source of Truth)는 **기능 설계 문서 + 코드베이스**입니다.

| 도메인          | 기능 설계                                                   |
|--------------|---------------------------------------------------------|
| Auth/Account | `docs/specs/functional-design/auth-account.md`          |
| Landing      | `docs/specs/functional-design/landing-page.md`          |
| Group        | `docs/specs/functional-design/group-management.md`      |
| Student      | `docs/specs/functional-design/student-management.md`    |
| Attendance   | `docs/specs/functional-design/attendance-management.md` |
| Statistics   | `docs/specs/functional-design/statistics.md`            |
| Liturgical   | `docs/specs/functional-design/liturgical-calendar.md`   |
| 도메인 용어 변경    | `docs/specs/functional-design/domain-terminology-change.md` |

---

## TARGET (구현 예정)

> 개선/이행 예정인 기능입니다.
> 경로: `docs/specs/target/`

### FUNCTIONAL (로드맵 2단계 — 유저 확장 + 가톨릭 특화)

| 우선순위 | 기능명          | SDD 상태 | 비고                                         |
|------|--------------|--------|--------------------------------------------|
| P1   | 미사 참례 확인     | 미착수    | 학생별 미사 참례 횟수 기록 (첫영성체 준비 필수 조건)            |
| P2   | 가정 통신문 자동 생성 | 미착수    | 월별 출석/일정/공지 템플릿 기반 PDF/이미지 내보내기            |
| P2   | 반편성 자동화      | 미착수    | 신학기 학년 진급 시 반 자동 재배정, 교사-반 매칭              |

### 보류 (Hold)

| 기능명            | 기능 설계                     | 사유                |
|----------------|---------------------------|-------------------|
| 학생 엑셀 Import   | -                         | 임팩트 검증 필요, 피드백 대기 |

**SDD 문서 작성 시 경로:**
- Task: `docs/specs/target/functional/tasks/{name}.md`
- Development: `docs/specs/target/functional/development/{name}-{role}.md` (role: backend, frontend, design)

### SECURITY (Non-Functional)

| 우선순위 | 기능명                  | SDD 상태 | 비고                                                   |
|------|----------------------|--------|------------------------------------------------------|
| P1   | 계정 소유권 검증 강화         | 미작성    | IDOR 취약점 - 모든 엔드포인트 accountId 검증 필요                  |
| P1   | Refresh token 인증 확장  | 미작성    | 재명세 예정                                               |

**계정 소유권 검증 강화:**
- 프로덕션 데이터 노출 위험 (수평 권한 상승)
- group/student/attendance 모든 get/update/delete 엔드포인트에서 accountId 검증 필요
- 발견 위치: `apps/api/src/domains/group/presentation/group.router.ts:38` 등

**Refresh token 인증 확장:**
- 재명세 예정

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

### 검수자

| 문서 유형  | 경로                               |
|--------|----------------------------------|
| Review | `docs/specs/templates/review.md` |
