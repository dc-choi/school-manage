# Feature: Refresh Token 인증 확장

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 개요

Access token은 메모리에 보관하고, refresh token은 HttpOnly 쿠키로 관리한다.

## 배경

- Access token만으로는 세션 유지 UX가 불안정하다.
- refresh token은 HttpOnly 쿠키로 관리해야 보안에 유리하다.

## 사용자 스토리

### US-1: 로그인 후 세션을 유지한다
- **사용자**: 사용자
- **원하는 것**: access token 만료 시 자동 갱신되기
- **이유**: 재로그인을 줄이기 위해

### US-2: 토큰이 안전하게 저장된다
- **사용자**: 운영자
- **원하는 것**: refresh token이 브라우저 JS에서 접근 불가하기
- **이유**: XSS 위험을 줄이기 위해

## 기능 요구사항

### 필수 (Must Have)
- [ ] access token은 메모리에 보관한다.
- [ ] refresh token은 HttpOnly 쿠키로 저장한다.
- [ ] refresh token은 1회 사용 시 회전(rotating)된다.
- [ ] refresh token은 DB allow-list로 관리한다.
- [ ] `auth.refresh`로 access token을 재발급한다.
- [ ] `auth.logout`으로 refresh token을 폐기한다.

### 선택 (Nice to Have)
- [ ] CSRF 방어를 위한 Origin/CSRF 토큰 검증

## 엣지 케이스

| 케이스 | 예상 동작 |
|--------|----------|
| refresh token 만료 | 로그아웃 처리 |
| refresh token 재사용 | 요청 거부 및 토큰 폐기 |
| HTTPS 미적용 | Secure 쿠키 비활성화 주의 |

## 인수 조건 (Acceptance Criteria)

- [ ] 로그인 시 refresh token이 HttpOnly 쿠키로 내려온다.
- [ ] refresh 요청 시 access token이 재발급된다.
- [ ] refresh token 회전 정책이 적용된다.
- [ ] 로그아웃 시 refresh token이 폐기된다.

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/auth-refresh-token.md`
- Development: `docs/specs/target/non-functional/development/auth-refresh-token.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-05
**상태**: Draft
