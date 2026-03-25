# 기능 설계: 인증 및 계정 관리

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md` (회원가입 포함)
- PRD: `docs/specs/prd/privacy-consent.md` (개인정보 제공동의)
- PRD: `docs/specs/prd/account-self-management.md` (계정 자기 관리)
- PRD: `docs/specs/prd/self-onboarding.md` (셀프 온보딩)
- PRD: `docs/specs/prd/admin-transfer.md` (관리자 양도)
- 기능 설계: `docs/specs/functional-design/admin-transfer.md` (관리자 양도 상세)

## 기능 범위

| 기능 | 설명 | 상태 |
|------|------|------|
| 기본 인증 | 로그인, 토큰 검증 | 구현 완료 |
| 회원가입 (1단계) | 계정 생성 + 자동 로그인 + 알림 | 구현 완료 |
| 로그인/회원가입 UI 개선 (1단계) | 스플릿 레이아웃, 스크린샷, 사회적 증거 | 구현 완료 |
| 개인정보 제공동의 (2단계) | 신규 가입 시 동의, 기존 회원 소급 동의 | 구현 완료 |
| 계정 자기 관리 (2단계) | 비밀번호 재설정/변경, 이름 변경, 탈퇴/복원 | 구현 완료 |
| 셀프 온보딩 (2단계) | 대시보드 3단계 체크리스트 | 구현 완료 |
| 관리자 양도 | ADMIN↔TEACHER 역할 교환, 유일 멤버 조직 삭제 | 구현 완료 |

---

## 기본 인증

**플로우**: 로그인(ID/PW) → JWT 발급 → Bearer 헤더로 인증 → 만료 시 재로그인

### API

| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| `auth.login` | mutation | public | 로그인 (토큰 발급) |
| `account.get` | query | protected | 현재 계정 정보 조회 |

- **auth.login**: `name` + `password` → `name`, `displayName`, `accessToken`(JWT). 에러: 404 NOT_FOUND, 401 NOT_MATCHED
- **account.get**: Bearer 헤더 → `name`, `displayName`, `privacyAgreedAt`

### 비즈니스 로직

- **로그인**: ID 조회 → bcrypt 검증 → JWT 발급 (name + timeStamp)
- **토큰 검증**: Bearer 파싱 → JWT 검증 → 만료 확인 → 계정 존재 확인

---

## 회원가입 (1단계)

**플로우**: 회원가입 화면 → ID 중복 확인 → 정보 입력 → 가입 → 자동 로그인 → 대시보드

### 입력 필드

| 필드 | 유효성 검증 |
|------|------------|
| ID | 4~20자, 영문 소문자/숫자만, 중복 불가 |
| displayName | 2~20자 |
| password | 8자 이상 |
| passwordConfirm | password와 일치 |

### API

| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| `auth.signup` | mutation | public | 회원가입 (계정 생성 + 토큰 발급) |
| `auth.checkId` | query | public | ID 중복 확인 |

- **auth.checkId**: `name` → `available`(boolean). 에러: 400 형식 오류
- **auth.signup**: `name`, `displayName`, `password`, `privacyAgreed`(필수, true만) → 자동 로그인. 에러: 409 중복, 400 유효성

### 비즈니스 로직

- ID 소문자 정규화 → 형식 검증 → 중복 확인 → bcrypt 해싱(saltRounds=10) → 계정 생성 → JWT 발급
- 가입 성공 시 운영자 메일 알림 (비동기, 실패 무해)

### 회원가입 알림

- Nodemailer + Google SMTP, 비동기 처리 (응답 지연 없음)
- 환경변수: `SMTP_USER`, `SMTP_PASS`, `ADMIN_EMAIL` (미설정 시 비활성화)
- 구현: `apps/api/src/infrastructure/mail/`

### 측정

| 이벤트 | 설명 |
|--------|------|
| `signup_started` | 회원가입 화면 진입 |
| `signup_id_check` | ID 중복 확인 |
| `signup_completed` | 가입 성공 |
| `signup_failed` | 가입 실패 |

---

## 공통 사항

### 권한별 접근

| 권한 | 접근 가능 기능 |
|------|---------------|
| 비인증 | 랜딩, 로그인, 회원가입, ID 중복 확인, 계정 수 조회, 비밀번호 재설정, 계정 복원 |
| 인증 + 미동의 | 계정 정보 조회, 개인정보 동의 |
| 인증 + 동의 | 모든 보호된 기능 (계정 설정 포함) |

### 성능/제약

- Access Token + Refresh Token (RTR + Token Family) 이중 토큰 구조
- 예상 트래픽: 동시 접속 수십 명 이내

### KST 타임스탬프 정책 (BUGFIX)

RefreshToken의 `createdAt`, `expiresAt` 포함 모든 DB 타임스탬프는 `getNowKST()`를 사용한다. `new Date()` (UTC) 사용 금지.

> 로그인/회원가입 UI 개선, 개인정보 제공동의, 계정 자기 관리, 셀프 온보딩 → `auth-account-extended.md` 참조

---

**작성일**: 2026-01-13
**최종 수정**: 2026-03-12 (확장 기능 분리)
**작성자**: PM 에이전트
**상태**: Approved (구현 완료)
