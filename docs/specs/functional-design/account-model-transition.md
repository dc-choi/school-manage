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
| type | String(20) | 조직 타입: ELEMENTARY / MIDDLE_HIGH / YOUNG_ADULT. NOT NULL, 기본값 MIDDLE_HIGH (로드맵 2단계) |
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

> 컨텍스트 스코프, 사용자 플로우, UI/UX, API, 접근 제어, 예외, 테스트 → `account-model-transition-flows.md` 참조
