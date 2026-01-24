# Development: 이미지 태깅 전략(immutable)

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 관련 문서

- Feature: `docs/specs/target/non-functional/features/deploy-dockerhub-tagging-strategy.md`
- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-tagging-strategy.md`

## 구현 개요

immutable tag(sha 또는 버전)을 사용해 배포 추적성과 롤백 가능성을 확보한다.

## 데이터 모델

### 입력 (Input)

```
- 태그 규칙
- CI 워크플로우
```

### 출력 (Output)

```
- immutable tag 이미지
```

### 상태 변경

- 설정/구성 변경

## 비즈니스 로직

### 1. 핵심 설정

```
DEFINE tag format
APPLY tag in CI
```

## 검증 규칙 (Validation)

| 항목 | 규칙 |
|------|------|
| 태그 | 불변 규칙 준수 |

## 에러 처리

| 에러 상황 | 대응 |
|----------|------|
| 태그 누락 | CI 실패 처리 |

## 테스트 시나리오

### 정상 케이스

1. **태그 확인**: repo 태그 목록 점검

### 예외 케이스

1. **오류 상황**: 실패 시 대응이 수행된다

## 구현 시 주의사항

- `latest`는 보조 태그로만 사용한다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

- 관련 파일: `.github/workflows/*`

---

**작성일**: 2026-01-05
**리뷰 상태**: Draft
