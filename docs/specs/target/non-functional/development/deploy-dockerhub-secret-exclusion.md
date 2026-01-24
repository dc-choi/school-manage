# Development: Docker 이미지 시크릿 제외

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 관련 문서

- Feature: `docs/specs/target/non-functional/features/deploy-dockerhub-secret-exclusion.md`
- Task: `docs/specs/target/non-functional/tasks/deploy-dockerhub-secret-exclusion.md`

## 구현 개요

이미지 빌드 컨텍스트에서 `.env`/시크릿을 제외하고 런타임 주입만 허용한다.

## 데이터 모델

### 입력 (Input)

```
- 시크릿 파일 목록
- Dockerfile/.dockerignore
```

### 출력 (Output)

```
- 시크릿 제외된 이미지
- 런타임 주입 규칙
```

### 상태 변경

- 설정/구성 변경

## 비즈니스 로직

### 1. 핵심 설정

```
UPDATE .dockerignore
VERIFY build context
USE runtime env injection
```

## 검증 규칙 (Validation)

| 항목 | 규칙 |
|------|------|
| 이미지 | 시크릿 미포함 |
| 빌드 컨텍스트 | 불필요 파일 제외 |

## 에러 처리

| 에러 상황 | 대응 |
|----------|------|
| 시크릿 포함 | 빌드 중단 |
| 런타임 누락 | env 파일 보완 |

## 테스트 시나리오

### 정상 케이스

1. **이미지 검사**: 시크릿 파일 존재 여부 확인

### 예외 케이스

1. **오류 상황**: 실패 시 대응이 수행된다

## 구현 시 주의사항

- 시크릿 파일 경로가 늘어나면 `.dockerignore`를 갱신한다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

- 관련 파일: `.dockerignore`, `Dockerfile`, `docker-compose.yml`

---

**작성일**: 2026-01-05
**리뷰 상태**: Draft
