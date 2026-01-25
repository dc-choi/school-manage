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

## 회원가입 (로드맵 1단계)

> PRD: `docs/specs/prd/school-attendance.md` (로드맵 1단계 섹션)
> 기능 설계: `docs/specs/functional-design/auth-account.md`
> Task: `docs/specs/current/functional/tasks/auth-account.md`

### 구현 개요

회원가입 시 ID 중복을 확인하고, 유효한 정보로 계정을 생성한 뒤 Access Token을 발급한다. ID는 소문자로 정규화하여 저장하고, 비밀번호는 bcrypt로 해싱한다.

### 데이터 모델

#### 스키마 변경

**Account 테이블 (변경)**

```sql
-- display_name 컬럼 추가
ALTER TABLE account ADD COLUMN display_name VARCHAR(20) NOT NULL DEFAULT '' AFTER name;

-- 기존 계정의 display_name을 name으로 초기화
UPDATE account SET display_name = name WHERE display_name = '';
```

**Prisma 스키마 변경**

```prisma
model Account {
    id          BigInt    @id @default(autoincrement()) @map("_id")
    name        String    @db.VarChar(20)     // 로그인 ID (영문 소문자/숫자)
    displayName String    @map("display_name") @db.VarChar(20)  // 신규: 표시용 이름
    password    String    @db.VarChar(200)
    createdAt   DateTime? @map("create_at")
    updatedAt   DateTime? @map("update_at")
    deletedAt   DateTime? @map("delete_at")
    // ... 기존 관계
}
```

#### 입력 (Input)

**auth.checkId**
```
{
  name: string (필수, 4~20자, 영문 소문자/숫자)
}
```

**auth.signup**
```
{
  name: string (필수, 4~20자, 영문 소문자/숫자)
  displayName: string (필수, 2~20자)
  password: string (필수, 8자 이상)
}
```

#### 출력 (Output)

**auth.checkId 성공**
```
{
  available: boolean
}
```

**auth.signup 성공**
```
{
  name: string
  displayName: string
  accessToken: string
}
```

### 비즈니스 로직

#### 1. ID 중복 확인 (auth.checkId)

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

#### 2. 회원가입 (auth.signup)

```
normalizedName = name.toLowerCase()

// 유효성 검증
IF normalizedName does not match /^[a-z0-9]{4,20}$/ THEN
  throw BAD_REQUEST("ID는 4~20자의 영문 소문자/숫자만 가능합니다")

IF displayName.length < 2 OR displayName.length > 20 THEN
  throw BAD_REQUEST("이름은 2~20자로 입력해주세요")

IF password.length < 8 THEN
  throw BAD_REQUEST("비밀번호는 8자 이상이어야 합니다")

// 중복 확인
existingAccount = AccountRepository.findByName(normalizedName)
IF existingAccount exists THEN
  throw CONFLICT("이미 사용 중인 아이디입니다")

// 계정 생성
hashedPassword = bcrypt.hash(password, saltRounds=10)
account = AccountRepository.create({
  name: normalizedName,
  displayName: displayName,
  password: hashedPassword,
  createdAt: now()
})

// 토큰 발급
accessToken = jwt.sign({ id: account.id, name: account.name }, secret, expiresIn)

return { name: account.name, displayName: account.displayName, accessToken }
```

#### 3. 기존 로그인 응답 수정 (auth.login)

기존 로그인 응답에 `displayName` 필드를 추가한다.

```
// 기존 반환
return { name, accessToken }

// 변경 후
return { name, displayName, accessToken }
```

### 검증 규칙 (Validation)

| 필드 | 규칙 | 에러 메시지 |
|------|------|------------|
| name | 4~20자, 영문 소문자/숫자만 | "ID는 4~20자의 영문 소문자/숫자만 가능합니다" |
| name | 중복 불가 | "이미 사용 중인 아이디입니다" |
| displayName | 2~20자 | "이름은 2~20자로 입력해주세요" |
| password | 8자 이상 | "비밀번호는 8자 이상이어야 합니다" |

### 에러 처리

| 에러 상황 | 에러 코드 | 응답 |
|----------|----------|------|
| ID 형식 오류 | 400 | BAD_REQUEST: Invalid ID format |
| ID 길이 오류 | 400 | BAD_REQUEST: ID는 4~20자로 입력해주세요 |
| ID 중복 | 409 | CONFLICT: 이미 사용 중인 아이디입니다 |
| 이름 길이 오류 | 400 | BAD_REQUEST: 이름은 2~20자로 입력해주세요 |
| 비밀번호 길이 오류 | 400 | BAD_REQUEST: 비밀번호는 8자 이상이어야 합니다 |
| 필수 필드 누락 | 400 | BAD_REQUEST: Required field missing |

### 테스트 시나리오

#### 정상 케이스

1. **TC-S1**: 유효한 정보로 회원가입 → 계정 생성, name/displayName/accessToken 반환
2. **TC-S2**: ID 중복 확인 (사용 가능) → available: true
3. **TC-S3**: ID 중복 확인 (중복) → available: false
4. **TC-S4**: 대문자 ID 입력 → 소문자로 변환되어 저장
5. **TC-S5**: 기존 로그인 → displayName 포함된 응답

#### 예외 케이스

1. **TC-SE1**: ID 3자 입력 → 400 BAD_REQUEST
2. **TC-SE2**: ID 21자 입력 → 400 BAD_REQUEST
3. **TC-SE3**: ID에 특수문자 포함 → 400 BAD_REQUEST
4. **TC-SE4**: 이름 1자 입력 → 400 BAD_REQUEST
5. **TC-SE5**: 이름 21자 입력 → 400 BAD_REQUEST
6. **TC-SE6**: 비밀번호 7자 입력 → 400 BAD_REQUEST
7. **TC-SE7**: 중복 ID로 가입 시도 → 409 CONFLICT
8. **TC-SE8**: 필수 필드 누락 → 400 BAD_REQUEST

### 구현 대상 파일

#### API (apps/api)

| 파일 | 변경 내용 |
|------|----------|
| `prisma/schema.prisma` | Account 모델에 displayName 필드 추가 |
| `src/domains/auth/presentation/auth.router.ts` | checkId, signup 프로시저 추가 |
| `src/domains/auth/application/check-id.usecase.ts` | ID 중복 확인 유스케이스 (신규) |
| `src/domains/auth/application/signup.usecase.ts` | 회원가입 유스케이스 (신규) |
| `src/domains/auth/application/login.usecase.ts` | displayName 반환 추가 |

#### tRPC (packages/trpc)

| 파일 | 변경 내용 |
|------|----------|
| `src/schemas/auth.ts` | checkIdInputSchema, signupInputSchema, 출력 타입 추가 |
| `src/schemas/index.ts` | 새 스키마/타입 export |

#### Web (apps/web)

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/SignupPage.tsx` | 회원가입 페이지 (신규) |
| `src/pages/LoginPage.tsx` | 회원가입 링크 추가 |
| `src/routes/index.tsx` | /signup 라우트 추가 |
| `src/features/auth/hooks/useAuth.ts` | signup, checkId 훅 추가 |

### AI 구현 지침 (회원가입)

> Claude Code가 구현할 때 참고할 내용

- 기존 로그인 패턴 참고: `apps/api/src/domains/auth/`
- ID 정규화: 입력값을 `.toLowerCase()`로 변환 후 처리
- bcrypt saltRounds: 10 사용 (기존 패턴과 동일)
- 회원가입 성공 후 자동 로그인: signup 응답에 accessToken 포함
- 웹 페이지 패턴 참고: `apps/web/src/pages/LoginPage.tsx`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-25
**리뷰 상태**: Approved (기본 인증 + 회원가입 구현 완료)
