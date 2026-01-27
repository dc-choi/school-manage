# 기능 설계: Refresh Token 인증 확장

> 이 문서는 기능의 **"어떻게 동작하는가"** 를 정의합니다.
> 분류: Non-Functional (Security)

## 연결 문서

- PRD: (해당 없음 - 보안 개선)
- Task: `docs/specs/target/non-functional/tasks/auth-refresh-token.md`
- Development: `docs/specs/target/non-functional/development/auth-refresh-token.md`

## 배경/목표

### 배경

- Access token만으로는 세션 유지 UX가 불안정하다
- Refresh token은 HttpOnly 쿠키로 관리해야 보안에 유리하다
- 현재 access token이 만료되면 재로그인이 필요함

### 목표

- Access token은 메모리에 보관하고, refresh token은 HttpOnly 쿠키로 관리
- Access token 만료 시 자동 갱신으로 UX 개선
- XSS 공격으로부터 refresh token 보호

### 범위

| 포함 | 제외 |
|------|------|
| Refresh token 발급/갱신/폐기 | OAuth/소셜 로그인 연동 |
| HttpOnly 쿠키 관리 | 다중 디바이스 세션 관리 |
| Token rotation 정책 | CSRF 토큰 검증 (추후 검토) |

---

## 변경 대상

### API 변경

| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/auth/login` | POST | 기존 + refresh token 쿠키 발급 추가 |
| `/api/auth/refresh` | POST | 신규 - access token 재발급 |
| `/api/auth/logout` | POST | 신규 - refresh token 폐기 |

### 로그인 응답 변경

```
// 기존
{ code: 200, result: { name, accessToken } }

// 변경
{ code: 200, result: { name, accessToken } }
+ Set-Cookie: refreshToken=xxx; HttpOnly; Secure; SameSite=Strict; Path=/api/auth
```

### Refresh 요청/응답

```
// 요청
POST /api/auth/refresh
Cookie: refreshToken=xxx

// 응답 (성공)
{ code: 200, result: { accessToken } }
+ Set-Cookie: refreshToken=new_xxx; ...  // Token rotation

// 응답 (실패)
{ code: 401, message: "UNAUTHORIZED" }
```

### DB 스키마 (신규)

```sql
CREATE TABLE refresh_token (
  id INT PRIMARY KEY AUTO_INCREMENT,
  account_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES account(id)
);
```

---

## 구현 방식

### Token 정책

| 토큰 | 저장 위치 | 만료 시간 | 갱신 |
|------|----------|----------|------|
| Access token | 메모리 (클라이언트) | 15분 | refresh 요청 |
| Refresh token | HttpOnly 쿠키 | 7일 | 회전 (rotation) |

### Token Rotation

1. Refresh 요청 시 기존 token 검증
2. 기존 token DB에서 삭제
3. 새 token 발급 + DB 저장
4. 새 token 쿠키로 응답

### 클라이언트 처리

1. 401 응답 수신 시 `/api/auth/refresh` 호출
2. 성공 시 새 access token으로 원래 요청 재시도
3. 실패 시 로그아웃 처리

---

## 테스트 시나리오

### 정상 케이스

| TC | 시나리오 | 기대 결과 |
|----|----------|----------|
| TC-1 | 로그인 성공 | access token + refresh token 쿠키 발급 |
| TC-2 | Refresh 요청 | 새 access token + 새 refresh token 발급 |
| TC-3 | 로그아웃 | refresh token 쿠키 삭제 + DB 삭제 |

### 예외 케이스

| TC | 시나리오 | 기대 결과 |
|----|----------|----------|
| TC-E1 | Refresh token 만료 | 401 응답, 로그아웃 처리 |
| TC-E2 | Refresh token 재사용 (이미 rotation됨) | 401 응답, 해당 계정 모든 token 폐기 |
| TC-E3 | Refresh token 없이 refresh 요청 | 401 응답 |

---

**작성일**: 2026-01-28
**상태**: Draft (Feature에서 마이그레이션)
