# Task: 인증 및 계정 확인

> 업무 단위 설계 문서입니다.
> Feature 문서를 기반으로 **유스케이스와 엣지 케이스**를 정리합니다.

## 관련 Feature

- `docs/specs/current/functional/features/auth-account.md`

## 목표

로그인으로 Access Token을 발급하고, 토큰으로 계정 정보를 확인할 수 있도록 한다.

## 범위

### 포함
- [x] ID/비밀번호 로그인
- [x] Access Token 발급
- [x] 토큰 기반 계정 조회(`/api/account`)
- [x] 토큰 만료/유효성 검사

### 제외
- [ ] Refresh Token 발급/재발급
- [ ] 로그아웃

## 유스케이스

### UC-1: 로그인 성공

**전제 조건**: 계정이 존재하고 비밀번호가 일치한다.

**주요 흐름**:
1. 사용자에게서 ID/비밀번호를 입력받는다.
2. 로그인 요청을 전송한다.
3. 서버가 인증에 성공하면 Access Token을 반환한다.

**결과**: `name`, `accessToken`이 포함된 성공 응답을 받는다.

### UC-2: 로그인 실패

**전제 조건**: 계정이 없거나 비밀번호가 일치하지 않는다.

**주요 흐름**:
1. 잘못된 ID 또는 비밀번호로 로그인 요청을 전송한다.
2. 서버가 인증 실패를 반환한다.

**결과**: NOT_FOUND 또는 UNAUTHORIZED 실패 응답을 받는다.

### UC-3: 계정 확인

**전제 조건**: 유효한 Access Token을 보유하고 있다.

**주요 흐름**:
1. Authorization 헤더에 Bearer 토큰을 포함해 `/api/account` 요청을 보낸다.
2. 서버가 토큰을 검증한다.

**결과**: 계정 이름을 포함한 성공 응답을 받는다.

### UC-4: 토큰 오류 처리

**전제 조건**: 토큰이 누락되었거나 만료/위조되었다.

**주요 흐름**:
1. 토큰 없이 또는 잘못된 토큰으로 `/api/account` 요청을 보낸다.
2. 서버가 토큰 검증에 실패한다.

**결과**: 인증 실패 응답을 받는다.

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| Authorization 헤더 누락 | 인증 실패 응답 | High |
| 토큰 서명/형식 오류 | UNAUTHORIZED 응답 | High |
| 토큰 만료 | UNAUTHORIZED 응답 | High |
| 존재하지 않는 ID | NOT_FOUND 응답 | Medium |
| 비밀번호 누락/비정상 | 실패 응답 | Medium |

## 검증 체크리스트

- [x] 로그인 성공 시 `name`, `accessToken`이 반환되는가?
- [x] 존재하지 않는 ID는 NOT_FOUND로 처리되는가?
- [x] 비밀번호 불일치는 UNAUTHORIZED로 처리되는가?
- [x] 토큰 누락/오류/만료가 적절히 처리되는가?
- [x] `/api/account`가 유효한 토큰에서 정상 응답하는가?

## 다음 단계

- [x] Development 문서 작성: `docs/specs/current/functional/development/auth-account.md`

---

**작성일**: 2026-01-05
**담당자**: Codex
**예상 작업량**: M
