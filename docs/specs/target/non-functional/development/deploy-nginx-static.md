# Development: Nginx 정적 배포 + Reverse Proxy

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 관련 문서

- Feature: `docs/specs/target/non-functional/features/deploy-nginx-static.md`
- Task: `docs/specs/target/non-functional/tasks/deploy-nginx-static.md`

## 구현 개요

Nginx에서 프론트 정적 파일과 `/trpc` proxy를 동시에 제공한다.

## 데이터 모델

### 입력 (Input)

```
- Vite dist 산출물 경로
- API upstream 주소
```

### 출력 (Output)

```
- / 정적 서빙
- /trpc reverse proxy
```

### 상태 변경

- Nginx 설정 업데이트

## 비즈니스 로직

### 1. 정적 서빙

```
ROOT -> dist
TRY_FILES -> index.html
```

### 2. API 프록시

```
LOCATION /trpc -> proxy_pass to API
```

## 검증 규칙 (Validation)

| 항목 | 규칙 |
|------|------|
| 정적 서빙 | / 접근 시 index.html 응답 |
| 프록시 | /trpc 요청이 API로 전달 |

## 에러 처리

| 에러 상황 | 대응 |
|----------|------|
| API 다운 | 502 처리 및 로그 확인 |
| 정적 파일 누락 | 배포 산출물 재확인 |

## 테스트 시나리오

### 정상 케이스

1. **정적 서빙**: `/` 접근 시 UI 로드
2. **프록시**: `/trpc` 요청 성공

### 예외 케이스

1. **API 다운**: 502 발생 확인

## 구현 시 주의사항

- HTTPS 적용 시 쿠키 Secure 옵션 동작 확인
- 캐시 정책을 명확히 정의

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

- 관련 파일: Nginx 설정, `apps/web/dist`

---

**작성일**: 2026-01-05
**리뷰 상태**: Draft
