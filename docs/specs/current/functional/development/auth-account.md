# Development: 인증 및 계정 확인

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 관련 문서

- Feature: `docs/specs/current/functional/features/auth-account.md`
- Task: `docs/specs/current/functional/tasks/auth-account.md`

## 구현 개요

로그인 시 계정 정보를 검증하고 Access Token을 발급한다. 보호된 API는 Bearer 토큰을 파싱하고 만료 여부를 확인한 뒤 계정 정보를 조회한다.

## 데이터 모델

### 입력 (Input)

로그인
```
POST /api/auth/login
{
  id: string (필수) - 계정 이름
  password: string (필수) - 평문 비밀번호
}
```

계정 확인
```
GET /api/account
Authorization: Bearer <accessToken>
```

### 출력 (Output)

공통 응답 래퍼
```
{
  code: number
  message: string
  result?: object
}
```

로그인 성공
```
{
  code: 200
  message: "OK"
  result: {
    name: string
    accessToken: string
  }
}
```

계정 확인 성공
```
{
  code: 200
  message: "OK"
  result: {
    name: string
  }
}
```

### 상태 변경

- 없음 (계정 조회 및 토큰 발급만 수행)

## 비즈니스 로직

### 1. 로그인 처리

```
account = AccountRepository.findByName(id)
IF account is null THEN
  throw NOT_FOUND("ID NOT_FOUND")
IF bcrypt.compare(password, account.password) is false THEN
  throw UNAUTHORIZED("PW is NOT_MATCHED")
accessToken = jwt.sign({ name, timeStamp }, secret, expiresIn)
return { name, accessToken }
```

### 2. 토큰 파싱 및 계정 확인

```
IF Authorization header does not start with "Bearer" THEN
  throw NOT_FOUND("TOKEN NOT_FOUND")
payload = jwt.verify(token, secret)
IF token is expired by timeStamp + expire THEN
  throw UNAUTHORIZED("TOKEN is EXPIRE")
account = AccountRepository.findByName(payload.name)
IF account is null THEN
  throw NOT_FOUND("ID NOT_FOUND")
return { name }
```

## 검증 규칙 (Validation)

| 필드 | 규칙 | 에러 메시지 |
|------|------|------------|
| id | 계정이 존재해야 함 | "NOT_FOUND: ID NOT_FOUND" |
| password | 비밀번호가 일치해야 함 | "UNAUTHORIZED: PW is NOT_MATCHED" |
| Authorization | Bearer 토큰 필수 | "UNAUTHORIZED: TOKEN NOT_FOUND" |
| token | 서명 유효/만료 아님 | "JsonWebTokenError" 또는 "TOKEN is EXPIRE" |

## 에러 처리

| 에러 상황 | 에러 코드 | 응답 |
|----------|----------|------|
| 존재하지 않는 계정 | 404 | NOT_FOUND: ID NOT_FOUND |
| 비밀번호 불일치 | 401 | UNAUTHORIZED: PW is NOT_MATCHED |
| 토큰 누락 | 404 | UNAUTHORIZED: TOKEN NOT_FOUND |
| 토큰 서명 오류 | 401 | jwt 에러명 |
| 토큰 만료 | 401 | TOKEN is EXPIRE |

## 테스트 시나리오

### 정상 케이스

1. **로그인 성공**: 유효한 ID/비밀번호 → `name`, `accessToken` 반환
2. **계정 확인 성공**: 유효한 토큰 → `name` 반환

### 예외 케이스

1. **존재하지 않는 ID**: 로그인 요청 → 404 반환
2. **비밀번호 오류**: 로그인 요청 → 401 반환
3. **토큰 누락**: `/api/account` 요청 → 404 반환

## 구현 시 주의사항

- 모든 응답은 HTTP 200으로 내려가며, `code` 필드로 성공/실패를 구분한다.
- Refresh Token은 현재 구현되지 않았다.

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

- 관련 파일: `src/api/auth/`, `src/api/token/`, `src/api/account/`
- 기존 패턴 참고: `src/api/auth/auth.middleware.ts`
- 테스트 위치: `test/integration/auth.test.ts`, `test/integration/account.test.ts`

---

**작성일**: 2026-01-05
**리뷰 상태**: Approved
