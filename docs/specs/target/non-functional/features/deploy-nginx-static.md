# Feature: Nginx 정적 배포 + Reverse Proxy

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 개요

프론트는 Nginx 정적 서빙으로 배포하고, API는 `/trpc` 경로로 reverse proxy한다.

## 배경

- 프론트는 정적 파일로 배포해야 한다.
- API는 동일 출처 방식으로 제공하는 편이 CORS와 쿠키 처리에 유리하다.

## 사용자 스토리

### US-1: 동일 출처로 API를 호출한다
- **사용자**: 개발자/운영자
- **원하는 것**: `/`는 정적 파일, `/trpc`는 API로 전달되기
- **이유**: CORS 문제를 최소화하기 위해

### US-2: 배포 구조를 단순하게 유지한다
- **사용자**: 운영자
- **원하는 것**: Nginx만으로 정적/프록시가 처리되기
- **이유**: 운영 복잡도를 낮추기 위해

## 기능 요구사항

### 필수 (Must Have)
- [ ] Nginx가 프론트 `dist/`를 정적으로 서빙한다.
- [ ] `/trpc` 요청은 API 컨테이너로 reverse proxy한다.
- [ ] 동일 출처 정책에 맞는 경로 구성이 적용된다.
- [ ] HTTPS 적용 시 cookie `Secure` 옵션이 유효하게 동작한다.

### 선택 (Nice to Have)
- [ ] 정적 캐싱 정책을 명시한다.

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| 정적 파일 캐시 | 새 배포 후 캐시 무효화 필요 |
| 프록시 경로 변경 | Nginx 설정 동기화 |
| HTTPS 미적용 | refresh cookie 동작 제한 |

## 인수 조건 (Acceptance Criteria)

- [ ] `/`에서 정적 파일이 제공된다.
- [ ] `/trpc`가 API 컨테이너로 전달된다.
- [ ] 동일 출처 기반으로 쿠키가 전달된다.

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/deploy-nginx-static.md`
- Development: `docs/specs/target/non-functional/development/deploy-nginx-static.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-05
**상태**: Draft
