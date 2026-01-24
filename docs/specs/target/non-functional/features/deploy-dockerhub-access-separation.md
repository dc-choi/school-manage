# Feature: Docker Hub 계정/권한 분리

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 개요

CI(push) 계정과 운영(pull) 계정을 분리하고 최소 권한을 적용한다.

## 배경

- 단일 계정 사용은 권한 과다로 보안 위험이 높다.
- 운영 서버는 pull-only 권한이면 충분하다.

## 사용자 스토리

### US-1: CI와 운영을 분리한다
- **사용자**: 운영자
- **원하는 것**: push/pull 계정을 분리하기
- **이유**: 권한을 최소화하기 위해

### US-2: 배포 권한을 제한한다
- **사용자**: 보안 담당자
- **원하는 것**: 운영 계정에 read-only 권한만 부여하기
- **이유**: 유출 위험을 줄이기 위해

## 기능 요구사항

### 필수 (Must Have)
- [ ] CI용 계정은 push 권한을 가진다.
- [ ] 운영용 계정은 pull-only 권한을 가진다.
- [ ] 계정/권한 정책을 문서화한다.

### 선택 (Nice to Have)
- [ ] 환경별 계정을 분리한다.

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| 권한 오설정 | 권한 재검증 및 수정 |
| 계정 공유 | 계정 분리 및 토큰 회수 |

## 인수 조건 (Acceptance Criteria)

- [ ] CI 계정은 push가 가능하다.
- [ ] 운영 계정은 pull-only로 제한된다.

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-access-separation.md`
- Development: `docs/specs/target/non-functional/development/deploy-dockerhub-access-separation.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-05
**상태**: Draft
