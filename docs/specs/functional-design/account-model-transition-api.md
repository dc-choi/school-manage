# 기능 설계: 계정 모델 전환 — API + 권한

> API 인터페이스, 권한/보안, 성능, 이벤트를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/account-model-transition.md`
- **데이터 모델**: `docs/specs/functional-design/account-model-transition.md`
- **마이그레이션**: `docs/specs/functional-design/account-model-transition-migration.md`
- **플로우 + UI/UX**: `docs/specs/functional-design/account-model-transition-flows.md`
- **구현 단계**: `docs/specs/functional-design/account-model-transition-phases.md`
- 기존 기능 설계: `docs/specs/functional-design/auth-account.md`

---

## 컨텍스트 변경

### Context 타입 확장

현재:
```
AccountInfo { id, name, displayName }
AuthContext { account: AccountInfo, privacyAgreedAt }
```

목표:
```
AccountInfo { id, name, displayName, organizationId?, role? }
OrganizationInfo { id, name, churchId, churchName }
ChurchInfo { id, name, parishId, parishName }
AuthContext { account: AccountInfo, organization?: OrganizationInfo, church?: ChurchInfo, privacyAgreedAt }
```

- context.ts에서 Account 조회 시 Organization + Church + Parish를 조인하여 ctx.organization, ctx.church 설정
- organizationId가 null이면 ctx.organization = undefined, ctx.church = undefined

### 프로시저 변경

현재 3종류에 1종류 추가:

| 프로시저 | 인증 | 동의 | Organization | 용도 |
|---------|------|------|-------------|------|
| publicProcedure | - | - | - | 로그인, 회원가입 |
| protectedProcedure | 필수 | - | - | 계정 조회, 동의 |
| consentedProcedure | 필수 | 필수 | - | Church/Org 합류/생성 |
| **scopedProcedure** | 필수 | 필수 | **필수** | 기존 모든 도메인 작업 |

- scopedProcedure: consentedProcedure + ctx.organization 존재 여부 확인
- ctx.organization이 없으면 FORBIDDEN 반환 (클라이언트는 /join으로 리다이렉트)

---

## 신규 API

### Parish (교구)

| 프로시저 | 타입 | 인증 | 설명 |
|---------|------|------|------|
| parish.list | query | consented | 교구 목록 (사전 적재된 전체 목록) |

### Church (본당)

| 프로시저 | 타입 | 인증 | 설명 |
|---------|------|------|------|
| church.create | mutation | consented | 본당 생성 (parishId 필수) |
| church.search | query | consented | 본당 검색 (이름 기반, parishId 필터) |

### Organization (조직)

| 프로시저 | 타입 | 인증 | 설명 |
|---------|------|------|------|
| organization.list | query | consented | Church 하위 조직 목록 (churchId 필수) |
| organization.create | mutation | consented | 조직 생성 (Church 하위) → 생성자 = admin, 즉시 진입 |
| organization.requestJoin | mutation | consented | 기존 조직 합류 요청 (JoinRequest 생성) |
| organization.pendingRequests | query | scoped | 합류 요청 목록 (admin만) |
| organization.approveJoin | mutation | scoped | 합류 요청 승인 (admin만) → 요청자 Account.organizationId 설정 |
| organization.rejectJoin | mutation | scoped | 합류 요청 거절 (admin만) |
| organization.members | query | scoped | 조직 멤버 목록 |

---

## 변경 API

기존 API의 스코프 변경 (accountId → organizationId):

### Group

| 프로시저 | 변경 | 설명 |
|---------|------|------|
| group.list | scopedProcedure | `accountId` → `organizationId`로 필터 |
| group.create | scopedProcedure | `accountId` → `organizationId`로 소유권 |
| group.get | scopedProcedure | organizationId로 소유권 검증 |
| group.update | scopedProcedure | 동일 |
| group.delete | scopedProcedure | 동일 |
| group.bulkDelete | scopedProcedure | 동일 |
| group.attendance | scopedProcedure | 동일 |

### Student

| 프로시저 | 변경 | 설명 |
|---------|------|------|
| student.list | scopedProcedure | organizationId로 학생 조회 (registered/graduated 필터 포함) |
| student.create | scopedProcedure | organizationId + groupIds(복수) 입력 |
| student.get | scopedProcedure | organizationId 스코프 검증 |
| student.update | scopedProcedure | groupIds 복수 지정 가능 |
| student.delete | scopedProcedure | 동일 |
| student.bulkCreate | scopedProcedure | Excel import 대량 생성 |
| student.bulkDelete | scopedProcedure | 복수 학생 소프트 삭제 |
| student.restore | scopedProcedure | 삭제된 학생 복원 |
| student.feastDayList | scopedProcedure | organizationId로 스코프 |
| student.promote | scopedProcedure | 동일 |
| student.graduate | scopedProcedure | 졸업 처리 |
| student.cancelGraduation | scopedProcedure | 졸업 취소 |
| student.bulkRegister | scopedProcedure | 연도별 등록 처리 |
| student.bulkCancelRegistration | scopedProcedure | 등록 취소 |

### Attendance

| 프로시저 | 변경 | 설명 |
|---------|------|------|
| attendance.calendar | scopedProcedure | groupId의 Organization 소속 검증 |
| attendance.dayDetail | scopedProcedure | 동일 |
| attendance.update | scopedProcedure | 동일 |
| attendance.hasAttendance | scopedProcedure | organizationId로 스코프 |

### Statistics

| 프로시저 | 변경 | 설명 |
|---------|------|------|
| 전체 (8개) | scopedProcedure | accountId → organizationId |

### Liturgical (변경 없음)

| 프로시저 | 변경 | 설명 |
|---------|------|------|
| 전체 | 변경 없음 | 계정/조직 무관 (전례력 데이터) |

---

## 권한/보안

### 접근 제어

| 권한 | 접근 가능 기능 |
|------|---------------|
| 비인증 | 랜딩, 로그인, 회원가입, ID 중복 확인, 계정 수 조회, 비밀번호 재설정, 계정 복원 |
| 인증 + 미동의 | 계정 정보 조회, 개인정보 동의 |
| 인증 + 동의 + 조직 미소속 | 교구 목록, Church 검색/생성, Organization 목록/생성/합류 요청 |
| 인증 + 동의 + 조직 소속 (teacher) | 모든 도메인 작업 (Group, Student, Attendance, Statistics), 멤버 목록 |
| 인증 + 동의 + 조직 소속 (admin) | teacher 권한 + 합류 요청 승인/거절 |

### IDOR 구조적 해소

현재 취약점: group.get, group.update, group.delete, group.attendance, student.get, student.update, student.delete — accountId 검증 없음

해소 방식:
- scopedProcedure에서 ctx.organization.id가 자동 설정됨 (Account.organizationId 기반)
- UseCase에서 리소스 조회 시 organizationId로 필터링 → 다른 조직의 데이터 접근 불가
- 별도 멤버십 검증 불필요 (Account 자체에 organizationId가 있으므로)

### 역할별 권한

| 역할 | 권한 |
|------|------|
| admin | 조직 내 모든 작업 + 합류 요청 승인/거절 + 멤버 목록 조회 |
| teacher | 조직 내 모든 작업 (CRUD) |

> MVP에서는 admin/teacher 권한 차이 최소화. 합류 요청 승인/거절만 admin 전용.

---

## 성능/제약

- 예상 트래픽: 동시 접속 수십 명 이내
- context.ts에서 Account + Organization + Church + Parish 조인 조회 1회 (기존 Account 조회에 조인 추가)
- Student-Group N:M: studentGroups 조인 1회 추가. 인덱스(studentId), (groupId)로 성능 보장

---

## 측정/모니터링

### 이벤트

| 이벤트 | 설명 |
|--------|------|
| church_created | 본당 생성 |
| organization_created | 조직 생성 (관리자로 즉시 진입) |
| join_requested | 기존 조직 합류 요청 |
| join_approved | 합류 요청 승인 (관리자) |
| join_rejected | 합류 요청 거절 (관리자) |
| join_flow_completed | 합류 플로우 완료 (생성 또는 승인) |
| join_flow_abandoned | 합류 플로우 이탈 |
| migration_completed | 기존 계정 마이그레이션 완료 |

---

**작성일**: 2026-03-03
**작성자**: SDD 작성자
**상태**: Draft
