# Feature: 이미지 태깅 전략(immutable)

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 개요

immutable tag(sha 또는 버전)을 사용해 배포 추적성과 롤백 가능성을 확보한다.

## 배경

- `latest` 태그는 배포 추적이 어렵다.
- 불변 태그가 롤백에 유리하다.

## 사용자 스토리

### US-1: 어떤 코드가 배포됐는지 알 수 있다
- **사용자**: 운영자
- **원하는 것**: sha/버전 기반 태그 사용
- **이유**: 추적성을 확보하기 위해

### US-2: 롤백이 가능하다
- **사용자**: 운영자
- **원하는 것**: 이전 태그로 쉽게 되돌리기
- **이유**: 장애 대응을 빠르게 하기 위해

## 기능 요구사항

### 필수 (Must Have)
- [ ] immutable tag 규칙을 정의한다.
- [ ] CI가 해당 규칙을 사용한다.
- [ ] `latest` 태그는 보조로만 사용한다.

### 선택 (Nice to Have)
- [ ] digest 기반 고정을 문서화한다.

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| 태그 충돌 | 태그 규칙 재정의 |
| 태그 누락 | CI 검증 추가 |

## 인수 조건 (Acceptance Criteria)

- [ ] 태그 규칙이 문서화되어 있다.
- [ ] 배포가 immutable tag로 이루어진다.

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-tagging-strategy.md`
- Development: `docs/specs/target/non-functional/development/deploy-dockerhub-tagging-strategy.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-05
**상태**: Draft
