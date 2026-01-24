# Development: 배포 롤백 전략

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 관련 문서

- Feature: `docs/specs/target/non-functional/features/deploy-dockerhub-rollback.md`
- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-rollback.md`

## 구현 개요

이전 이미지 태그/디제스트로 롤백하는 절차를 문서화한다.

## 데이터 모델

### 입력 (Input)

```
- 이전 태그
- compose 구성
```

### 출력 (Output)

```
- 롤백 절차
```

### 상태 변경

- 설정/구성 변경

## 비즈니스 로직

### 1. 핵심 설정

```
SELECT previous tag
UPDATE compose image
RESTART service
```

## 검증 규칙 (Validation)

| 항목 | 규칙 |
|------|------|
| 롤백 | 서비스 정상 동작 |

## 에러 처리

| 에러 상황 | 대응 |
|----------|------|
| 이미지 누락 | 태그 보관 정책 확인 |

## 테스트 시나리오

### 정상 케이스

1. **롤백 테스트**: 이전 태그로 실행

### 예외 케이스

1. **오류 상황**: 실패 시 대응이 수행된다

## 구현 시 주의사항

- DB 변경이 포함되면 롤백 기준을 별도로 정의한다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

- 관련 파일: `docker-compose.yml`

---

**작성일**: 2026-01-05
**리뷰 상태**: Draft
