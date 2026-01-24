# Specs Index

이 문서는 SDD(Spec-Driven Development) 문서의 인덱스입니다.

## 문서 현황 요약

| 분류                                   | 완성도  | 상세                                                                                |
|--------------------------------------|------|-----------------------------------------------------------------------------------|
| **Current Functional**               | 100% | 5개 도메인 완전 문서화 + 구현 완료 (student-graduation → student-management 병합, statistics 통합) |
| **Target Functional**                | 100% | 로드맵 1단계 완료 (그룹/학생 UI/UX 개선, 졸업 처리 모두 완료)                                          |
| **Target Non-Functional (Deploy)**   | 100% | 13개 기능 SDD 문서 완료                                                                  |
| **Target Non-Functional (Security)** | 50%  | 1/2개 SDD 문서 완료                                                                    |

## 관련 문서

| 문서                       | 설명                    |
|--------------------------|-----------------------|
| `docs/specs/WORKFLOW.md` | SDD 워크플로우 (작성자 + 검수자) |
| `docs/specs/CLAUDE.md`   | SDD 가이드 + PM 에이전트 역할  |

---

## PM 에이전트 산출물

### PRD (제품 요구사항 문서)

| 문서명           | 경로                                    |
|---------------|---------------------------------------|
| 주일학교 출석부 프로그램 | `docs/specs/prd/school-attendance.md` |

### Functional Design (기능 설계)

> **병합 규칙**: 기능 설계 문서는 SDD 문서와 동일하게 **도메인별 단일 문서**로 관리합니다.
> 상세: `docs/specs/WORKFLOW.md` "기능 개선 시 문서 병합 절차" 참조

| 도메인          | 경로                                                      | 포함 내용                                       |
|--------------|---------------------------------------------------------|---------------------------------------------|
| Auth/Account | `docs/specs/functional-design/auth-account.md`          | 기본 인증/계정 관리                                 |
| Group        | `docs/specs/functional-design/group-management.md`      | 기본 + 일괄 삭제 (로드맵 1단계)                        |
| Student      | `docs/specs/functional-design/student-management.md`    | 기본 + 일괄 삭제/복구 + 졸업 처리 + 엑셀 Import (로드맵 1단계) |
| Attendance   | `docs/specs/functional-design/attendance-management.md` | 기본 + 달력 UI + 자동 저장 (로드맵 1단계)                |
| Statistics   | `docs/specs/functional-design/statistics.md`            | 우수 출석 학생 + 대시보드 통계 (로드맵 1단계)                |

#### 보류 (Hold)

| 기능명            | 사유          |
|----------------|-------------|
| 출석 리포트 (주간/월간) | 대시보드 통계로 대체 |

---

## CURRENT (구현 완료)

> 이미 구현되어 운영 중인 기능입니다.
> 경로: `docs/specs/current/functional/`

### Functional

| 기능명                | Feature                             | Task                             | Development                             |
|--------------------|-------------------------------------|----------------------------------|-----------------------------------------|
| Auth/Account       | `features/auth-account.md`          | `tasks/auth-account.md`          | `development/auth-account.md`           |
| Group              | `features/group-management.md`      | `tasks/group-management.md`      | `development/group-management.md`       |
| Student            | `features/student-management.md`    | `tasks/student-management.md`    | `development/student-management.md`     |
| Attendance         | `features/attendance-management.md` | `tasks/attendance-management.md` | `development/attendance-management.md`  |
| Statistics         | `features/statistics.md`            | `tasks/statistics.md`            | `development/statistics.md`             |

> **Note**:
> - Attendance 문서에 달력 UI + 자동 저장 (로드맵 1단계) 내용이 포함되어 있습니다.
> - Group 문서에 UI/UX 개선 + 일괄 삭제 (로드맵 1단계) 내용이 포함되어 있습니다.
> - Student 문서에 UI/UX 개선 + 일괄 삭제/복구 + 졸업 처리 (로드맵 1단계) 내용이 포함되어 있습니다.
> - Statistics 문서에 기본 우수 학생 통계 + 대시보드 통계 (로드맵 1단계) 내용이 포함되어 있습니다.
> - ui-center-alignment는 일회성 작업으로 삭제되었습니다.

---

## TARGET (구현 예정)

> 개선/이행 예정인 기능입니다.
> 경로: `docs/specs/target/`

### FUNCTIONAL (로드맵 1단계)

> **상태**: 완료
> **다음 단계**: 로드맵 2단계 기능 기획 및 PRD 작성

| 우선순위 | 기능명  | 기능 설계 | SDD 상태 | 비고         |
|------|------|-------|--------|------------|
| -    | (없음) | -     | -      | 로드맵 1단계 완료 |

> **완료된 항목** (current로 병합됨):
> - 그룹 UI/UX 개선 (일괄 삭제 포함) → group-management에 병합
> - 학생 UI/UX 개선 (일괄 삭제/복구 + 졸업 처리 포함) → student-management에 병합
> - 대시보드 통계 → statistics에 병합

### 보류 (Hold)

| 기능명            | 기능 설계                     | 사유                |
|----------------|---------------------------|-------------------|
| 학생 엑셀 Import   | `student-excel-import.md` | 임팩트 검증 필요, 피드백 대기 |
| 출석 리포트 (주간/월간) | -                         | 대시보드 통계로 대체       |

**SDD 문서 작성 시 경로:**
- Feature: `docs/specs/target/functional/features/{name}.md`
- Task: `docs/specs/target/functional/tasks/{name}.md`
- Development: `docs/specs/target/functional/development/{name}.md`

### DEPLOY (Non-Functional)

> **상태**: SDD 문서 완료, 구현 대기

| 우선순위 | 기능명                         | Feature                                 | Task                                    | Development                             |
|------|-----------------------------|-----------------------------------------|-----------------------------------------|-----------------------------------------|
| P0   | Docker Hub private repo     | `deploy-dockerhub-private-repo.md`      | `deploy-dockerhub-private-repo.md`      | `deploy-dockerhub-private-repo.md`      |
| P0   | Docker Hub 계정/권한 분리         | `deploy-dockerhub-access-separation.md` | `deploy-dockerhub-access-separation.md` | `deploy-dockerhub-access-separation.md` |
| P0   | Docker 이미지 시크릿 제외           | `deploy-dockerhub-secret-exclusion.md`  | `deploy-dockerhub-secret-exclusion.md`  | `deploy-dockerhub-secret-exclusion.md`  |
| P0   | CI Docker Hub 시크릿 설정        | `deploy-dockerhub-ci-secrets.md`        | `deploy-dockerhub-ci-secrets.md`        | `deploy-dockerhub-ci-secrets.md`        |
| P0   | CI 이미지 빌드/푸시                | `deploy-dockerhub-ci-publish.md`        | `deploy-dockerhub-ci-publish.md`        | `deploy-dockerhub-ci-publish.md`        |
| P0   | 이미지 태깅 전략                   | `deploy-dockerhub-tagging-strategy.md`  | `deploy-dockerhub-tagging-strategy.md`  | `deploy-dockerhub-tagging-strategy.md`  |
| P0   | 운영 서버 Docker 로그인            | `deploy-dockerhub-server-login.md`      | `deploy-dockerhub-server-login.md`      | `deploy-dockerhub-server-login.md`      |
| P0   | 운영 docker-compose 구성        | `deploy-dockerhub-compose-config.md`    | `deploy-dockerhub-compose-config.md`    | `deploy-dockerhub-compose-config.md`    |
| P0   | 운영 배포 커맨드                   | `deploy-dockerhub-deploy-commands.md`   | `deploy-dockerhub-deploy-commands.md`   | `deploy-dockerhub-deploy-commands.md`   |
| P0   | Nginx 정적 배포 + reverse proxy | `deploy-nginx-static.md`                | `deploy-nginx-static.md`                | `deploy-nginx-static.md`                |
| P1   | Docker Hub 보안 정책            | `deploy-dockerhub-token-security.md`    | `deploy-dockerhub-token-security.md`    | `deploy-dockerhub-token-security.md`    |
| P1   | 배포 롤백 전략                    | `deploy-dockerhub-rollback.md`          | `deploy-dockerhub-rollback.md`          | `deploy-dockerhub-rollback.md`          |
| P1   | 주말 컷오버 런북                   | `cutover-runbook.md`                    | `cutover-runbook.md`                    | `cutover-runbook.md`                    |

> 경로 접두사: `docs/specs/target/non-functional/{features|tasks|development}/`

### SECURITY (Non-Functional)

| 우선순위 | 기능명                 | SDD 상태 | 비고                              |
|------|---------------------|--------|---------------------------------|
| P1   | Refresh token 인증 확장 | 완료     | Feature/Task/Development 모두 작성됨 |
| P1   | 계정 소유권 검증 강화        | 미작성    | PM 기능 설계부터 필요                   |

**Refresh token 인증 확장:**
- Feature: `docs/specs/target/non-functional/features/auth-refresh-token.md`
- Task: `docs/specs/target/non-functional/tasks/auth-refresh-token.md`
- Development: `docs/specs/target/non-functional/development/auth-refresh-token.md`

### PERFORMANCE (Non-Functional)

| 우선순위 | 기능명          | SDD 상태 | 비고                     |
|------|--------------|--------|------------------------|
| P1   | 웹 앱 리팩토링/최적화 | 완료     | 코드 품질, 성능, 테스트 커버리지 개선 |

**웹 앱 리팩토링/최적화:**
- Feature: `docs/specs/target/non-functional/features/web-refactoring-optimization.md`
- Task: `docs/specs/target/non-functional/tasks/web-refactoring-optimization.md`
- Development: `docs/specs/target/non-functional/development/web-refactoring-optimization.md`

---

## Templates

### PM 에이전트

| 문서 유형 | 경로                                          |
|-------|---------------------------------------------|
| PRD   | `docs/specs/templates/prd.md`               |
| 기능 설계 | `docs/specs/templates/functional_design.md` |

### SDD 작성자

| 문서 유형       | 경로                                    |
|-------------|---------------------------------------|
| Feature     | `docs/specs/templates/feature.md`     |
| Task        | `docs/specs/templates/task.md`        |
| Development | `docs/specs/templates/development.md` |

### SDD 검수자

| 문서 유형  | 경로                               |
|--------|----------------------------------|
| Review | `docs/specs/templates/review.md` |
