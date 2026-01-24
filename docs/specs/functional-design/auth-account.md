# 기능 설계: 인증 및 계정 확인

> PM 에이전트가 작성하는 기능 설계 문서입니다.
> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- Feature: `docs/specs/current/functional/features/auth-account.md`
- Task: `docs/specs/current/functional/tasks/auth-account.md`
- Development: `docs/specs/current/functional/development/auth-account.md`

## 흐름/상태

### 사용자 플로우

1. 사용자가 로그인 화면에서 ID/비밀번호 입력
2. 시스템이 계정 존재 여부 및 비밀번호 검증
3. 검증 성공 시 Access Token 발급 및 반환
4. 이후 요청에서 토큰을 Authorization 헤더에 포함
5. 시스템이 토큰 유효성 검증 후 요청 처리

### 상태 전이

```
[비인증] → (로그인 성공) → [인증됨]
[인증됨] → (토큰 만료) → [비인증]
[인증됨] → (로그아웃) → [비인증]
```

## UI/UX (해당 시)

### 화면/컴포넌트

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 로그인 | ID/비밀번호 입력 | ID 입력란, 비밀번호 입력란, 로그인 버튼 |
| 헤더 | 로그인 상태 표시 | 계정명 표시, 로그아웃 버튼 |

### 레이아웃 원칙

| 요소 | 정렬 | 비고 |
|------|------|------|
| 로그인 폼 | 중앙 | 화면 중앙에 배치 |
| 입력 필드 | 중앙 | 폼 내부 중앙 정렬 |
| 로그인 버튼 | 중앙 | 폼 내부 중앙 정렬 |

### 권한별 차이

| 권한 | 접근 가능 기능 |
|------|---------------|
| 비인증 | 로그인 화면만 접근 가능 |
| 인증됨 | 모든 보호된 기능 접근 가능 |

## 데이터/도메인 변경

### 엔티티/스키마

**Account 테이블**

| 필드 | 타입 | 설명 |
|------|------|------|
| _id | bigint (PK) | 계정 고유 식별자 |
| name | varchar(50) | 로그인 ID |
| password | varchar(200) | bcrypt 해싱된 비밀번호 |
| create_at | datetime | 생성일시 |
| update_at | datetime | 수정일시 |
| delete_at | datetime | 삭제일시 (소프트 삭제) |

### 마이그레이션

- 변경 내용: 없음 (기존 스키마 유지)

## API/인터페이스

### tRPC 프로시저

| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| `auth.login` | mutation | public | 로그인 (토큰 발급) |
| `account.get` | query | protected | 현재 계정 정보 조회 |

### 레거시 REST (참고용)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | `/api/auth/login` | 로그인 (토큰 발급) |
| GET | `/api/account` | 현재 계정 정보 조회 |

### 요청/응답

**POST /api/auth/login**

요청:
```json
{
  "name": "string (필수)",
  "password": "string (필수)"
}
```

응답 (성공):
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "name": "계정명",
    "accessToken": "JWT 토큰"
  }
}
```

응답 (실패 - ID 없음):
```json
{
  "code": 404,
  "message": "NOT_FOUND: ID NOT_FOUND"
}
```

응답 (실패 - 비밀번호 불일치):
```json
{
  "code": 401,
  "message": "UNAUTHORIZED: PW is NOT_MATCHED"
}
```

**GET /api/account**

요청 헤더:
```
Authorization: Bearer <accessToken>
```

응답 (성공):
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "name": "계정명"
  }
}
```

응답 (실패 - 토큰 없음/만료):
```json
{
  "code": 401,
  "message": "UNAUTHORIZED: TOKEN NOT_FOUND"
}
```

## 권한/보안

- **접근 제어**:
  - `/api/auth/login`: 인증 불필요 (공개)
  - `/api/account`: Bearer 토큰 필수
  - 기타 모든 API: Bearer 토큰 필수
- **감사/로그**:
  - 로그인 시도 로깅
  - 인증 실패 로깅

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 존재하지 않는 ID | 404 NOT_FOUND 반환 |
| 비밀번호 불일치 | 401 UNAUTHORIZED 반환 |
| Authorization 헤더 누락 | 401 UNAUTHORIZED 반환 |
| 잘못된 토큰 형식 | 401 UNAUTHORIZED 반환 |
| 만료된 토큰 | 401 UNAUTHORIZED 반환 |
| 서명 위조된 토큰 | 401 UNAUTHORIZED 반환 |

## 성능/제약

- 예상 트래픽: 동시 접속 수십 명 이내
- 제약 사항:
  - Access Token만 사용 (Refresh Token 미지원)
  - 토큰 만료 시 재로그인 필요

## 측정/모니터링

- **이벤트**:
  - 로그인 성공/실패
  - 토큰 검증 실패
- **알림/경보**:
  - 반복적인 로그인 실패 시 주의 필요 (미구현)

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 유효한 ID/비밀번호로 로그인 → name, accessToken 반환
2. **TC-2**: 유효한 토큰으로 `/api/account` 호출 → name 반환

### 예외 케이스

1. **TC-E1**: 존재하지 않는 ID로 로그인 → 404 반환
2. **TC-E2**: 잘못된 비밀번호로 로그인 → 401 반환
3. **TC-E3**: 토큰 없이 보호된 API 호출 → 401 반환
4. **TC-E4**: 만료된 토큰으로 API 호출 → 401 반환

---

**작성일**: 2026-01-13
**작성자**: PM 에이전트
**상태**: Approved (구현 완료 기반 역산정)
