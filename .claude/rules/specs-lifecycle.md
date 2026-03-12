---
paths:
  - "docs/specs/**"
---

# SDD Lifecycle Rules

검증 체계, 6단계 문서 정리, 예외 처리, 비기능 워크플로우 규칙입니다.

> 핵심 규칙은 `rules/specs.md` 참조

## 검증 체계

검수자 세션 대신 **자동 검증 + 사용자 PR 리뷰**로 품질을 보장합니다.

### 자동 검증 (에이전트 실행)

| 검증 항목   | 도구                                      | 시점            |
|---------|-----------------------------------------|---------------|
| 코드 스타일  | `pnpm lint:fix && pnpm prettier:fix`    | 파일 수정 시 (hook) |
| 타입 안전성  | `pnpm typecheck`                        | 파일 수정 시 (hook) |
| 빌드 성공   | `pnpm build`                            | 구현 완료 후       |
| 테스트 통과  | `pnpm test`                             | 구현 완료 후       |
| 보안 검수   | security-reviewer 서브에이전트                 | PR 생성 전       |
| 디자인 일관성 | design-reviewer 서브에이전트                   | PR 생성 전       |
| 성능 분석   | performance-analyzer 서브에이전트              | PR 생성 전       |

### CI 검증 (GitHub Actions — PR 시 자동)

| 검증 항목   | 도구                                 |
|---------|------------------------------------|
| 코드 스타일  | `pnpm lint && pnpm prettier`       |
| 타입 안전성  | `pnpm typecheck`                   |
| 빌드 성공   | `pnpm build`                       |
| 테스트 통과  | `pnpm test`                        |
| 코드 품질   | SonarCloud Scan                    |

### 사용자 리뷰

- Conductor diff 뷰에서 변경사항 확인 → 머지 결정

## 6단계 문서 정리

### Task/Development 처리

구현 완료 후 `target/` 내 Task/Development 문서를 **삭제**한다. 비기능적 요구사항도 동일.

### 축약 규칙

개선 사항을 기존 기능 설계에 병합할 때, **구현 상세를 삭제하고 동작 명세 수준으로 축약**합니다.

1. **구현 상세 삭제**: JSON 전문, 의사코드, CSS 코드, Tailwind 클래스 등 제거
2. **대체된 섹션 통합**: 이전 기능을 대체하는 개선은 별도 섹션이 아닌 기존 섹션에 통합
3. **와이어프레임 정리**: 중복/중간 단계 와이어프레임 제거, 최종 개념도 1개만 유지

### 프로젝트 현황 동기화 대상

| 문서                     | 동기화 항목             |
|------------------------|--------------------|
| `README.md`            | 기술 스택, 구현 현황       |
| `docs/specs/README.md` | TARGET 인덱스         |
| `.claude/CLAUDE.md`    | 구조, 명령어            |
| `.claude/rules/*.md`   | 패턴/정책 변경 시         |

### 도메인별 메인 문서

| 도메인   | 문서명                        |
|-------|----------------------------|
| 출석    | `attendance-management.md` |
| 학생    | `student-management.md`    |
| 그룹    | `group-management.md`      |
| 통계    | `statistics.md`            |
| 인증/계정 | `auth-account.md`          |

## 예외 처리

| 상황      | 처리                        |
|---------|---------------------------|
| 소규모 변경  | Task/Development 없이 바로 구현 |
| UI만 변경  | Frontend Development만 작성  |
| API만 변경 | Backend Development만 작성   |

## 비기능적 요구사항 (Non-Functional)

비기능적 요구사항은 **간소화된 워크플로우**를 따릅니다.

### 간소화 이유

- 완료 후에는 **코드베이스 자체가 SSoT**
- Task/Development 문서 유지 시 코드와 불일치 발생
- 아키텍처/인프라 변경은 코드와 CLAUDE.md로 추적

### 워크플로우

```
기능 설계 → 바로 구현 → 자동 검증 + 문서 갱신 → PR 생성
```

| 단계 | 담당       | 설명                              |
|----|----------|---------------------------------|
| 1  | SDD 에이전트 | 기능 설계 작성                        |
| 2  | SDD 에이전트 | **바로 구현** (Task/Development 생략) |
| 3  | SDD 에이전트 | 자동 검증 + CLAUDE.md, README.md 갱신 |
| 4  | SDD 에이전트 | PR 생성                           |

### 문서 갱신 대상

| 변경 내용    | 갱신 대상          |
|----------|----------------|
| API 아키텍처 | `rules/api.md` |
| 웹 앱 구조   | `rules/web.md` |
| 환경변수/명령어 | `CLAUDE.md`    |

## 브레인스토밍 결과 반영 규칙

브레인스토밍 결과는 사용자의 명시적 결정 없이 **사업 문서(로드맵, STATUS)에도, SDD TARGET에도 반영하지 않는다.** 로드맵에 정식 반영된 항목만 SDD 등록 대상.
