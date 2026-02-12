# 기능 설계: 인증 및 계정 관리

> PM 에이전트가 작성하는 기능 설계 문서입니다.
> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md` (회원가입 포함)

---

## 기본 인증 (구현 완료)

### 흐름/상태

#### 사용자 플로우

1. 사용자가 로그인 화면에서 ID/비밀번호 입력
2. 시스템이 계정 존재 여부 및 비밀번호 검증
3. 검증 성공 시 Access Token 발급 및 반환
4. 이후 요청에서 토큰을 Authorization 헤더에 포함
5. 시스템이 토큰 유효성 검증 후 요청 처리

#### 상태 전이

```
[비인증] → (로그인 성공) → [인증됨]
[인증됨] → (토큰 만료) → [비인증]
[인증됨] → (로그아웃) → [비인증]
```

### UI/UX

#### 화면/컴포넌트

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 로그인 | ID/비밀번호 입력 | ID 입력란, 비밀번호 입력란, 로그인 버튼 |
| 헤더 | 로그인 상태 표시 | 계정명 표시, 로그아웃 버튼 |

#### 레이아웃 원칙

| 요소 | 정렬 | 비고 |
|------|------|------|
| 로그인 폼 | 중앙 | 화면 중앙에 배치 |
| 입력 필드 | 중앙 | 폼 내부 중앙 정렬 |
| 로그인 버튼 | 중앙 | 폼 내부 중앙 정렬 |

### API/인터페이스 (기본 인증)

#### tRPC 프로시저

| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| `auth.login` | mutation | public | 로그인 (토큰 발급) |
| `account.get` | query | protected | 현재 계정 정보 조회 |

#### 요청/응답

**auth.login**

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
    "name": "계정ID",
    "displayName": "표시명",
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

**account.get**

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
    "name": "계정ID",
    "displayName": "표시명"
  }
}
```

### 비즈니스 로직 (기본 인증)

#### 로그인 처리

```
account = AccountRepository.findByName(id)
IF account is null THEN
  throw NOT_FOUND("ID NOT_FOUND")
IF bcrypt.compare(password, account.password) is false THEN
  throw UNAUTHORIZED("PW is NOT_MATCHED")
accessToken = jwt.sign({ name, timeStamp }, secret, expiresIn)
return { name, displayName, accessToken }
```

#### 토큰 파싱 및 계정 확인

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

### 예외/엣지 케이스 (기본 인증)

| 상황 | 처리 방법 |
|------|----------|
| 존재하지 않는 ID | 404 NOT_FOUND 반환 |
| 비밀번호 불일치 | 401 UNAUTHORIZED 반환 |
| Authorization 헤더 누락 | 401 UNAUTHORIZED 반환 |
| 잘못된 토큰 형식 | 401 UNAUTHORIZED 반환 |
| 만료된 토큰 | 401 UNAUTHORIZED 반환 |
| 서명 위조된 토큰 | 401 UNAUTHORIZED 반환 |

### 테스트 시나리오 (기본 인증)

#### 정상 케이스

1. **TC-1**: 유효한 ID/비밀번호로 로그인 → name, displayName, accessToken 반환
2. **TC-2**: 유효한 토큰으로 `account.get` 호출 → name, displayName 반환

#### 예외 케이스

1. **TC-E1**: 존재하지 않는 ID로 로그인 → 404 반환
2. **TC-E2**: 잘못된 비밀번호로 로그인 → 401 반환
3. **TC-E3**: 토큰 없이 보호된 API 호출 → 401 반환
4. **TC-E4**: 만료된 토큰으로 API 호출 → 401 반환

---

## 회원가입 (로드맵 1단계)

> PRD: `docs/specs/prd/school-attendance.md` (로드맵 1단계 섹션)

### 흐름/상태

#### 사용자 플로우

```
[로그인 화면] → (회원가입 클릭) → [회원가입 화면]
     ↓
[ID 입력] → (중복 확인) → [이름 입력] → [비밀번호 입력] → [비밀번호 확인]
     ↓
[가입하기 클릭] → (검증 성공) → [계정 생성] → [자동 로그인] → [대시보드]
```

#### 상태 전이

```
[비인증] → (회원가입 완료) → [인증됨]
```

### UI/UX

#### 화면/컴포넌트

| 화면 | 설명 | 주요 요소 |
|------|------|----------|
| 회원가입 | 계정 생성 폼 | ID, 이름, 비밀번호, 비밀번호 확인, 가입 버튼 |

#### 입력 필드 상세

| 필드 | 라벨 | 타입 | 필수 | 유효성 검증 |
|------|------|------|------|------------|
| ID | 아이디 | text | O | 4~20자, 영문 소문자/숫자만, 중복 불가 |
| displayName | 이름 | text | O | 2~20자 |
| password | 비밀번호 | password | O | 8자 이상 |
| passwordConfirm | 비밀번호 확인 | password | O | password와 일치 |

#### 레이아웃

| 요소 | 정렬 | 비고 |
|------|------|------|
| 회원가입 폼 | 중앙 | 화면 중앙에 배치 |
| 입력 필드 | 중앙 | 폼 내부 중앙 정렬, 세로 배치 |
| ID 중복확인 | 우측 | ID 입력란 우측에 버튼 |
| 가입 버튼 | 중앙 | 폼 하단 중앙 |
| 로그인 링크 | 중앙 | 폼 하단 "이미 계정이 있으신가요? 로그인" |

#### 유효성 피드백

| 상황 | 메시지 | 위치 |
|------|--------|------|
| ID 형식 오류 | "영문 소문자와 숫자만 사용 가능합니다" | ID 필드 하단 |
| ID 길이 오류 | "4~20자로 입력해주세요" | ID 필드 하단 |
| ID 중복 | "이미 사용 중인 아이디입니다" | ID 필드 하단 |
| ID 사용 가능 | "사용 가능한 아이디입니다" | ID 필드 하단 (성공) |
| 이름 길이 오류 | "2~20자로 입력해주세요" | 이름 필드 하단 |
| 비밀번호 길이 오류 | "8자 이상 입력해주세요" | 비밀번호 필드 하단 |
| 비밀번호 불일치 | "비밀번호가 일치하지 않습니다" | 비밀번호 확인 필드 하단 |

#### 로그인 화면 변경

| 요소 | 추가 내용 |
|------|----------|
| 회원가입 링크 | 로그인 버튼 하단에 "계정이 없으신가요? 회원가입" 링크 추가 |

### 데이터/도메인 변경

#### 엔티티/스키마

**Account 테이블 (변경)**

| 필드 | 타입 | 설명 | 변경 |
|------|------|------|------|
| _id | bigint (PK) | 계정 고유 식별자 | 기존 |
| name | varchar(20) | 로그인 ID (영문 소문자/숫자) | 기존 (길이 변경) |
| display_name | varchar(20) | 표시용 이름 | **신규** |
| password | varchar(200) | bcrypt 해싱된 비밀번호 | 기존 |
| create_at | datetime | 생성일시 | 기존 |
| update_at | datetime | 수정일시 | 기존 |
| delete_at | datetime | 삭제일시 (소프트 삭제) | 기존 |

#### 마이그레이션

```sql
-- display_name 컬럼 추가
ALTER TABLE account ADD COLUMN display_name VARCHAR(20) NOT NULL DEFAULT '' AFTER name;

-- 기존 계정의 display_name을 name으로 초기화 (또는 별도 값 설정)
UPDATE account SET display_name = name WHERE display_name = '';
```

### API/인터페이스 (회원가입)

#### tRPC 프로시저

| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| `auth.signup` | mutation | public | 회원가입 (계정 생성 + 토큰 발급) |
| `auth.checkId` | query | public | ID 중복 확인 |

#### 요청/응답

**auth.checkId**

요청:
```json
{
  "name": "string (필수, 4~20자, 영문 소문자/숫자)"
}
```

응답 (사용 가능):
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "available": true
  }
}
```

응답 (중복):
```json
{
  "code": 200,
  "message": "OK",
  "result": {
    "available": false
  }
}
```

응답 (형식 오류):
```json
{
  "code": 400,
  "message": "BAD_REQUEST: Invalid ID format"
}
```

**auth.signup**

요청:
```json
{
  "name": "string (필수, 4~20자, 영문 소문자/숫자)",
  "displayName": "string (필수, 2~20자)",
  "password": "string (필수, 8자 이상)"
}
```

응답 (성공):
```json
{
  "code": 201,
  "message": "CREATED",
  "result": {
    "name": "계정ID",
    "displayName": "표시명",
    "accessToken": "JWT 토큰"
  }
}
```

응답 (실패 - ID 중복):
```json
{
  "code": 409,
  "message": "CONFLICT: ID already exists"
}
```

응답 (실패 - 유효성 검증):
```json
{
  "code": 400,
  "message": "BAD_REQUEST: [구체적 오류 메시지]"
}
```

### 비즈니스 로직 (회원가입)

#### ID 중복 확인 (auth.checkId)

```
normalizedName = name.toLowerCase()
IF normalizedName does not match /^[a-z0-9]{4,20}$/ THEN
  throw BAD_REQUEST("Invalid ID format")
account = AccountRepository.findByName(normalizedName)
IF account exists THEN
  return { available: false }
ELSE
  return { available: true }
```

#### 회원가입 (auth.signup)

```
normalizedName = name.toLowerCase()
IF normalizedName does not match /^[a-z0-9]{4,20}$/ THEN
  throw BAD_REQUEST("ID는 4~20자의 영문 소문자/숫자만 가능합니다")
IF displayName.length < 2 OR displayName.length > 20 THEN
  throw BAD_REQUEST("이름은 2~20자로 입력해주세요")
IF password.length < 8 THEN
  throw BAD_REQUEST("비밀번호는 8자 이상이어야 합니다")
existingAccount = AccountRepository.findByName(normalizedName)
IF existingAccount exists THEN
  throw CONFLICT("이미 사용 중인 아이디입니다")
hashedPassword = bcrypt.hash(password, saltRounds=10)
account = AccountRepository.create({
  name: normalizedName,
  displayName: displayName,
  password: hashedPassword,
  createdAt: now()
})
accessToken = jwt.sign({ id: account.id, name: account.name }, secret, expiresIn)
return { name: account.name, displayName: account.displayName, accessToken }
```

### 권한/보안

- **접근 제어**:
  - `auth.signup`: 인증 불필요 (공개)
  - `auth.checkId`: 인증 불필요 (공개)
- **보안 고려사항**:
  - 비밀번호는 bcrypt로 해싱하여 저장
  - ID는 대소문자 구분 없이 소문자로 정규화하여 저장
  - Rate limiting 고려 (향후)

### 예외/엣지 케이스 (회원가입)

| 상황 | 처리 방법 |
|------|----------|
| ID 형식 오류 (특수문자, 대문자) | 400 BAD_REQUEST, 대문자는 소문자로 자동 변환 |
| ID 길이 오류 (4~20자 벗어남) | 400 BAD_REQUEST |
| ID 중복 | 409 CONFLICT |
| 이름 길이 오류 (2~20자 벗어남) | 400 BAD_REQUEST |
| 비밀번호 길이 오류 (8자 미만) | 400 BAD_REQUEST |
| 빈 필드 제출 | 400 BAD_REQUEST |

### 측정/모니터링

#### 이벤트

| 이벤트 | 설명 | 파라미터 |
|--------|------|----------|
| `signup_started` | 회원가입 화면 진입 | - |
| `signup_id_check` | ID 중복 확인 클릭 | available: boolean |
| `signup_submitted` | 가입하기 버튼 클릭 | - |
| `signup_completed` | 가입 성공 | accountId |
| `signup_failed` | 가입 실패 | reason |

### 테스트 시나리오 (회원가입)

#### 정상 케이스

1. **TC-S1**: 유효한 정보로 회원가입 → 계정 생성, 자동 로그인, 대시보드 이동
2. **TC-S2**: ID 중복 확인 (사용 가능) → available: true
3. **TC-S3**: ID 중복 확인 (중복) → available: false
4. **TC-S4**: 대문자 ID 입력 → 소문자로 변환되어 저장

#### 예외 케이스

1. **TC-SE1**: ID 3자 입력 → 400 BAD_REQUEST
2. **TC-SE2**: ID 21자 입력 → 400 BAD_REQUEST
3. **TC-SE3**: ID에 특수문자 포함 → 400 BAD_REQUEST
4. **TC-SE4**: 이름 1자 입력 → 400 BAD_REQUEST
5. **TC-SE5**: 비밀번호 7자 입력 → 400 BAD_REQUEST
6. **TC-SE6**: 중복 ID로 가입 시도 → 409 CONFLICT
7. **TC-SE7**: 필수 필드 누락 → 400 BAD_REQUEST

---

## 회원가입 알림 (로드맵 1단계)

> 신규 회원가입 시 운영자에게 메일 알림을 발송합니다.

### 배경

- 신규 회원가입이 발생해도 운영자가 알 수 없음
- 파일럿 확대 기회를 놓칠 수 있음
- 마케팅 채널 효과 측정 어려움

### 시스템 플로우

```
[사용자] 회원가입 요청
    ↓
[SignupUseCase] 계정 생성
    ↓
[SignupUseCase] 메일 발송 트리거 (비동기)
    ↓
[MailService] 운영자에게 알림 메일 발송
    ↓
[사용자] 회원가입 응답 수신 (메일 발송과 독립)
```

### 설계 원칙

1. **비동기 처리**: 메일 발송이 회원가입 응답을 지연시키지 않음
2. **실패 무해**: 메일 발송 실패 시 로그만 기록, 회원가입은 성공
3. **단순 구현**: Nodemailer + Google SMTP (무료, 일 500건)

### 메일 내용

| 항목 | 값 |
|-----|---|
| 제목 | `[출석부] 신규 회원가입: {displayName}` |
| 닉네임 | `displayName` |

### 메일 본문 예시

```
신규 회원이 가입했습니다.

- 닉네임: 홍길동

---
출석부 프로그램
```

### 내부 인터페이스

```typescript
interface MailService {
    sendSignupNotification(account: {
        displayName: string;
    }): Promise<void>;
}
```

### 인프라

**신규 파일**

```
apps/api/src/infrastructure/mail/
├── index.ts           # export
├── mail.service.ts    # 메일 발송 서비스
└── templates.ts       # 메일 템플릿
```

**환경변수**

| 변수명 | 용도 | 필수 | 예시 |
|-------|-----|-----|-----|
| `SMTP_USER` | Gmail 계정 | Yes | `your-email@gmail.com` |
| `SMTP_PASS` | Gmail 앱 비밀번호 | Yes | (16자리 앱 비밀번호) |
| `ADMIN_EMAIL` | 운영자 수신 주소 | Yes | `admin@example.com` |

> Google SMTP: `smtp.gmail.com:587`, 발신자: `SMTP_USER`, Gmail 앱 비밀번호 인증

### 예외 케이스 (회원가입 알림)

| 상황 | 처리 방법 |
|-----|---------|
| 환경변수 미설정 | 메일 발송 비활성화 (앱 정상 동작) |
| SMTP 연결 실패 | 에러 로그 기록, 회원가입 성공 |
| 메일 발송 타임아웃 | 에러 로그 기록, 회원가입 성공 (타임아웃 10초) |

### 테스트 시나리오 (회원가입 알림)

1. **TC-N1**: 환경변수 설정 시 회원가입 후 메일 발송
2. **TC-NE1**: 환경변수 미설정 시 메일 발송 스킵, 회원가입 성공
3. **TC-NE2**: SMTP 연결 실패 시 에러 로그 기록, 회원가입 성공

---

## 로그인 서비스 소개 + 계정 모델 안내 (로드맵 1단계)

> 사업 근거: `docs/business/3_gtm/gtm.md` (전환 경로 옵션 B, 계정 모델 안내)
> 사업 근거: `docs/business/STATUS.md` (P0 항목 2건)

### 배경

- **전환 경로 이탈 방지**: 인스타그램 → 로그인 페이지 → 회원가입 경로에서 서비스 가치 전달 부족
- **현재 문제**: 로그인 페이지에 "주일학교 관리 시스템" 텍스트만 있어 서비스 내용 파악 불가
- **전략 전환 미반영**: "주일학교" 한정 표현이 범용 플랫폼 전략과 불일치
- **계정 모델 혼동**: "모임당 1계정" 모델을 개인 계정으로 오해하는 경향

### 목표

- 로그인 페이지에서 서비스 핵심 가치를 전달하여 가입 전환율 향상
- 회원가입 페이지에서 계정 모델을 명확히 안내하여 가입 혼동 방지
- 전략 전환(모든 가톨릭 모임 플랫폼) 문구 반영

### 범위

| 포함 | 제외 |
|------|------|
| 로그인 페이지 서비스 소개 텍스트 추가 | 별도 랜딩페이지 (2단계) |
| 회원가입 페이지 계정 모델 안내 강화 | 내부 UI 용어 변경 (UX 라이팅 범용화 별도 진행) |
| 전략 전환 문구 반영 | API/DB 변경 없음 |

> **설계 결정**: gtm.md 옵션 B는 "한 줄 소개 + 스크린샷 2~3개"를 언급하지만, 로그인 카드 내부에 스크린샷을 배치하면 레이아웃이 과도해지므로 텍스트 기반 기능 안내(아이콘 + 텍스트 3개)로 대체했다. 별도 랜딩페이지(2단계)에서 스크린샷 활용을 검토한다.

### 흐름/상태

기존 로그인/회원가입 플로우 변경 없음. UI 텍스트/컴포넌트만 추가.

### UI/UX

#### 로그인 페이지 변경

**현재 → 변경:**

| 요소 | 현재 | 변경 |
|------|------|------|
| CardDescription | 주일학교 관리 시스템 | 모임의 출석과 멤버를 한곳에서 관리하세요 |
| 기능 안내 | 없음 | 로그인 폼 하단, 회원가입 링크 아래에 핵심 기능 3개 표시 |

**기능 안내 항목:**

| 아이콘 (lucide-react) | 텍스트 |
|----------------------|--------|
| ClipboardCheck | 간편한 출석 체크와 자동 저장 |
| Users | 그룹별 멤버 관리 |
| BarChart3 | 출석 통계와 대시보드 |

**레이아웃:**

```
┌─────────────────────────────────┐
│ Card                            │
│  CardHeader                     │
│    로그인                        │
│    모임의 출석과 멤버를            │
│    한곳에서 관리하세요             │
│                                 │
│    ✓ 간편한 출석 체크와 자동 저장   │
│    ✓ 그룹별 멤버 관리             │
│    ✓ 출석 통계와 대시보드          │
│  CardContent                    │
│    [입력 폼]                     │
│    [로그인 버튼]                  │
│    계정이 없으신가요? 회원가입      │
└─────────────────────────────────┘
```

- 기능 안내는 `CardHeader` 내부, CardDescription 아래에 배치
- `text-muted-foreground text-sm` 스타일, 아이콘 크기 `w-4 h-4`
- 각 항목은 아이콘 + 텍스트 중앙 정렬 (`flex items-center justify-center gap-2`)

#### 회원가입 페이지 변경

**현재 → 변경:**

| 요소 | 현재 | 변경 |
|------|------|------|
| CardDescription | 주일학교당 하나의 계정으로 관리합니다 | 모임 하나당 계정 하나로 관리합니다 |
| 계정 안내 | 없음 | 폼 상단에 정보성 안내 문구 |

**계정 모델 안내 문구:**

"모임당 하나의 계정으로 출석, 멤버, 통계를 관리합니다. 운영자가 여러 명이면 같은 계정을 공유하세요."

**레이아웃:**

```
┌─────────────────────────────────┐
│ Card                            │
│  CardHeader                     │
│    회원가입                       │
│    모임 하나당 계정 하나로         │
│    관리합니다                     │
│  CardContent                    │
│    ┌─ 안내 ─────────────────┐   │
│    │ 모임당 하나의 계정으로      │   │
│    │ 출석, 멤버, 통계를        │   │
│    │ 관리합니다. 운영자가       │   │
│    │ 여러 명이면 같은 계정을    │   │
│    │ 공유하세요.              │   │
│    └────────────────────────┘   │
│    [입력 폼]                     │
│    [가입하기 버튼]                │
│    이미 계정이 있으신가요? 로그인   │
└─────────────────────────────────┘
```

- 안내 문구는 에러 메시지 영역 위에 배치
- `bg-muted/50 rounded-md p-3 text-sm text-muted-foreground` 스타일 (정보성)
- Info 아이콘 (`lucide-react`의 `Info`) + 텍스트

### 데이터/도메인 변경

없음. UI 텍스트만 변경.

### API/인터페이스

없음.

### 영향 받는 파일

| 파일 | 변경 내용 |
|------|---------|
| `apps/web/src/components/forms/LoginForm.tsx` | CardDescription 변경, 기능 안내 섹션 추가 |
| `apps/web/src/pages/SignupPage.tsx` | CardDescription 변경, 계정 모델 안내 추가 |

### 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 모바일 화면 | 기능 안내/계정 안내가 카드 내부에 포함되어 자연스럽게 반응형 처리 |

### 테스트 시나리오

#### 정상 케이스

1. **TC-SI1**: 로그인 페이지에 "모임의 출석과 멤버를 한곳에서 관리하세요" 표시
2. **TC-SI2**: 로그인 페이지 하단에 핵심 기능 3개 안내 표시 (아이콘 + 텍스트)
3. **TC-SI3**: 회원가입 페이지에 "모임 하나당 계정 하나로 관리합니다" 표시
4. **TC-SI4**: 회원가입 페이지 폼 상단에 계정 모델 설명 안내 표시

#### 예외 케이스

1. **TC-SIE1**: 모바일 화면에서 기능 안내가 줄바꿈 없이 정상 표시

---

## 로그인 페이지 전환율 개선 (로드맵 1단계 후속)

> 사업 근거: `docs/business/STATUS.md` (이탈율 73.3%, P0)
> 사업 근거: `docs/business/3_gtm/gtm.md` (전환 경로 옵션 B "서비스 소개 + 스크린샷")
> 선행 작업: "로그인 서비스 소개 + 계정 모델 안내" (구현 완료, 효과 부족)

### 배경

- **이탈율 73.3%**: 인스타그램 → 로그인 페이지 유입은 양호하나, 회원가입 전환에 실패
- **선행 개선 효과 부족**: 2026-02-11에 CardDescription + 아이콘 3개 추가했으나 전환율 개선 미미
- **기존 설계 한계**: "카드 내부에 스크린샷은 과도 → 텍스트로 대체"라는 결정이 효과 없었음

### 원인 분석

**콘텐츠 문제:**

| 원인 | 상세 | 현재 상태 |
|------|------|----------|
| 타겟 불명확 | "가톨릭 교회 모임 운영자"가 화면 어디에도 없음 | CardDescription만 "모임의 출석과 멤버를..." |
| 스크린샷 없음 | 제품이 어떻게 생겼는지 전혀 알 수 없음 | 아이콘 + 텍스트 3줄뿐 |
| CTA 약함 | 회원가입 유도가 작은 텍스트 링크 한 줄 | "계정이 없으신가요? 회원가입" |
| 사회적 증거 없음 | 다른 곳에서 사용하고 있다는 신뢰 정보 없음 | - |

**디자인 경험 갭:**

| 원인 | 상세 | 현재 상태 |
|------|------|----------|
| 인스타→로그인 경험 단절 | 인스타(밈/짤/컬러풀) → 로그인(무미건조) 갭이 이탈 유발 | `bg-muted/40` + 384px 카드 |
| 시각적 설득력 부재 | 스크린샷/일러스트/컬러 포인트 없이 텍스트만으로 설득 시도 | 회색 `text-sm` + 16px 아이콘 |
| 레이아웃 단조로움 | 회색 배경에 카드만 있어 신뢰감/가치 전달 부족 | 중앙 정렬 카드 1개 구조 |

### 목표

- 로그인 페이지 이탈율 73.3% → 50% 이하로 개선
- 방문자가 3초 내에 "누구를 위한 / 무엇을 하는 / 어떻게 생긴" 서비스인지 파악 가능

### 범위

| 포함 | 제외 |
|------|------|
| AuthLayout 스플릿 레이아웃 변경 | 별도 랜딩페이지 (2단계) |
| 히어로 섹션 (타겟 메시지 + 스크린샷 + 사회적 증거) | 동적 데모/인터랙션 |
| `account.count` 공개 API (사회적 증거용) | 인스타그램 연동 |
| LoginForm CTA 강화 (회원가입 버튼 승격) | |
| SignupPage CTA 강화 + 로그인 링크 버튼화 | |
| 제품 스크린샷 이미지 추가 | |
| 인스타 경험과의 디자인 갭 해소 (컬러/비주얼) | |
| 로그인↔회원가입 페이지 전환 애니메이션 | |

### 설계 결정

> 기존 결정("카드 내부 스크린샷은 과도")을 **폐기**한다.
> 카드 내부가 아닌 **스플릿 레이아웃의 왼쪽 히어로 영역**에 스크린샷을 배치하면
> 카드 크기는 유지하면서 마케팅 콘텐츠를 충분히 전달할 수 있다.

### UI/UX

#### 레이아웃 변경: AuthLayout

**현재:**
```
┌─────────────────────────────────────────┐
│            bg-muted/40                  │
│                                         │
│          ┌─────────────┐                │
│          │  Login Card  │                │
│          │  (max-w-md)  │                │
│          └─────────────┘                │
│                                         │
└─────────────────────────────────────────┘
```

**변경 (데스크톱 lg 이상):**
```
┌────────────────────┬────────────────────┐
│  Hero Section      │  Card Section      │
│  bg-primary/5      │  bg-background     │
│                    │                    │
│  "가톨릭 교회       │                    │
│   모임 운영,       │  ┌──────────────┐  │
│   더 쉽게"         │  │ Login Card   │  │
│                    │  │              │  │
│  [스크린샷 이미지]   │  │  [폼]        │  │
│                    │  │  [CTA 버튼]   │  │
│  "N개 단체가        │  └──────────────┘  │
│   가입했습니다"     │                    │
│                    │                    │
└────────────────────┴────────────────────┘
```

**변경 (모바일/태블릿 lg 미만):**
```
┌─────────────────────────────────┐
│  Hero (compact)                 │
│  "가톨릭 교회 모임 운영, 더 쉽게"  │
│  "N개 단체가 가입했습니다"         │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ Login Card              │   │
│  │  [폼]                   │   │
│  │  [CTA 버튼]              │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

- 모바일에서는 스크린샷 숨김 (`hidden lg:block`)
- 히어로 텍스트는 축약하여 표시

#### AuthLayout Props 변경

```typescript
interface AuthLayoutProps {
    children: ReactNode;
}
```

변경 없음. AuthLayout 내부에서 히어로 섹션을 직접 렌더링.

#### 히어로 섹션 상세

**디자인 원칙:**
- 인스타그램에서 유입되는 사용자가 경험 단절을 느끼지 않도록 **시각적 풍성함** 확보
- 단조로운 회색 배경 대신 **컬러 포인트**와 **비주얼 요소**로 신뢰감 전달
- 히어로 배경: `bg-gradient-to-br from-primary/10 via-primary/5 to-background` (부드러운 그라데이션)

| 요소 | 내용 | 스타일 |
|------|------|--------|
| 타겟 메시지 | "가톨릭 교회 모임 운영, 더 쉽게" | `text-3xl lg:text-4xl font-bold tracking-tight` |
| 서브 메시지 | "출석, 멤버, 통계를 한곳에서 관리하세요" | `text-lg text-muted-foreground` |
| 스크린샷 | 대시보드 화면 캡처 이미지 | `rounded-xl shadow-2xl border`, max-width 제한 |
| 사회적 증거 | "{N}개 단체가 가입했습니다" (동적) | `text-sm text-muted-foreground`, Users 아이콘 포함 |

**스크린샷 이미지:**
- 경로: `apps/web/public/images/screenshot-dashboard.png`
- 내용: 대시보드 페이지 스크린샷 (출석률 차트 + 통계 카드)
- 크기: 최대 480px 너비, 자동 높이
- 스타일: `rounded-xl shadow-2xl border` (그림자 + 테두리로 실체감)
- 사용자가 직접 촬영하여 배치 (이 문서에서는 이미지 경로만 정의)
- 이미지 미배치 시: 스크린샷 영역 자체를 숨기고 텍스트만 표시 (graceful degradation)

#### LoginForm 변경

| 요소 | 현재 | 변경 |
|------|------|------|
| 기능 안내 (아이콘 3개) | CardHeader 내부 | **제거** (히어로 섹션으로 역할 이전) |
| CardDescription | "모임의 출석과 멤버를 한곳에서 관리하세요" | **제거** (히어로 섹션으로 역할 이전) |
| 회원가입 링크 | 텍스트 링크 "계정이 없으신가요? 회원가입" | **버튼으로 승격** `variant="outline"` |

**변경 후 LoginForm 레이아웃:**

```
┌─────────────────────────────┐
│ Card                         │
│  CardHeader                  │
│    "로그인"                   │
│  CardContent                 │
│    [이름 입력]                │
│    [비밀번호 입력]             │
│    [로그인] (primary, w-full) │
│    [지금 바로 시작하세요!] (outline)  │
└─────────────────────────────┘
```

- CTA 버튼: "지금 바로 시작하세요!" → `/signup`으로 이동
- `variant="outline"`, `w-full`, 로그인 버튼 바로 아래 배치
- 기존 텍스트 링크 제거

#### SignupPage 변경

AuthLayout의 히어로 섹션이 자동으로 적용되며, 추가로 폼 내부 CTA를 강화한다.

| 요소 | 현재 | 변경 |
|------|------|------|
| 가입 버튼 텍스트 | "가입하기" | "무료로 시작하기" |
| 로그인 링크 | 텍스트 링크 "이미 계정이 있으신가요? 로그인" | **버튼으로 승격** `variant="ghost"` |

**변경 후 SignupPage 하단 레이아웃:**

```
┌─────────────────────────────┐
│ Card                         │
│  CardHeader                  │
│    "회원가입"                 │
│    "모임 하나당 계정 하나로    │
│     관리합니다"               │
│  CardContent                 │
│    [계정 모델 안내 박스]       │
│    [입력 폼 - 기존 유지]      │
│    [무료로 시작하기] (primary) │
│    [이미 계정이 있으신가요?]   │
│     (ghost)                 │
└─────────────────────────────┘
```

- 가입 버튼: "무료로 시작하기" (primary, w-full) — "무료"를 강조하여 진입 장벽 낮춤
- 로그인 버튼: `variant="ghost"`, `w-full` — 텍스트 링크에서 승격하되 가입 버튼보다 시각적 위계 낮음

#### 로그인↔회원가입 페이지 전환

인스타그램에서 유입된 사용자가 로그인→회원가입(또는 반대)으로 이동할 때 자연스러운 경험을 제공한다.

**전환 방식: 카드 영역 fade + slide-up 진입**

히어로 섹션은 양쪽 페이지에서 동일하므로 **카드 영역만 진입 애니메이션**을 적용한다.
퇴장 애니메이션은 라이브러리 없이는 구현 불가하므로 적용하지 않는다.

| 전환 | 히어로 | 카드 |
|------|--------|------|
| 로그인 → 회원가입 | 유지 (변경 없음) | fade + slide-up 진입 |
| 회원가입 → 로그인 | 유지 (변경 없음) | fade + slide-up 진입 |

**구현 방식:**
- 커스텀 CSS `@keyframes` (`animate-card-in`)
- React Router `<Link>` 네비게이션 → 컴포넌트 마운트 시 자동 트리거
- 별도 라이브러리 없이 CSS만으로 처리

**CSS 정의 (Tailwind v4 `@theme` 또는 글로벌 CSS):**

```css
/* 카드 진입 애니메이션 */
.animate-card-in {
    animation: card-in 200ms ease-out;
}

@keyframes card-in {
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

- 카드 컴포넌트(`LoginForm`, `SignupPage`의 Card)에 `animate-card-in` 클래스 적용
- 페이지 전환 시 React의 컴포넌트 마운트로 자동 트리거

### 데이터/도메인 변경

없음. 기존 Account 테이블에서 count만 조회.

### API/인터페이스

#### tRPC 프로시저 (신규)

| 프로시저 | 타입 | 인증 | 설명 |
|----------|------|------|------|
| `account.count` | query | **public** | 전체 가입 계정 수 조회 |

#### 요청/응답

**account.count**

요청: 없음 (파라미터 없는 query)

응답:
```json
{
  "count": 5
}
```

#### UseCase (신규)

```
CountAccountsUseCase.execute():
  count = database.account.count({ where: { deletedAt: null } })
  return { count }
```

- 소프트 삭제된 계정 제외 (`deletedAt: null`)
- 인증 불필요 (publicProcedure)
- 민감 정보 노출 없음 (숫자만 반환)

### 영향 받는 파일

| 파일 | 변경 내용 |
|------|---------|
| `apps/web/src/components/layout/AuthLayout.tsx` | 스플릿 레이아웃 + 히어로 섹션 추가 |
| `apps/web/src/components/forms/LoginForm.tsx` | 기능 안내 제거, CTA 버튼 승격 |
| `apps/web/src/pages/SignupPage.tsx` | 가입 버튼 텍스트 변경, 로그인 링크 버튼화 |
| `apps/web/public/images/screenshot-dashboard.png` | **신규** - 대시보드 스크린샷 이미지 |
| `packages/trpc/src/schemas/account.ts` | **추가** - `GetAccountCountOutput` 타입 |
| `apps/api/src/domains/account/application/count-accounts.usecase.ts` | **신규** - 계정 수 조회 UseCase |
| `apps/api/src/domains/account/presentation/account.router.ts` | **추가** - `count` 프로시저 (publicProcedure) |

### 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 모바일 화면 (lg 미만) | 히어로 텍스트만 표시, 스크린샷 숨김, 카드 풀 너비 |
| 스크린샷 이미지 로드 실패 | `alt` 텍스트 표시, 레이아웃 깨지지 않음 |
| 회원가입 페이지 히어로 | AuthLayout 변경이 SignupPage에도 동일 적용 (서비스 소개 히어로) |
| account.count API 실패 | 사회적 증거 영역 숨김, 나머지 히어로 정상 표시 |
| 계정 수 0 | 사회적 증거 영역 숨김 (의미 없는 숫자 노출 방지) |

### 측정/모니터링

| 이벤트 | 설명 | 목표 |
|--------|------|------|
| 기존 `signup_started` | 회원가입 페이지 진입 | 전환율 증가 확인 |
| GA4 이탈율 | 로그인 페이지 바운스율 | 73.3% → 50% 이하 |

### 테스트 시나리오

#### 정상 케이스

1. **TC-CV1**: 데스크톱에서 로그인 페이지 접근 시 좌측 히어로 + 우측 로그인 카드 표시
2. **TC-CV2**: 히어로 영역에 "가톨릭 교회 모임 운영, 더 쉽게" 메시지 표시
3. **TC-CV3**: 히어로 영역에 대시보드 스크린샷 이미지 표시
4. **TC-CV4**: 히어로 영역에 "{N}개 단체가 가입했습니다" 동적 표시 (account.count API 연동)
5. **TC-CV5**: LoginForm에 "무료로 시작하기" 버튼이 표시되고, 클릭 시 `/signup`으로 이동
6. **TC-CV6**: 모바일에서 히어로 텍스트만 표시, 스크린샷 숨김
7. **TC-CV7**: 회원가입 페이지에서도 동일 히어로 섹션 표시
8. **TC-CV8**: SignupPage 가입 버튼이 "무료로 시작하기"로 표시
9. **TC-CV9**: SignupPage 로그인 이동이 ghost 버튼으로 표시, 클릭 시 `/login`으로 이동
10. **TC-CV10**: 로그인→회원가입 전환 시 카드가 페이드 인 애니메이션으로 자연스럽게 나타남
11. **TC-CV11**: 회원가입→로그인 전환 시 카드가 페이드 인 애니메이션으로 자연스럽게 나타남

#### 예외 케이스

1. **TC-CVE1**: 스크린샷 이미지 로드 실패 시 alt 텍스트 표시, 레이아웃 정상
2. **TC-CVE2**: account.count API 실패 시 사회적 증거 영역 숨김 (graceful degradation)
3. **TC-CVE3**: 계정 수 0일 때 사회적 증거 영역 숨김

---

## 공통 사항

### 권한별 접근

| 권한 | 접근 가능 기능 |
|------|---------------|
| 비인증 | 로그인, 회원가입, ID 중복 확인, 계정 수 조회 |
| 인증됨 | 모든 보호된 기능 |

### 성능/제약

- 예상 트래픽: 동시 접속 수십 명 이내
- 제약 사항:
  - Access Token만 사용 (Refresh Token 미지원)
  - 토큰 만료 시 재로그인 필요
  - 비밀번호 찾기 미지원 (1단계)

---

**작성일**: 2026-01-13
**최종 수정**: 2026-02-12
**작성자**: PM 에이전트
**상태**: Approved (로그인 페이지 전환율 개선 구현 완료)
