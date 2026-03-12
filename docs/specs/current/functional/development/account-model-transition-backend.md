# Development: 계정 모델 전환 — 백엔드

> Task에서 분할된 백엔드 업무(B1~B6)의 세부 구현 내용입니다.

## 상위 문서

- PRD: `docs/specs/prd/account-model-transition.md`
- 기능 설계: `docs/specs/functional-design/account-model-transition*.md`
- Task: `docs/specs/target/functional/tasks/account-model-transition.md`

## 구현 대상 업무

| Task # | 업무명 | 이 문서에서 구현 |
|--------|--------|----------------|
| B1 | Prisma 스키마 변경 | O |
| B2 | Context + scopedProcedure | O |
| B3 | 신규 도메인 API | O |
| B4 | 기존 UseCase 스코프 전환 | O |
| B5 | Account 엣지 케이스 | O |
| B6 | 마이그레이션 스크립트 | O |

---

## B1: Prisma 스키마 변경

### 신규 모델

```prisma
model Parish {
    id        BigInt    @id @default(autoincrement())
    name      String    @db.VarChar(50)
    createdAt DateTime
    deletedAt DateTime?
    churches  Church[]
}

model Church {
    id            BigInt         @id @default(autoincrement())
    name          String         @db.VarChar(50)
    parishId      BigInt
    createdAt     DateTime
    deletedAt     DateTime?
    parish        Parish         @relation(fields: [parishId], references: [id])
    organizations Organization[]
    @@index([parishId])
}

model Organization {
    id             BigInt          @id @default(autoincrement())
    name           String          @db.VarChar(50)
    churchId       BigInt
    createdAt      DateTime
    deletedAt      DateTime?
    church         Church          @relation(fields: [churchId], references: [id])
    accounts       Account[]
    groups         Group[]
    students       Student[]
    joinRequests   JoinRequest[]
    @@index([churchId])
}

model StudentGroup {
    id        BigInt   @id @default(autoincrement())
    studentId BigInt
    groupId   BigInt
    createdAt DateTime
    student   Student  @relation(fields: [studentId], references: [id])
    group     Group    @relation(fields: [groupId], references: [id])
    @@unique([studentId, groupId])
    @@index([studentId])
    @@index([groupId])
}

model JoinRequest {
    id             BigInt       @id @default(autoincrement())
    accountId      BigInt
    organizationId BigInt
    status         String       @db.VarChar(20)
    createdAt      DateTime
    updatedAt      DateTime
    account        Account      @relation(fields: [accountId], references: [id])
    organization   Organization @relation(fields: [organizationId], references: [id])
    @@index([organizationId, status])
    @@index([accountId, status])
}

model AccountSnapshot {
    id             BigInt   @id @default(autoincrement())
    accountId      BigInt
    name           String   @db.VarChar(20)
    displayName    String   @db.VarChar(20)
    organizationId BigInt
    snapshotAt     DateTime
    account        Account  @relation(fields: [accountId], references: [id])
    @@index([accountId, snapshotAt])
}
```

### 기존 모델 변경

```
Account:
  추가: organizationId BigInt? (FK → Organization), role String? @db.VarChar(20)
  추가: organization Organization? @relation
  추가: joinRequests JoinRequest[], snapshots AccountSnapshot[]
  삭제: groups Group[] 관계 제거

Group:
  추가: organizationId BigInt (FK → Organization), organization Organization @relation
  추가: studentGroups StudentGroup[]
  삭제: accountId BigInt, account Account @relation
  삭제: students Student[] 직접 관계

Student:
  추가: organizationId BigInt (FK → Organization), organization Organization @relation
  추가: studentGroups StudentGroup[]
  삭제: groupId BigInt, group Group @relation
  유지: registrations Registration[] (변경 없음, Student 경유 스코프)

Registration:
  변경 없음 (Student.organizationId를 통해 간접 스코프)

StudentSnapshot:
  추가: organizationId BigInt? (nullable, 기존 데이터 보존)
  유지: groupId BigInt (기존 데이터 보존, 신규 스냅샷에서는 미사용)
```

### Parish 시드

마이그레이션 SQL에 16개 교구 INSERT 포함:

```sql
INSERT INTO Parish (name, createdAt) VALUES
('서울대교구', NOW()), ('수원교구', NOW()), ('인천교구', NOW()),
('의정부교구', NOW()), ('대전교구', NOW()), ('청주교구', NOW()),
('춘천교구', NOW()), ('원주교구', NOW()), ('대구대교구', NOW()),
('부산교구', NOW()), ('안동교구', NOW()), ('마산교구', NOW()),
('광주대교구', NOW()), ('전주교구', NOW()), ('제주교구', NOW()),
('군종교구', NOW());
```

### 마이그레이션 전략

기존 테이블의 NOT NULL 컬럼 변경(accountId 삭제, organizationId 추가)은 데이터 마이그레이션(B6)과 함께 처리. Prisma 마이그레이션 SQL을 수동 편집:

1. 신규 테이블 생성 + Parish 시드
2. 기존 테이블에 nullable 컬럼 추가 (organizationId)
3. 데이터 마이그레이션 SQL (B6) 실행
4. ~~기존 컬럼 제거 (accountId, groupId) + NOT NULL 전환~~ → **학년/부서 스프린트에서 처리** (기존 컬럼 유지, 코드는 이미 organizationId + StudentGroup 기반으로 동작)

---

## B2: Context + scopedProcedure

### Context 타입 확장

`packages/trpc/src/shared.ts`:

```
AccountInfo 확장:
  추가: organizationId?: string, role?: string

신규 타입:
  OrganizationInfo { id: string, name: string, churchId: string, churchName: string }
  ChurchInfo { id: string, name: string, parishId: string, parishName: string }
```

`packages/trpc/src/context.ts`:

```
AuthContext 확장:
  추가: organization?: OrganizationInfo, church?: ChurchInfo
```

### context.ts 변경

`apps/api/src/infrastructure/trpc/context.ts`:

현재 Account만 조회 → Organization + Church + Parish 조인 추가:

```
Account 조회 시:
  include: { organization: { include: { church: { include: { parish: true } } } } }

IF account.organizationId 존재:
  ctx.account.organizationId = String(account.organizationId)
  ctx.account.role = account.role
  ctx.organization = { id, name, churchId, churchName }
  ctx.church = { id, name, parishId, parishName }
ELSE:
  ctx.organization = undefined
  ctx.church = undefined
```

### scopedProcedure

`packages/trpc/src/trpc.ts`:

```
requiresOrganization 미들웨어:
  IF !ctx.organization:
    throw TRPCError { code: 'FORBIDDEN', message: 'FORBIDDEN: 조직 소속이 필요합니다' }
  ELSE:
    next()

scopedProcedure = consentedProcedure.use(requiresOrganization)
```

---

## B3: 신규 도메인 API

### 파일 구조

```
apps/api/src/domains/
  parish/
    presentation/parish.router.ts
    application/list-parishes.usecase.ts
  church/
    presentation/church.router.ts
    application/create-church.usecase.ts
    application/search-churches.usecase.ts
  organization/
    presentation/organization.router.ts
    application/list-organizations.usecase.ts
    application/create-organization.usecase.ts
    application/request-join.usecase.ts
    application/pending-requests.usecase.ts
    application/approve-join.usecase.ts
    application/reject-join.usecase.ts
    application/list-members.usecase.ts
```

### 스키마

`packages/trpc/src/schemas/parish.ts`:

```
ListParishesOutput { parishes: { id, name }[] }
```

`packages/trpc/src/schemas/church.ts`:

```
createChurchInputSchema: { name: string, parishId: idSchema }
searchChurchesInputSchema: { parishId: idSchema, query?: string }
CreateChurchOutput { id, name, parishId }
SearchChurchesOutput { churches: { id, name, organizationCount }[] }
```

`packages/trpc/src/schemas/organization.ts`:

```
listOrganizationsInputSchema: { churchId: idSchema }
createOrganizationInputSchema: { name: string, churchId: idSchema }
requestJoinInputSchema: { organizationId: idSchema }
approveJoinInputSchema: { joinRequestId: idSchema }
rejectJoinInputSchema: { joinRequestId: idSchema }

ListOrganizationsOutput { organizations: { id, name, memberCount }[] }
CreateOrganizationOutput { id, name, churchId }
RequestJoinOutput { joinRequestId: string }
PendingRequestsOutput { requests: { id, accountDisplayName, createdAt }[] }
MembersOutput { members: { id, displayName, role, joinedAt }[] }
```

### 핵심 비즈니스 로직

**CreateOrganizationUseCase**:

```
$transaction:
  1. Organization 생성 (churchId, name)
  2. ctx.account.organizationId = organization.id
  3. ctx.account.role = "ADMIN"
  4. AccountSnapshot 생성
반환: { id, name, churchId }
```

**RequestJoinUseCase**:

```
검증:
  IF ctx.account.organizationId 존재: CONFLICT "이미 조직에 소속되어 있습니다"
  IF JoinRequest(accountId, organizationId, status="pending") 존재: CONFLICT "이미 요청이 진행 중입니다"
생성: JoinRequest { accountId, organizationId, status: "pending" }
```

**ApproveJoinUseCase**:

```
검증:
  IF ctx.account.role !== "ADMIN": FORBIDDEN
  JoinRequest 조회 (status="pending")
  IF 미존재: NOT_FOUND
$transaction:
  1. JoinRequest.status = "approved"
  2. 요청자 Account.organizationId = ctx.organization.id
  3. 요청자 Account.role = "TEACHER"
  4. AccountSnapshot 생성 (요청자)
```

---

## B4: 기존 UseCase 스코프 전환

### 공통 변경

모든 기존 도메인 라우트: `consentedProcedure` → `scopedProcedure`

### Group UseCase 변경

```
ListGroupsUseCase:
  현재: where { accountId: ctx.account.id }
  변경: where { organizationId: ctx.organization.id }

CreateGroupUseCase:
  현재: data { accountId: ctx.account.id }
  변경: data { organizationId: ctx.organization.id }

Get/Update/Delete:
  현재: 소유권 검증 없음 (IDOR 취약)
  변경: where 조건에 organizationId 추가
```

### Student UseCase 변경

```
ListStudentsUseCase:
  현재: where { groupId }
  변경: where { organizationId: ctx.organization.id }
  + include { studentGroups: { include: { group: true } } }
  + registered/registrationYear/graduated 필터: 기존 필터 로직 유지,
    조회 기준만 organizationId로 전환

CreateStudentUseCase:
  현재: data { groupId }
  변경:
    $transaction:
      1. Student 생성 { organizationId: ctx.organization.id }
      2. StudentGroup 레코드 생성 (groupIds 배열 순회)
      3. StudentSnapshot 생성 (organizationId 사용)

BulkCreateStudentsUseCase (Excel import):
  현재: groupId로 소유권 검증
  변경: organizationId로 소유권 검증 + StudentGroup N:M 생성

UpdateStudentUseCase:
  현재: data { groupId }
  변경:
    $transaction:
      1. Student 업데이트
      2. 기존 StudentGroup 삭제 (해당 student)
      3. 새 StudentGroup 생성 (groupIds 배열)
      4. StudentSnapshot 생성

DeleteStudentUseCase:
  현재: 소유권 검증 없음
  변경: where 조건에 organizationId 추가

BulkDeleteStudentsUseCase:
  현재: groupId 기반 학생 일괄 삭제
  변경: organizationId로 소유권 검증

RestoreStudentsUseCase:
  현재: 소유권 검증 없음
  변경: where 조건에 organizationId 추가

GraduateStudentsUseCase:
  현재: groupId 기반 학생 졸업 처리
  변경: organizationId로 소유권 검증

CancelGraduationUseCase:
  현재: 소유권 검증 없음
  변경: where 조건에 organizationId 추가

BulkRegisterStudentsUseCase:
  현재: student.groupId 기반 소유권 검증
  변경: student.organizationId로 소유권 검증

BulkCancelRegistrationUseCase:
  현재: student.groupId 기반 소유권 검증
  변경: student.organizationId로 소유권 검증
```

### Student 스키마 변경

```
createStudentInputSchema:
  삭제: groupId
  추가: groupIds: z.array(idSchema).min(1)

updateStudentInputSchema: 동일 변경

bulkCreateStudentsInputSchema:
  삭제: groupId
  추가: groupIds: z.array(idSchema).min(1)

listStudentsInputSchema:
  변경 없음 (registered/registrationYear/graduated 필터 유지)
  스코프: API 측에서 organizationId 자동 적용

bulkRegisterStudentsInputSchema: 변경 없음
bulkCancelRegistrationInputSchema: 변경 없음

StudentOutput (StudentWithGroup):
  삭제: groupId, groupName
  추가: groups: { id, name }[]
  유지: isRegistered (Registration 경유)

ListStudentsOutput:
  유지: registrationSummary: { registeredCount, unregisteredCount }
```

### Attendance UseCase 변경

```
모든 UseCase:
  groupId로 Group 조회 시 organizationId 검증 추가
  where { group: { organizationId: ctx.organization.id } }
```

### Statistics UseCase 변경

```
모든 UseCase:
  현재: accountId 기준 조회
  변경: organizationId 기준 조회
  JOIN 경로: Organization → Group → Student → Attendance

GetGroupStatisticsUseCase:
  추가 변경: registeredStudents 조회 시 Registration 테이블 JOIN
  현재: Registration → Student.groupId 경유
  변경: Registration → Student.organizationId 경유 + StudentGroup N:M JOIN
```

### Snapshot 변경

```
createStudentSnapshot:
  현재: groupId 저장
  변경: organizationId 저장

createGroupSnapshot: 변경 없음
```

---

## B5: Account 엣지 케이스

### admin 삭제 불가

```
DeleteAccountUseCase:
  추가 검증:
    IF account.role === "ADMIN":
      throw TRPCError { code: 'FORBIDDEN', message: 'admin 계정은 삭제할 수 없습니다' }
```

### teacher 삭제

```
DeleteAccountUseCase (teacher):
  현재: Account soft delete
  변경: Account soft delete + Account.organizationId = null
  Organization은 유지 (다른 멤버 접근 보장)
```

### teacher 복원

```
RestoreAccountUseCase:
  현재: Account deletedAt = null
  변경: Account deletedAt = null (organizationId는 null 유지)
  → 재로그인 시 /join으로 유도
```

---

## B6: 마이그레이션 스크립트

### 실행 순서

Prisma 마이그레이션 SQL에 포함 (수동 편집):

```
1. 신규 테이블 생성
2. Parish 시드 (16개)
3. 기존 테이블 nullable 컬럼 추가
4. 데이터 마이그레이션 (아래 SQL)
5. 기존 컬럼 제거 + NOT NULL 전환
```

### 마이그레이션 SQL 핵심 로직

```
-- 자동 마이그레이션 20개: 본당-교구 매핑 테이블 기반
-- Church 19개 생성 (구룡 성당은 1개 Church에 2개 Organization)
-- Organization 20개 생성 (Account별 1개)
-- Account.organizationId, role = "ADMIN" 설정
-- Group.organizationId 설정 (Account → Group 전파)
-- Student.organizationId 설정 (Group → Student 전파)
-- StudentGroup 일괄 생성 (전체 Student 대상, 기존 groupId 관계 보존)
-- StudentSnapshot.organizationId 백필
-- AccountSnapshot 초기 생성 (마이그레이션 계정 20개)

-- 미소속 18개: Account.organizationId = null 유지 (로그인 시 /join 유도)
-- 황보나 (id:31): 22학생 32출석 데이터 있음, /join 후 수동 재연결 필요
```

### 검증 쿼리

```
-- 전후 건수 비교
SELECT 'Group' as entity, COUNT(*) as cnt FROM `Group` WHERE deletedAt IS NULL
UNION ALL
SELECT 'Student', COUNT(*) FROM Student WHERE deletedAt IS NULL
UNION ALL
SELECT 'Attendance', COUNT(*) FROM Attendance WHERE deletedAt IS NULL;

-- Organization 소속 확인 (13개 계정)
SELECT a.displayName, o.name as orgName, c.name as churchName
FROM Account a
JOIN Organization o ON a.organizationId = o.id
JOIN Church c ON o.churchId = c.id
WHERE a.organizationId IS NOT NULL;

-- 미소속 확인 (14개 계정)
SELECT displayName FROM Account WHERE organizationId IS NULL AND deletedAt IS NULL;
```

---

## 테스트 시나리오

### B2 테스트

| 시나리오 | 기대 결과 |
|---------|----------|
| organizationId 있는 Account 로그인 | ctx.organization, ctx.church 설정됨 |
| organizationId null Account 로그인 | ctx.organization = undefined |
| scopedProcedure + organization 없음 | FORBIDDEN |

### B3 테스트

| 시나리오 | 기대 결과 |
|---------|----------|
| parish.list | 16개 교구 반환 |
| church.create | Church 생성, parishId 연결 |
| church.search | 이름 기반 검색 결과 |
| organization.create | Organization + admin 역할 설정 |
| organization.requestJoin | JoinRequest 생성 (pending) |
| 이미 조직 소속 + requestJoin | CONFLICT |
| approveJoin (admin) | Account.organizationId 설정 |
| approveJoin (teacher) | FORBIDDEN |

### B4 테스트

| 시나리오 | 기대 결과 |
|---------|----------|
| group.list (scopedProcedure) | 같은 Organization 그룹만 반환 |
| student.create (groupIds 복수) | Student + StudentGroup 복수 생성 |
| student.bulkCreate (Excel import) | organizationId로 소유권 검증 |
| student.bulkRegister | organizationId 스코프 내 학생만 등록 |
| student.list (registered 필터) | organizationId 내 등록/미등록 필터 동작 |
| student.graduate / cancelGraduation | organizationId 스코프 검증 |
| 다른 Organization의 group 접근 | 빈 결과 / NOT_FOUND |

### B5 테스트

| 시나리오 | 기대 결과 |
|---------|----------|
| admin 계정 삭제 시도 | FORBIDDEN |
| teacher 삭제 | organizationId null, Organization 유지 |
| teacher 복원 | Account 복원, organizationId null 유지 |

---

## 구현 시 주의사항

- BigInt 변환: `BigInt(input.id)` (DB), `String(model.id)` (출력)
- 타임스탬프: `getNowKST()` 사용 (Prisma @default(now()) UTC 문제)
- 트랜잭션: Organization 생성 + Account 업데이트, Student 생성 + StudentGroup 등 반드시 `$transaction`
- 스냅샷: 엔티티 변경 시 자동 생성 패턴 유지

---

**작성일**: 2026-03-07
**리뷰 상태**: Draft
