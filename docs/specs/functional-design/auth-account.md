# 기능 설계: 인증 및 계정 관리

> PM 에이전트가 작성하는 기능 설계 문서입니다.
> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md` (회원가입 포함)
- Feature: `docs/specs/current/functional/features/auth-account.md`
- Task: `docs/specs/current/functional/tasks/auth-account.md`
- Development: `docs/specs/current/functional/development/auth-account.md`

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

## 공통 사항

### 권한별 접근

| 권한 | 접근 가능 기능 |
|------|---------------|
| 비인증 | 로그인, 회원가입, ID 중복 확인 |
| 인증됨 | 모든 보호된 기능 |

### 성능/제약

- 예상 트래픽: 동시 접속 수십 명 이내
- 제약 사항:
  - Access Token만 사용 (Refresh Token 미지원)
  - 토큰 만료 시 재로그인 필요
  - 비밀번호 찾기 미지원 (1단계)

---

**작성일**: 2026-01-13
**최종 수정**: 2026-01-25
**작성자**: PM 에이전트
**상태**: Approved (기본 인증 구현 완료, 회원가입 구현 완료)
