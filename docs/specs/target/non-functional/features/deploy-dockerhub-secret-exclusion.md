# Feature: Docker 이미지 시크릿 제외

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 개요

이미지 빌드 컨텍스트에서 `.env`/시크릿을 제외하고 런타임 주입만 허용한다.

## 배경

- 시크릿이 이미지에 포함되면 외부 유출 위험이 있다.
- 빌드 컨텍스트를 최소화해야 한다.

## 사용자 스토리

### US-1: 시크릿이 이미지에 포함되지 않는다
- **사용자**: 보안 담당자
- **원하는 것**: 시크릿 파일이 빌드에 포함되지 않게 하기
- **이유**: 유출 위험을 줄이기 위해

### US-2: 런타임에만 시크릿을 주입한다
- **사용자**: 운영자
- **원하는 것**: 서버에서 env 파일로 주입하기
- **이유**: 비밀 정보를 안전하게 유지하기 위해

## 기능 요구사항

### 필수 (Must Have)
- [ ] `.env`/키/토큰 파일을 빌드 컨텍스트에서 제외한다.
- [ ] `.dockerignore`에 시크릿 패턴을 등록한다.
- [ ] 시크릿은 런타임에만 주입한다.

### 선택 (Nice to Have)
- [ ] 시크릿 스캐너를 CI에 추가한다.

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| 새 시크릿 파일 추가 | `.dockerignore` 갱신 |
| 시크릿 커밋 | 즉시 폐기/교체 |

## 인수 조건 (Acceptance Criteria)

- [ ] 이미지 빌드에 시크릿이 포함되지 않는다.
- [ ] `.dockerignore`가 시크릿을 차단한다.

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-secret-exclusion.md`
- Development: `docs/specs/target/non-functional/development/deploy-dockerhub-secret-exclusion.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-05
**상태**: Draft
