# 기능 설계: 계정 모델 전환 — 데이터 모델

> PRD를 기반으로 엔티티 구조를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/account-model-transition.md`
- 기존 기능 설계: `docs/specs/functional-design/auth-account.md`
- **마이그레이션**: `docs/specs/functional-design/account-model-transition-migration.md`
- **플로우 + UI/UX**: `docs/specs/functional-design/account-model-transition-flows.md`
- **API + 권한**: `docs/specs/functional-design/account-model-transition-api.md`
- **구현 단계**: `docs/specs/functional-design/account-model-transition-phases.md`

---

## 엔티티 계층 구조

### 현재

```
Account(공유) ─1:N─ Group ─1:N─ Student ─1:N─ Attendance
```

### 목표

```
Parish(교구: 서울대교구)
  └── 1:N ── Church(본당: 장위동 성당)
                └── 1:N ── Organization(조직: 초등부/중고등부)
                              ├── 1:N ── Account(계정, 조직별 1개)
                              ├── 1:N ── Group(학년/부서)
                              │            ↕ N:M (StudentGroup)
                              │          Student
                              │            └── 1:N ── Attendance
                              └── 1:N ── Student (조직 소속)
```

핵심 원칙: **계정은 조직별 1개씩 발급.** 같은 사람이 2개 조직에 속하면 2개 계정. 멤버십 테이블 불필요.

---

## 신규 엔티티

### Parish (교구)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| name | String(50) | 교구 이름 (예: "서울대교구") |
| createdAt | DateTime | 생성일 |
| deletedAt | DateTime? | 소프트 삭제 |

### Church (본당)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| name | String(50) | 본당 이름 (예: "장위동 성당") |
| parishId | BigInt | FK → Parish |
| createdAt | DateTime | 생성일 |
| deletedAt | DateTime? | 소프트 삭제 |

### Organization (조직)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| name | String(50) | 조직 이름 (예: "중고등부") |
| churchId | BigInt | FK → Church |
| createdAt | DateTime | 생성일 |
| deletedAt | DateTime? | 소프트 삭제 |

### StudentGroup (Student-Group N:M)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| studentId | BigInt | FK → Student |
| groupId | BigInt | FK → Group |
| createdAt | DateTime | 소속일 |

- 복합 유니크: (studentId, groupId)

### JoinRequest (합류 요청)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| accountId | BigInt | FK → Account (요청자) |
| organizationId | BigInt | FK → Organization (합류 대상) |
| status | String | "pending" / "approved" / "rejected" |
| createdAt | DateTime | 요청일 |
| updatedAt | DateTime | 상태 변경일 |

- 인덱스: (organizationId, status), (accountId, status)
- 유니크: (accountId, organizationId, status="pending") — 동일 조직에 중복 요청 방지

### AccountSnapshot (계정 스냅샷)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | BigInt | PK |
| accountId | BigInt | FK → Account |
| name | String(20) | 로그인 ID |
| displayName | String(20) | 표시 이름 |
| organizationId | BigInt | 소속 조직 |
| snapshotAt | DateTime | 스냅샷 시점 |

- 인덱스: (accountId, snapshotAt)

---

## 변경 엔티티

### Account (변경)

| 변경 | 설명 |
|------|------|
| 유지 | id, name, displayName, password, createdAt, updatedAt, deletedAt, privacyAgreedAt |
| 삭제 | groups 관계 (Account → Group 직접 관계 제거) |
| 추가 | organizationId (FK → Organization), role (String: "ADMIN" 또는 "TEACHER") |

> Account.organizationId가 null이면 조직 미소속 상태 (가입 직후, /join 화면으로 유도)

### Group (변경)

| 변경 | 설명 |
|------|------|
| 삭제 | accountId, account 관계 |
| 추가 | organizationId (FK → Organization), organization 관계 |
| 변경 | students 관계 → studentGroups 관계 (N:M 중간 테이블 경유) |

### Student (변경)

| 변경 | 설명 |
|------|------|
| 삭제 | groupId, group 관계 |
| 추가 | organizationId (FK → Organization), studentGroups 관계 |
| 유지 | 나머지 필드 전부 |

> Student.organizationId: 학생은 조직 소속 1개. Group은 N:M으로 복수 소속 가능.

### Registration (변경 없음)

| 변경 | 설명 |
|------|------|
| 유지 | studentId (FK → Student), year, registeredAt, deletedAt |
| 스코프 | Student.organizationId를 통해 간접적으로 조직 스코프 적용 |

> Registration은 Student를 경유하여 organizationId 스코프를 적용받으므로 직접 변경 없음.

### Attendance (변경 없음)

| 변경 | 설명 |
|------|------|
| 유지 | studentId (FK → Student), groupId (조회 성능용 비정규화 유지) |

### StudentSnapshot (변경)

| 변경 | 설명 |
|------|------|
| 삭제 | groupId (1:N → N:M 전환으로 단일 그룹 참조 불가) |
| 추가 | organizationId (FK → Organization, ERD 추종) |
| 유지 | 나머지 필드 전부 |

> 기존 StudentSnapshot의 groupId 데이터는 과거 기록으로 보존. 신규 스냅샷부터 organizationId 사용.

### GroupSnapshot (변경 없음)

| 변경 | 설명 |
|------|------|
| 유지 | groupId, name, snapshotAt |

---

**작성일**: 2026-03-03
**작성자**: SDD 작성자
**상태**: Draft
