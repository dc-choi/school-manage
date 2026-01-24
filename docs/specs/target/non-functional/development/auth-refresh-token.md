# Development: Refresh Token 인증 확장

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 관련 문서

- Feature: `docs/specs/target/non-functional/features/auth-refresh-token.md`
- Task: `docs/specs/target/non-functional/tasks/auth-refresh-token.md`

## 구현 개요

refresh token을 HttpOnly 쿠키로 관리하고, access token 재발급 흐름을 제공한다.

## 데이터 모델

### 입력 (Input)

```
POST /auth/login
POST /auth/refresh
POST /auth/logout
```

### 출력 (Output)

```
- access token
- refresh cookie
```

### 상태 변경

- refresh token 저장/회전/폐기

## 비즈니스 로직

### 1. 로그인

```
ISSUE access token
ISSUE refresh token
STORE refresh token (hashed)
SET HttpOnly cookie
```

### 2. 토큰 재발급

```
VERIFY refresh token
IF invalid OR revoked THEN reject
ROTATE refresh token
ISSUE new access token
```

### 3. 로그아웃

```
REVOKE refresh token
CLEAR cookie
```

## 검증 규칙 (Validation)

| 항목 | 규칙 |
|------|------|
| 쿠키 | HttpOnly, Secure(HTTPS), SameSite=Lax |
| 저장 | refresh token 해시 저장 |
| 회전 | 1회 사용 시 교체 |

## 에러 처리

| 에러 상황 | 대응 |
|----------|------|
| refresh 만료 | UNAUTHORIZED 처리 |
| refresh 재사용 | 토큰 폐기 후 실패 응답 |

## 테스트 시나리오

### 정상 케이스

1. **로그인**: access + refresh 발급
2. **refresh**: access 재발급
3. **logout**: refresh 폐기

### 예외 케이스

1. **refresh 만료**: 실패 응답
2. **refresh 재사용**: 실패 응답

## 구현 시 주의사항

- refresh token은 localStorage에 저장하지 않는다.
- CSRF 대응이 필요하면 Origin/CSRF 토큰을 병행한다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

- 관련 파일: auth router/service, token repository

---

**작성일**: 2026-01-05
**리뷰 상태**: Draft
