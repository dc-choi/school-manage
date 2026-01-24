# Task: Refresh Token 인증 확장

> 업무 단위 설계 문서입니다.
> Feature 문서를 기반으로 **유스케이스와 엣지 케이스**를 정리합니다.

## 관련 Feature

- `docs/specs/target/non-functional/features/auth-refresh-token.md`

## 목표

refresh token 기반의 access token 재발급 흐름을 제공한다.

## 범위

### 포함
- [x] 로그인 시 refresh token 발급
- [x] refresh 엔드포인트 추가
- [x] refresh token 회전/폐기
- [x] 로그아웃 처리
- [x] 쿠키 옵션 명시

### 제외
- [ ] OAuth 연동
- [ ] 모바일 앱 토큰 전략

## 유스케이스

### UC-1: 로그인

**전제 조건**: 계정 인증 성공

**주요 흐름**:
1. 로그인 요청을 처리한다.
2. access token과 refresh cookie를 발급한다.

**결과**: 세션이 시작된다.

### UC-2: 토큰 재발급

**전제 조건**: 유효한 refresh token이 있음

**주요 흐름**:
1. `auth.refresh`를 호출한다.
2. refresh token을 검증/회전한다.
3. 새 access token을 반환한다.

**결과**: access token이 갱신된다.

### UC-3: 로그아웃

**전제 조건**: refresh token이 있음

**주요 흐름**:
1. `auth.logout` 호출
2. refresh token을 폐기

**결과**: 세션이 종료된다.

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| refresh 만료 | 로그아웃 처리 | High |
| 토큰 재사용 | 요청 거부 + 토큰 폐기 | High |
| 쿠키 미전달 | refresh 실패 처리 | Medium |

## 검증 체크리스트

- [ ] refresh cookie가 HttpOnly로 설정되는가?
- [ ] refresh token이 회전되는가?
- [ ] 로그아웃 시 토큰이 폐기되는가?

## 다음 단계

- [x] Development 문서 작성: `docs/specs/target/non-functional/development/auth-refresh-token.md`

---

**작성일**: 2026-01-05
**담당자**: Codex
**예상 작업량**: L
