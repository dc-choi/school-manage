# 기능 설계: 인증 및 계정 관리

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md` (회원가입 포함)
- PRD: `docs/specs/prd/privacy-consent.md` (개인정보 제공동의)
- PRD: `docs/specs/prd/account-self-management.md` (계정 자기 관리)
- PRD: `docs/specs/prd/self-onboarding.md` (셀프 온보딩)

## 기능 범위

| 기능 | 설명 | 상태 |
|------|------|------|
| 기본 인증 | 로그인, 토큰 검증 | 구현 완료 |
| 회원가입 (1단계) | 계정 생성 + 자동 로그인 + 알림 | 구현 완료 |
| 로그인/회원가입 UI 개선 (1단계) | 스플릿 레이아웃, 스크린샷, 사회적 증거 | 구현 완료 |
| 개인정보 제공동의 (2단계) | 신규 가입 시 동의, 기존 회원 소급 동의 | 구현 완료 |
| 계정 자기 관리 (2단계) | 비밀번호 재설정/변경, 이름 변경, 탈퇴/복원 | 구현 완료 |
| 셀프 온보딩 (2단계) | 대시보드 3단계 체크리스트 | 구현 완료 |

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

## 로그인/회원가입 UI 개선 (1단계)

> 사업 근거: `docs/business/STATUS.md` (이탈율 73.3%)

**목표**: 로그인 페이지 이탈율 73.3% → 50% 이하

### AuthLayout 스플릿 레이아웃

- 데스크톱(lg↑): 좌측 히어로(타겟 메시지 + 스크린샷 + 사회적 증거) + 우측 카드(Login/Signup)
- 모바일(lg↓): 히어로 텍스트만(스크린샷 숨김) → 카드 풀 너비

### 히어로 섹션

| 요소 | 내용 |
|------|------|
| 타겟 메시지 | "가톨릭 교회 모임 운영, 더 쉽게" |
| 서브 메시지 | "출석, 학생, 통계를 한곳에서 관리하세요" |
| 스크린샷 | 대시보드 캡처 (최대 480px, 로드 실패 시 숨김) |
| 사회적 증거 | "{N}개 단체가 가입했습니다" (`account.count` API) |

### LoginForm/SignupPage 변경

- LoginForm: 기능 안내 3개 + CardDescription **제거** (히어로로 이전), 회원가입 링크 → 버튼 승격
- SignupPage: 계정 모델 안내 박스 추가, 가입 버튼 "무료로 시작하기", 로그인 링크 → 버튼 승격
- 페이지 전환: 카드 영역 fade + slide-up 애니메이션 (200ms, CSS @keyframes)

### API

| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| `account.count` | query | public | 전체 가입 계정 수 (소프트 삭제 제외) |

---

## 개인정보 제공동의 (2단계)

> PRD: `docs/specs/prd/privacy-consent.md`

### 플로우

- **신규 가입**: 회원가입 폼에 동의 체크박스 추가 → 체크 시 가입 가능 → privacyAgreedAt 자동 기록
- **기존 회원 소급**: 로그인 → privacyAgreedAt null → `/consent` 강제 리다이렉트 → 동의 → 원래 목적지
- **동의 거부**: 확인 다이얼로그 → 로그아웃

### 라우팅

| 경로 | 인증 | 비고 |
|------|------|------|
| `/consent` | protected (동의 불필요) | 소급 동의 화면 (AuthLayout) |

### UI

- `/signup`: 폼 하단에 동의 체크박스 + "개인정보 처리방침 보기"(모달)
- `/consent`: 처리방침 인라인 스크롤 + 동의 체크박스 + "동의하고 계속하기" / "동의하지 않습니다"(로그아웃)
- 처리방침: `PrivacyPolicyContent` 공유 컴포넌트 (SignupPage: 모달, ConsentPage: 인라인)

### 개인정보 처리방침 요약

수집 항목(계정 정보 + 학생 정보), 수집 목적(회원 식별 + 출석 관리), 민감정보(세례명·세례일 선택 입력), 보유 기간(탈퇴 시까지), 위탁/제3자 제공 없음, 교사 책임 하 학생 정보 관리

### 데이터 변경

- Account 테이블: `privacyAgreedAt` (DateTime?, null=미동의) 추가
- 기존 회원: 마이그레이션 시 null, 신규 가입: 가입 시점 자동 설정

### API

| 프로시저 | 타입 | 인증 | 동의 필요 | 설명 |
|----------|------|------|-----------|------|
| `auth.signup` | mutation | public | - | 변경: `privacyAgreed` 필드 추가 (true 필수) |
| `account.get` | query | protected | 불필요 | 변경: `privacyAgreedAt` 반환 추가 |
| `account.agreePrivacy` | mutation | protected | 불필요 | 신규: 동의 기록 (멱등) |

### 접근 제어

| 구분 | 접근 가능 API |
|------|-------------|
| 비인증 | auth.login, auth.signup, auth.checkId, account.count |
| 인증 + 미동의 | account.get, account.agreePrivacy |
| 인증 + 동의 | 모든 보호된 API |

---

## 계정 자기 관리 (2단계)

> PRD: `docs/specs/prd/account-self-management.md`

### 라우팅

| 경로 | 인증 | 비고 |
|------|------|------|
| `/settings` | consented | 계정 설정 (MainLayout) |
| `/reset-password` | public | 비밀번호 재설정 (AuthLayout) |

### UI

- `/settings`: 3개 섹션 — 이름 변경(인라인), 비밀번호 변경(현재/새/확인), 위험 영역(계정 삭제)
- `/reset-password`: 아이디 + 이메일 입력 → 임시 비밀번호 발송
- 헤더 프로필 클릭 → `/settings` 이동

### API

| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| `auth.resetPassword` | mutation | public | 임시 비밀번호 이메일 발송 |
| `auth.restoreAccount` | mutation | public | 삭제된 계정 복원 (2년 이내) |
| `account.changePassword` | mutation | consented | 비밀번호 변경 |
| `account.updateProfile` | mutation | consented | 이름 변경 |
| `account.deleteAccount` | mutation | consented | 계정 탈퇴 (소프트 삭제) |

### 비즈니스 로직

- **비밀번호 재설정**: name 조회 → 미존재 시 성공 응답(보안) → 임시 PW 생성(12자) → 이메일 발송(동기) → 성공 시만 DB 업데이트. 실패 시 `{ success: false, emailFailed: true }`
- **비밀번호 변경**: 현재 PW 검증 → 새 PW bcrypt 해싱 → DB 업데이트 → 세션 클리어 → 재로그인
- **이름 변경**: displayName 업데이트 (2~20자)
- **계정 삭제**: PW 검증 → 트랜잭션(출석→학생→그룹→계정 순서 소프트 삭제)
- **계정 복원**: 삭제된 계정 + PW 검증 → 2년 이내 확인 → 트랜잭션(cascade 복원) → JWT 발급

### 예외 케이스

| 상황 | 처리 |
|------|------|
| 존재하지 않는 ID로 재설정 | 성공 응답 (보안) |
| SMTP 실패 | `emailFailed: true` 반환 |
| 현재 PW 불일치 | 401 UNAUTHORIZED |
| 삭제된 계정 로그인 | ACCOUNT_DELETED → 복원 다이얼로그 |
| 복원 기간 경과 (2년) | 403 FORBIDDEN |

---

## 셀프 온보딩 — 최소 가이드 (2단계)

> PRD: `docs/specs/prd/self-onboarding.md`

### 온보딩 완료 판단 (기존 API 재활용, 신규 API 없음)

| 단계 | 완료 조건 | 사용 API |
|------|----------|----------|
| ① 학년 만들기 | 학년 1개↑ 존재 | `group.list` |
| ② 학생 등록 | 학생 1명↑ 존재 | `student.list` |
| ③ 출석 체크 | 출석 1건↑ 존재 | 기존 통계 API |

- 모든 단계 완료 = 일반 대시보드 표시, 미완료 = 체크리스트 표시
- 데이터 전체 삭제 시 체크리스트 재표시 (의도적 수용)

### UI

- 대시보드에 체크리스트 카드 표시 (일반 대시보드 대신)
- 단계 상태: ✅완료(muted) / →현재(primary, CTA 버튼) / ○대기(muted)
- CTA 클릭 → 해당 페이지 이동 → 완료 후 대시보드 복귀

### 빈 상태 안내 강화

- 학년 목록: + "학년을 만들면 학생을 등록할 수 있어요"
- 학생 목록: + "학생을 등록하면 출석 체크를 시작할 수 있어요"

---

## 공통 사항

### 권한별 접근

| 권한 | 접근 가능 기능 |
|------|---------------|
| 비인증 | 랜딩, 로그인, 회원가입, ID 중복 확인, 계정 수 조회, 비밀번호 재설정, 계정 복원 |
| 인증 + 미동의 | 계정 정보 조회, 개인정보 동의 |
| 인증 + 동의 | 모든 보호된 기능 (계정 설정 포함) |

### 성능/제약

- Access Token만 사용 (Refresh Token 미지원), 만료 시 재로그인
- 예상 트래픽: 동시 접속 수십 명 이내

---

**작성일**: 2026-01-13
**최종 수정**: 2026-02-24
**작성자**: PM 에이전트
**상태**: Approved (구현 완료)
