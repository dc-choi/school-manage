# Development: Docker Hub 계정/권한 분리

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 관련 문서

- Feature: `docs/specs/target/non-functional/features/deploy-dockerhub-access-separation.md`
- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-access-separation.md`

## 구현 개요

CI(push) 계정과 운영(pull) 계정을 분리하고 최소 권한을 적용한다.

## 데이터 모델

### 입력 (Input)

```
- 계정 목록
- repo 권한 정책
```

### 출력 (Output)

```
- 분리된 계정
- 권한 정책
```

### 상태 변경

- 설정/구성 변경

## 비즈니스 로직

### 1. 핵심 설정

```
CREATE ci-bot/deploy-bot
ASSIGN permissions
DOCUMENT access policy
```

## 검증 규칙 (Validation)

| 항목 | 규칙 |
|------|------|
| CI 계정 | push 권한 확인 |
| 운영 계정 | pull-only 확인 |

## 에러 처리

| 에러 상황 | 대응 |
|----------|------|
| 권한 오설정 | 권한 재검증 |
| 계정 공유 | 토큰 회수 |

## 테스트 시나리오

### 정상 케이스

1. **권한 검증**: push/pull 동작 확인

### 예외 케이스

1. **오류 상황**: 실패 시 대응이 수행된다

## 구현 시 주의사항

- 운영 계정에는 최소 권한만 부여한다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

- 관련 파일: `docs/specs/README.md`

---

**작성일**: 2026-01-05
**리뷰 상태**: Draft
