# Feature: CI 이미지 빌드/푸시

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 개요

CI에서 Docker 이미지를 빌드하고 Docker Hub로 push한다.

## 배경

- 수동 빌드는 재현성과 추적성이 떨어진다.
- CI에서 빌드/푸시를 자동화해야 한다.

## 사용자 스토리

### US-1: 자동 빌드를 수행한다
- **사용자**: 개발자
- **원하는 것**: CI에서 이미지 빌드/푸시 자동화
- **이유**: 배포 효율을 높이기 위해

### US-2: 모노레포 경로를 반영한다
- **사용자**: 개발자
- **원하는 것**: `apps/api` 기준으로 빌드하기
- **이유**: 경로 오류를 방지하기 위해

## 기능 요구사항

### 필수 (Must Have)
- [ ] CI가 Docker Hub에 로그인한다.
- [ ] 이미지를 빌드하고 push한다.
- [ ] 모노레포 경로가 올바르게 적용된다.

### 선택 (Nice to Have)
- [ ] 멀티 플랫폼 빌드를 지원한다.

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| 빌드 실패 | CI 실패 처리 |
| 로그인 실패 | 토큰/권한 확인 |

## 인수 조건 (Acceptance Criteria)

- [ ] CI가 이미지 빌드/푸시에 성공한다.
- [ ] 이미지가 Docker Hub에 존재한다.

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-ci-publish.md`
- Development: `docs/specs/target/non-functional/development/deploy-dockerhub-ci-publish.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-05
**상태**: Draft
