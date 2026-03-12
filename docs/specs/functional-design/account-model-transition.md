# 기능 설계: 계정 모델 전환 (로드맵 3단계)

> 공유 계정 → 개인 계정 + 본당/모임 합류 구조. StudentGroup N:M 도입.

- PRD: `docs/specs/prd/account-model-transition.md`
- 기존 기능 설계: `docs/specs/functional-design/auth-account.md`

---

## 엔티티 계층 구조

```
Parish(교구)
  └── 1:N ── Church(본당)
                └── 1:N ── Organization(조직)
                              ├── 1:N ── Account(계정, 조직별 1개)
                              ├── 1:N ── Group(학년/부서)
                              │            ↕ N:M (StudentGroup)
                              │          Student
                              │            └── 1:N ── Attendance
                              └── 1:N ── Student (조직 소속)
```

핵심 원칙: **계정은 조직별 1개씩 발급.** 같은 사람이 2개 조직에 속하면 2개 계정.

---

## 신규 엔티티

### Parish (교구)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| name | String(50) | 교구 이름 |
| createdAt / deletedAt | DateTime | 생성일 / 소프트 삭제 |

### Church (본당)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| name | String(50) | 본당 이름 |
| parishId | BigInt | FK → Parish |
| createdAt / deletedAt | DateTime | 생성일 / 소프트 삭제 |

### Organization (조직)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| name | String(50) | 조직 이름 (예: "중고등부") |
| churchId | BigInt | FK → Church |
| createdAt / deletedAt | DateTime | 생성일 / 소프트 삭제 |

### StudentGroup (N:M)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| studentId | BigInt | FK → Student |
| groupId | BigInt | FK → Group |
| createdAt | DateTime | 소속일 |

복합 유니크: (studentId, groupId)

### JoinRequest (합류 요청)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| accountId | BigInt | FK → Account (요청자) |
| organizationId | BigInt | FK → Organization |
| status | String | "pending" / "approved" / "rejected" |
| createdAt / updatedAt | DateTime | 요청일 / 상태 변경일 |

유니크: (accountId, organizationId, status="pending")

### AccountSnapshot (계정 스냅샷)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| accountId | BigInt | FK → Account |
| name / displayName | String | 로그인 ID / 표시 이름 |
| organizationId | BigInt | 소속 조직 |
| snapshotAt | DateTime | 스냅샷 시점 |

---

## 변경 엔티티

| 엔티티 | 추가 | 삭제 | 비고 |
|--------|------|------|------|
| Account | organizationId (FK → Org), role ("ADMIN"/"TEACHER") | groups 관계 | organizationId null = 미소속 → /join |
| Group | organizationId (FK → Org) | accountId | students → studentGroups (N:M) |
| Student | organizationId (FK → Org), studentGroups | groupId, group 관계 | 조직 소속 1개, Group은 N:M 복수 |
| StudentSnapshot | organizationId | groupId (신규부터) | 기존 groupId 데이터 보존 |
| Attendance | — | — | groupId 비정규화 유지 |
| Registration | — | — | Student 경유 organizationId 스코프 |

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

회원가입 → 개인정보 동의 → /join → 교구 선택 → 본당 검색/생성 → 조직 생성 → admin, 즉시 대시보드

### 신규 가입 (기존 조직 합류)

회원가입 → 동의 → /join → 교구 → 본당 → 조직 선택 → 합류 요청 → /pending (승인 대기) → 관리자 승인 → teacher, 대시보드

### 기존 사용자 (마이그레이션 완료)

로그인 → organizationId 설정됨 → 대시보드 (기존 데이터 유지)

### 기존 미사용 계정

로그인 → organizationId null → /join → 조직 생성 또는 합류

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

### 변경 화면

- **헤더**: Organization 이름 (Church 이름) + displayName + 로그아웃
- **회원가입**: 완료 후 대시보드 대신 /join으로 리다이렉트
- **학생 생성/수정**: groupIds 복수 선택 (체크박스/멀티셀렉트)
- **학생 목록**: 다중 그룹 필터

---

## 신규 API

| 프로시저 | 타입 | 인증 | 설명 |
|---------|------|------|------|
| parish.list | query | consented | 교구 목록 |
| church.create | mutation | consented | 본당 생성 |
| church.search | query | consented | 본당 검색 |
| organization.list | query | consented | Church 하위 조직 목록 |
| organization.create | mutation | consented | 조직 생성 → admin 즉시 진입 |
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
| organizationId null + 도메인 API | scopedProcedure FORBIDDEN → /join 리다이렉트 |
| 이미 조직 소속 + 합류 요청 | 에러 (이미 소속) |
| 이미 pending + 재요청 | 에러 (중복 요청) |
| teacher → 승인/거절 | FORBIDDEN (admin 전용) |
| admin 삭제 시도 | 에러 (삭제 불가) |
| teacher 삭제 | organizationId null, Organization 유지 |
| 학생 모든 Group 제거 | StudentGroup 0건 허용 (미배정) |
| 같은 Church 동명 Organization | 허용 (ID 구분) |

---

## 테스트 시나리오

### 정상

1. 신규 가입 → 조직 생성 → admin → CRUD
2. 신규 가입 → 합류 요청 → 관리자 승인 → teacher → 동일 데이터 접근
3. 기존 계정 로그인 → 마이그레이션 데이터 정상 조회
4. 학생 복수 Group 지정 → StudentGroup 복수 생성
5. AccountSnapshot 생성 확인

### 예외

1. organizationId null → scopedProcedure FORBIDDEN
2. 다른 Organization 데이터 접근 → 데이터 없음
3. 중복 합류 요청 → 에러
4. teacher 승인/거절 시도 → FORBIDDEN
5. 마이그레이션 데이터 정합성 (Group/Student/Attendance 건수 보존)

---

## 이벤트

| 이벤트 | 설명 |
|--------|------|
| church_created | 본당 생성 |
| organization_created | 조직 생성 |
| join_requested / join_approved / join_rejected | 합류 플로우 |
| join_flow_completed / join_flow_abandoned | 합류 완료/이탈 |
