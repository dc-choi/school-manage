# Specs Index

이 문서는 SDD(Spec-Driven Development) 문서의 인덱스입니다.

## 문서 현황 요약

| 분류                        | 완성도  | 상세                                                            |
|---------------------------|------|---------------------------------------------------------------|
| **Current Functional**    | 100% | 5개 도메인 기능 설계에 통합 (Task/Development → functional-design 병합 완료) |
| **Target Functional**     | 100% | 로드맵 1단계 전체 완료 (UX 라이팅 범용화 포함)                                  |
| **Target Non-Functional** | -    | MEASUREMENT 완료, SECURITY/PERFORMANCE 대기                       |

## 관련 문서

| 문서                       | 설명                    |
|--------------------------|-----------------------|
| `docs/specs/WORKFLOW.md` | SDD 워크플로우 (작성자 + 검수자) |
| `.claude/rules/specs.md` | SDD 가이드 + 역할 분리       |

---

## PRD & 기능 설계

> **작성자**: SDD 작성자

### PRD (제품 요구사항 문서)

| 문서명           | 경로                                    | 상태               | 비고                |
|---------------|---------------------------------------|------------------|-------------------|
| 주일학교 출석부 프로그램 | `docs/specs/prd/school-attendance.md` | Approved (구현 완료) | 회원가입 포함 (로드맵 1단계) |

### Functional Design (기능 설계)

> **병합 규칙**: 기능 설계 문서는 SDD 문서와 동일하게 **도메인별 단일 문서**로 관리합니다.
> 상세: `docs/specs/WORKFLOW.md` "기능 개선 시 문서 병합 절차" 참조

| 도메인          | 경로                                                      | 포함 내용                                                      |
|--------------|---------------------------------------------------------|------------------------------------------------------------|
| Auth/Account | `docs/specs/functional-design/auth-account.md`          | 기본 인증/계정 관리 + 회원가입 + 서비스 소개/계정 모델 안내 (로드맵 1단계)             |
| Group        | `docs/specs/functional-design/group-management.md`      | 기본 + 일괄 삭제 + 페이지네이션 상태 유지 (로드맵 1단계)                        |
| Student      | `docs/specs/functional-design/student-management.md`    | 기본 + 일괄 삭제/복구 + 졸업 처리 + 엑셀 Import + 페이지네이션 상태 유지 (로드맵 1단계) |
| Attendance   | `docs/specs/functional-design/attendance-management.md` | 기본 + 달력 UI + 자동 저장 (로드맵 1단계)                               |
| Statistics   | `docs/specs/functional-design/statistics.md`            | 우수 출석 멤버 + 대시보드 통계 (로드맵 1단계)                               |

#### 보류 (Hold)

| 기능명            | 사유          |
|----------------|-------------|
| 출석 리포트 (주간/월간) | 대시보드 통계로 대체 |

---

## CURRENT (구현 완료)

> 이미 구현되어 운영 중인 기능입니다.
> 기존 Task/Development 문서는 기능 설계(functional-design)에 비즈니스 로직이 병합된 후 삭제되었습니다.
> 구현 완료된 기능의 SSoT(Single Source of Truth)는 **기능 설계 문서 + 코드베이스**입니다.

| 도메인          | 기능 설계                                                   |
|--------------|---------------------------------------------------------|
| Auth/Account | `docs/specs/functional-design/auth-account.md`          |
| Group        | `docs/specs/functional-design/group-management.md`      |
| Student      | `docs/specs/functional-design/student-management.md`    |
| Attendance   | `docs/specs/functional-design/attendance-management.md` |
| Statistics   | `docs/specs/functional-design/statistics.md`            |

---

## TARGET (구현 예정)

> 개선/이행 예정인 기능입니다.
> 경로: `docs/specs/target/`

### FUNCTIONAL (로드맵 1단계)

> **완료된 항목** (current로 병합됨):
> - 그룹 UI/UX 개선 (일괄 삭제 포함) → group-management에 병합
> - 학생 UI/UX 개선 (일괄 삭제/복구 + 졸업 처리 포함) → student-management에 병합
> - 대시보드 통계 → statistics에 병합
> - 목록 페이지네이션 상태 유지 → student-management, group-management에 병합
> - 로그인 서비스 소개 + 계정 모델 안내 → auth-account에 병합
> - UX 라이팅 범용화 ("학생"→"멤버") → `ux-writing-member.md` (비기능적 간소화 워크플로우)
>
> **로드맵 1단계 전체 완료.**

(현재 TARGET Functional 항목 없음)

### 보류 (Hold)

| 기능명            | 기능 설계                     | 사유                |
|----------------|---------------------------|-------------------|
| 학생 엑셀 Import   | `student-excel-import.md` | 임팩트 검증 필요, 피드백 대기 |
| 출석 리포트 (주간/월간) | -                         | 대시보드 통계로 대체       |

**SDD 문서 작성 시 경로:**
- Task: `docs/specs/target/functional/tasks/{name}.md`
- Development: `docs/specs/target/functional/development/{name}-{role}.md` (role: backend, frontend, design)

### SECURITY (Non-Functional)

| 우선순위 | 기능명                 | SDD 상태 | 비고                                  |
|------|---------------------|--------|-------------------------------------|
| P1   | Refresh token 인증 확장 | 완료     | Task/Development 작성됨 (Feature는 레거시) |
| P1   | 계정 소유권 검증 강화        | 미작성    | 기능 설계부터 필요                          |

**Refresh token 인증 확장:**
- 기능 설계: `docs/specs/functional-design/auth-refresh-token.md`
- Task: `docs/specs/target/non-functional/tasks/auth-refresh-token.md`
- Development: `docs/specs/target/non-functional/development/auth-refresh-token.md`

### MEASUREMENT (Non-Functional)

| 우선순위 | 기능명      | SDD 상태 | 비고                    |
|------|----------|--------|----------------------|
| P1   | 회원가입 알림 | **완료** | 신규 가입 시 운영자 메일 알림 |

**회원가입 알림:**
- 기능 설계: `docs/specs/functional-design/signup-notification.md`
- 구현 완료: `apps/api/src/infrastructure/mail/`

### PERFORMANCE (Non-Functional)

| 우선순위 | 기능명          | SDD 상태 | 비고                     |
|------|--------------|--------|------------------------|
| P1   | 웹 앱 리팩토링/최적화 | 완료     | 코드 품질, 성능, 테스트 커버리지 개선 |

**웹 앱 리팩토링/최적화:**
- 기능 설계: `docs/specs/functional-design/web-refactoring-optimization.md`
- Task: `docs/specs/target/non-functional/tasks/web-refactoring-optimization.md`
- Development: `docs/specs/target/non-functional/development/web-refactoring-optimization.md`

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
