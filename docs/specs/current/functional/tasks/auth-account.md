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

## 회원가입 (로드맵 1단계)

> PRD: `docs/specs/prd/school-attendance.md` (로드맵 1단계 섹션)
> Feature: `docs/specs/current/functional/features/auth-account.md`

### 목표

신규 사용자가 스스로 회원가입하여 서비스를 이용할 수 있도록 한다.

### 범위

#### 포함
- [x] 회원가입 화면/폼
- [x] ID 중복 확인 API
- [x] 회원가입 API (계정 생성 + 자동 로그인)
- [x] Account 테이블 display_name 컬럼 추가
- [x] 로그인 화면에 회원가입 링크 추가

#### 제외
- 이메일/전화번호 인증
- 비밀번호 찾기/재설정
- 소셜 로그인
- 약관 동의
- 관리자 승인 프로세스

### 업무 분할

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| A1 | DB 스키마 변경 | Account 테이블에 display_name 컬럼 추가 | - |
| A2 | auth.checkId API | ID 중복 확인 쿼리 프로시저 | A1 |
| A3 | auth.signup API | 회원가입 뮤테이션 프로시저 | A1 |
| A4 | 회원가입 페이지 | SignupPage 컴포넌트 | A2, A3 |
| A5 | 로그인 화면 수정 | 회원가입 링크 추가 | A4 |
| A6 | 기존 로그인 응답 수정 | displayName 필드 추가 | A1 |

### 유스케이스

#### UC-5: 회원가입 성공

**전제 조건**: ID가 중복되지 않고 모든 입력값이 유효하다.

**주요 흐름**:
1. 사용자가 회원가입 화면에서 ID, 이름, 비밀번호, 비밀번호 확인을 입력한다
2. 사용자가 ID 중복 확인 버튼을 클릭한다
3. 시스템이 ID 사용 가능 여부를 반환한다
4. 사용자가 가입하기 버튼을 클릭한다
5. 시스템이 계정을 생성하고 Access Token을 발급한다
6. 사용자가 대시보드로 이동한다

**결과**: `name`, `displayName`, `accessToken`이 포함된 성공 응답, 대시보드로 자동 이동

#### UC-6: ID 중복 확인

**전제 조건**: 사용자가 ID를 입력했다.

**주요 흐름**:
1. 사용자가 ID 입력 후 중복 확인 버튼을 클릭한다
2. 시스템이 해당 ID의 존재 여부를 확인한다

**결과**: `available: true` (사용 가능) 또는 `available: false` (중복)

#### UC-7: 회원가입 실패 - ID 중복

**전제 조건**: 이미 존재하는 ID로 가입을 시도한다.

**주요 흐름**:
1. 사용자가 중복된 ID로 가입하기 버튼을 클릭한다
2. 시스템이 CONFLICT 에러를 반환한다

**결과**: 409 CONFLICT 응답, "이미 사용 중인 아이디입니다" 메시지

#### UC-8: 회원가입 실패 - 유효성 검증

**전제 조건**: 입력값이 유효성 규칙에 맞지 않는다.

**주요 흐름**:
1. 사용자가 유효하지 않은 값으로 가입하기 버튼을 클릭한다
2. 시스템이 BAD_REQUEST 에러를 반환한다

**결과**: 400 BAD_REQUEST 응답, 구체적 에러 메시지

### 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| ID 형식 오류 (특수문자) | 400 BAD_REQUEST | High |
| ID 대문자 입력 | 소문자로 자동 변환 | High |
| ID 길이 오류 | 400 BAD_REQUEST | High |
| ID 중복 | 409 CONFLICT | High |
| 이름 길이 오류 | 400 BAD_REQUEST | Medium |
| 비밀번호 길이 오류 | 400 BAD_REQUEST | Medium |
| 필수 필드 누락 | 400 BAD_REQUEST | Medium |
| 비밀번호 확인 불일치 | 클라이언트에서 가입 버튼 비활성화 | Low |

### 검증 체크리스트

- [x] ID 중복 확인이 정상 동작하는가?
- [x] 대문자 ID가 소문자로 변환되어 저장되는가?
- [x] 회원가입 성공 시 name, displayName, accessToken이 반환되는가?
- [x] 가입 후 자동으로 대시보드로 이동하는가?
- [x] ID 중복 시 409 CONFLICT가 반환되는가?
- [x] 유효성 검증 실패 시 400 BAD_REQUEST가 반환되는가?
- [x] 로그인 화면에서 회원가입 링크가 동작하는가?
- [x] 기존 로그인 응답에 displayName이 포함되는가?

### 다음 단계

- [x] Development 문서 갱신: `docs/specs/current/functional/development/auth-account.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-25
**담당자**: SDD 작성자
**예상 작업량**: M
**상태**: Approved (기본 인증 + 회원가입 구현 완료)
