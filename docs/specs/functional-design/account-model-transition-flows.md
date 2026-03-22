# 기능 설계: 계정 모델 전환 — 플로우/API

> 컨텍스트 스코프, 사용자 플로우, UI/UX, API, 접근 제어, 예외, 테스트를 포함합니다.

## 연결 문서

- 메인 (데이터 모델): `account-model-transition.md`
- PRD: `docs/specs/prd/account-model-transition.md`
- 기존 기능 설계: `auth-account.md`

---

## 컨텍스트 스코프 전환

```
[요청] Authorization: Bearer <JWT>
    ↓
[context.ts] JWT → Account + Organization + Church + Parish 조인 조회
    ↓
[UseCase] ctx.organization.id로 데이터 스코프 필터링
```

### 프로시저

| 프로시저 | 인증 | 동의 | Organization | 용도 |
|---------|------|------|-------------|------|
| publicProcedure | - | - | - | 로그인, 회원가입 |
| protectedProcedure | 필수 | - | - | 계정 조회, 동의 |
| consentedProcedure | 필수 | 필수 | - | 합류/생성 |
| **scopedProcedure** | 필수 | 필수 | **필수** | 모든 도메인 작업 |

---

## 사용자 플로우

### 신규 가입 (새 조직 생성)

회원가입 → 개인정보 동의 → /join → 교구 선택 → 본당 검색/생성 → 조직 생성 (타입 선택: 초등부/중고등부/청년, 기본값 없음 — 능동 선택 필수) → admin, 즉시 대시보드

### 신규 가입 (기존 조직 합류)

회원가입 → 동의 → /join → 교구 → 본당 → 조직 선택 → 합류 요청 → /pending (승인 대기) → 관리자 승인 → teacher, 대시보드

### 기존 사용자 (마이그레이션 완료)

로그인 → organizationId 설정됨 → 대시보드 (기존 데이터 유지)

### 기존 미사용 계정

로그인 → organizationId null → /join → 조직 생성 또는 합류

### 계정 복원 후 재합류

복원 → organizationId null (삭제 시 해제, 의도된 동작) → /join → 조직 재합류 또는 새 조직 생성

### 상태 전이

```
[비인증] → 로그인 → [organizationId 확인]
                       ├── 있음 → 대시보드
                       └── 없음 → [pending 요청 확인]
                                    ├── pending → /pending (승인 대기)
                                    └── 없음 → /join
                                                 ├── 새 조직 → admin, 대시보드
                                                 └── 합류 요청 → /pending → 승인 → 대시보드
```

---

## UI/UX

### 신규 화면

- **/join**: 교구 선택 (드롭다운) → 본당 검색/생성 → 조직 선택(합류)/생성(즉시 진입). AuthLayout.
- **/pending**: 승인 대기 + 요청 취소 버튼.

### 조직 생성 다이얼로그 (로드맵 2단계 UX 개선)

- 다이얼로그 상단에 단체 설명("본당 내 초등부, 중고등부, 청년부 등의 조직 단위") + "먼저 목록에서 단체를 찾아보세요" 안내 문구 표시

**타입 선택 개선:**
- 기본값 없음 (미선택 placeholder). 사용자가 반드시 능동 선택해야 생성 가능
- 각 옵션에 설명 텍스트 표시: "초등부 — 만 14세 졸업", "중고등부 — 만 20세 졸업", "청년 — 졸업 없음"
- 타입 미선택 시 "만들기" 버튼 비활성화

**이름-타입 불일치 경고:**
- 이름 키워드(초등/중고등/청년)와 선택한 타입 불일치 시 경고 표시. 비차단 (dismissable)

**동일 이름 모임 차단:**
- 이미 로드된 organization.list 데이터에서 클라이언트 비교 (추가 API 호출 없음)
- 동일 이름 존재 시: "이미 '{이름}'이(가) 있습니다." 안내 + "만들기" 버튼 비활성화

### 본당 생성 다이얼로그 (로드맵 2단계 UX 개선)

- 다이얼로그 상단에 "먼저 검색에서 본당을 찾아보세요" 안내 문구 표시
- 이름 입력 시 church.search API로 유사 본당 검색 (300ms 디바운스), 동일 이름 시 "추가" 버튼 비활성화

### DashboardPage(`/`) 라우팅 (버그 수정)

`/`는 게스트 대시보드를 지원하므로 `ProtectedRoute`를 사용하지 않는다. 대신 DashboardPage 내부에서 상태 전이를 처리한다.

| 조건 | 동작 |
|------|------|
| 비인증 | 게스트 대시보드 표시 |
| 인증 + orgId 없음 + joinRequestStatus === 'pending' | `/pending` 리다이렉트 |
| 인증 + orgId 없음 + 그 외 | `/join` 리다이렉트 |
| 인증 + orgId 있음 | 대시보드 표시 |

`account.get` 응답의 `organizationId`와 `joinRequestStatus`로 판단한다. 로딩 중에는 리다이렉트하지 않는다.

### 변경 화면

헤더(Organization+Church 이름), 회원가입(/join 리다이렉트), 학생(복수 Group 선택/필터).

---

## 신규 API

| 프로시저 | 타입 | 인증 | 설명 |
|---------|------|------|------|
| parish.list | query | consented | 교구 목록 |
| church.create | mutation | consented | 본당 생성. 같은 교구 동명 존재 시 에러 |
| church.search | query | consented | 본당 검색 |
| organization.list | query | consented | Church 하위 조직 목록 |
| organization.create | mutation | consented | 조직 생성 → admin. 입력: name, churchId, type(필수). 같은 Church 동명 존재 시 에러 |
| organization.requestJoin | mutation | consented | 합류 요청 |
| organization.pendingRequests | query | scoped (admin) | 합류 요청 목록 |
| organization.approveJoin | mutation | scoped (admin) | 승인 |
| organization.rejectJoin | mutation | scoped (admin) | 거절 |
| organization.members | query | scoped | 멤버 목록 |

## 변경 API (스코프 전환)

기존 모든 도메인 API → scopedProcedure, accountId → organizationId:

- **Group**: list/create/get/update/delete/bulkDelete/attendance
- **Student**: list/create/get/update/delete/bulkCreate/bulkDelete/restore/feastDayList/promote/graduate/cancelGraduation/bulkRegister/bulkCancelRegistration
- **Attendance**: calendar/dayDetail/update/hasAttendance
- **Statistics**: 전체 (8개)
- **Liturgical**: 변경 없음 (계정/조직 무관)

---

## 접근 제어

| 권한 | 접근 가능 |
|------|---------|
| 비인증 | 랜딩, 로그인, 회원가입, ID 중복 확인, 비밀번호 재설정 |
| 인증 + 동의 + 미소속 | 교구/본당/조직 검색·생성·합류 |
| teacher | 모든 도메인 작업, 멤버 목록 |
| admin | teacher + 합류 승인/거절 |

### IDOR 구조적 해소

scopedProcedure에서 ctx.organization.id 자동 설정 → UseCase에서 organizationId 필터링 → 다른 조직 데이터 접근 불가.

---

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| organizationId null + `/` 접근 | DashboardPage 내부에서 `/join` 또는 `/pending` 리다이렉트 |
| organizationId null + 도메인 API | scopedProcedure FORBIDDEN (ProtectedRoute가 `/join` 리다이렉트) |
| 이미 조직 소속 + 합류 요청 | 에러 (이미 소속) |
| 이미 pending + 재요청 | 에러 (중복 요청) |
| teacher → 승인/거절 | FORBIDDEN (admin 전용) |
| admin 삭제 시도 | 에러 (삭제 불가) |
| teacher 삭제 | organizationId null, Organization 유지 |
| 학생 모든 Group 제거 | StudentGroup 0건 허용 (미배정) |
| 같은 Church 동명 Organization | 프론트엔드 버튼 비활성화 + 백엔드 에러 (CONFLICT) |
| 이름-타입 키워드 불일치 | 프론트엔드 경고만 (비차단). 예: "초등부"인데 MIDDLE_HIGH 선택 |
| 같은 교구 동명 Church | 프론트엔드 버튼 비활성화 + 백엔드 에러 (CONFLICT) |

---

## 테스트 시나리오

### 정상

1. 신규 가입 → 조직 생성 → admin → CRUD
2. 신규 가입 → 합류 요청 → 관리자 승인 → teacher → 동일 데이터 접근
3. 기존 계정 로그인 → 마이그레이션 데이터 정상 조회
4. 학생 복수 Group 지정 → StudentGroup 복수 생성
5. AccountSnapshot 생성 확인
6. 신규 가입 → `/` 접근 → `/join` 리다이렉트
7. 계정 복원 → `/` 접근 → `/join` 리다이렉트
8. pending 합류 요청 사용자 → `/` 접근 → `/pending` 리다이렉트

### 예외

1. organizationId null → scopedProcedure FORBIDDEN
2. 다른 Organization 데이터 접근 → 데이터 없음
3. 중복 합류 요청 → 에러
4. teacher 승인/거절 시도 → FORBIDDEN
5. 마이그레이션 데이터 정합성 (Group/Student/Attendance 건수 보존)
6. 타입 미선택으로 조직 생성 시도 → 버튼 비활성화 (프론트엔드), 스키마 검증 실패 (백엔드)
7. 동일 이름 단체/본당 생성 시도 → 프론트엔드 버튼 비활성화 + 백엔드 CONFLICT 에러

---

## 이벤트

| 이벤트 | 설명 |
|--------|------|
| church_created | 본당 생성 |
| organization_created | 조직 생성 |
| join_requested / join_approved / join_rejected | 합류 플로우 |
| join_flow_completed / join_flow_abandoned | 합류 완료/이탈 |
