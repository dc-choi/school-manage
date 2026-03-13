# Development: 학년/부서 두 축 그룹핑 — Backend

## 상위 문서

- PRD: `docs/specs/prd/dual-axis-grouping.md`
- 기능 설계: `docs/specs/functional-design/dual-axis-grouping.md`
- Task: `docs/specs/target/functional/tasks/dual-axis-grouping.md`

## 구현 대상 업무

| Task # | 업무명 | 구현 |
|--------|-------|------|
| B1 | DB 마이그레이션 + 스키마 | O |
| B2 | Group 도메인 수정 | O |
| B3 | Group 학생 관리 API | O |
| B4 | Student 도메인 수정 | O |
| B5 | Attendance + Statistics + Snapshot | O |

## B1: Prisma 스키마 + tRPC 스키마

### Prisma 변경

- `Group`: type 필드 추가 (`String @default("GRADE") @db.VarChar(20)`)
- `Student`: groupId 필드 + 관계 + @@index 제거

### 마이그레이션 SQL

1. `ALTER TABLE Group ADD type VARCHAR(20) NOT NULL DEFAULT 'GRADE'`
2. 검증: `SELECT s.id FROM Student s LEFT JOIN StudentGroup sg ON s.id = sg.studentId WHERE sg.id IS NULL` → 결과 0건 확인
3. `ALTER TABLE Student DROP FOREIGN KEY ...; ALTER TABLE Student DROP COLUMN group_id; DROP INDEX ...`

### tRPC 스키마 변경

| 스키마 | 변경 |
|--------|------|
| `createGroupInputSchema` | `type: z.enum(['GRADE', 'DEPARTMENT']).default('GRADE')` 추가 |
| `updateGroupInputSchema` | `type: z.enum(['GRADE', 'DEPARTMENT']).optional()` 추가 |
| `listGroupsInputSchema` | 신규. `type: z.enum(['GRADE', 'DEPARTMENT']).optional()` |
| `GroupOutput` | `type: string` 추가 |
| `addStudentInputSchema` | 신규. `{ groupId: string, studentId: string }` |
| `removeStudentInputSchema` | 신규. `{ groupId: string, studentId: string }` |
| `StudentGroupItem` | `type: string` 추가 |
| `createStudentInputSchema` | groupIds 검증: GRADE count ≤ 1 (서버 검증) |

## B2: Group 도메인 UseCase 수정

### create-group.usecase.ts
- input에 `type` 추가, `prisma.group.create({ data: { ...existing, type } })`
- output에 `type` 포함

### update-group.usecase.ts
- input에 `type` 추가 (optional)
- type 변경 시 검증: GRADE→DEPARTMENT 변경이면 소속 학생들의 다른 GRADE 그룹 수 확인
  - 해당 그룹 소속 학생 중 다른 GRADE 그룹에도 소속된 학생 → 이 그룹이 DEPARTMENT가 되면 GRADE 2개 → 400

### list-groups.usecase.ts
- input에 `type` 필터 추가 (optional)
- WHERE 조건에 `type` 추가 (있으면 필터, 없으면 전체)

### get-group.usecase.ts
- 학생 조회: `group.students` 관계 → `StudentGroup WHERE groupId` + `Student JOIN` 으로 변경
- output에 `type` 포함

### delete-group.usecase.ts / bulk-delete-groups.usecase.ts
- 삭제 전 group.type 조회
- GRADE: `StudentGroup WHERE groupId` count > 0 → 400 (소속 학생 존재)
- DEPARTMENT: `StudentGroup WHERE groupId` deleteMany 후 그룹 soft delete

### get-group-attendance.usecase.ts
- 학생 조회: `WHERE groupId=?` → `StudentGroup WHERE groupId=?` JOIN Student

## B3: Group 학생 관리 API (신규)

### group.addStudent
- Router: `scopedProcedure.input(addStudentInputSchema).mutation`
- 로직:
  1. 그룹 소유권 검증 (organizationId)
  2. 학생 소유권 검증 (organizationId)
  3. 그룹 type 조회
  4. GRADE 그룹이면: 학생의 기존 GRADE StudentGroup 조회 → 있으면 삭제 (자동 이동)
  5. `StudentGroup.create({ studentId, groupId })`
  6. 스냅샷 생성

### group.removeStudent
- Router: `scopedProcedure.input(removeStudentInputSchema).mutation`
- 로직:
  1. 그룹/학생 소유권 검증
  2. `StudentGroup.delete WHERE studentId AND groupId`

## B4: Student 도메인 UseCase 수정

### GRADE 검증 헬퍼 (공통)
```
validateGradeCount(groupIds, organizationId, tx):
  gradeGroups = Group WHERE id IN groupIds AND type='GRADE' AND deletedAt=null
  IF gradeGroups.length > 1 → throw 400 "학년 그룹은 최대 1개"
```

### create-student.usecase.ts
- `Student.groupId` 제거 → create에서 groupId 필드 미설정
- GRADE 검증 헬퍼 호출
- StudentGroup 생성은 기존과 동일 (이미 구현됨)
- 스냅샷: groupId = GRADE 그룹의 id (없으면 null)

### update-student.usecase.ts
- `Student.groupId` 업데이트 제거
- groupIds 변경 시 GRADE 검증 헬퍼 호출
- 스냅샷: groupId = GRADE 그룹의 id

### list-students.usecase.ts
- 현재: groupIds로 학생 조회 → `WHERE groupId IN (?)`
- 변경: `WHERE organizationId=?` 직접 필터
- groupId 필터 추가: `StudentGroup WHERE groupId=? → studentIds → WHERE id IN`
- groupType 필터 추가: `Group WHERE type=? → groupIds → StudentGroup → studentIds`

### get-student.usecase.ts
- studentGroups include에 `group: { select: { type: true } }` 추가
- output groups에 type 포함: `{ id, name, type }`

### graduate/cancelGraduation/promote
- `Student.groupId` 참조 → `StudentGroup WHERE studentId AND group.type='GRADE'` 로 변경
- promote: 학년 이동 시 기존 GRADE StudentGroup 삭제 → 새 GRADE StudentGroup 생성

### bulkCreate
- 각 학생별 GRADE 검증 헬퍼 호출
- `Student.groupId` 설정 제거

### feastDayList
- 현재: groupIds로 학생 조회 → `WHERE groupId IN (?)`
- 변경: `WHERE organizationId=? AND deletedAt=null AND graduatedAt=null`

## B5: Attendance + Statistics + Snapshot

### Attendance

**update**: Student.groupId 대신 프론트엔드에서 전달받은 groupId 사용 (이미 설계됨)
- `studentGroupMap` 빌드 시 `Student.groupId` 대신 입력된 groupId 사용

**calendar / dayDetail**: `WHERE groupId=?` 학생 조회 → `StudentGroup WHERE groupId` JOIN

### Statistics

**groupStatistics / topGroups**: `WHERE groupId IN (...)` 학생 조회 → `StudentGroup` 기반
- type 필터: `Group WHERE organizationId AND type=?` → groupIds 필터

**excellent / weekly / monthly / yearly / byGender**:
- 학생 조회: `WHERE organizationId=?` 직접 (groupId 경유 불필요)

### Snapshot

**createStudentSnapshot**: groupId 파라미터 = GRADE 그룹의 id
- 호출부에서: `StudentGroup WHERE studentId AND group.type='GRADE'` → groupId (없으면 null)

## 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| T1 | GRADE + DEPARTMENT 그룹 생성 | 각 type 정상 저장 |
| T2 | 학생 생성 (GRADE 1 + DEPT 2) | StudentGroup 3건, Student.groupId 없음 |
| T3 | 학생 생성 GRADE 2개 | 400 |
| T4 | group.addStudent (GRADE, 기존 GRADE 있음) | 기존 GRADE 제거 + 새 GRADE 추가 |
| T5 | group.removeStudent | StudentGroup 삭제 |
| T6 | GRADE 그룹 삭제 (학생 있음) | 400 |
| T7 | DEPARTMENT 그룹 삭제 (학생 있음) | StudentGroup 삭제, 학생 유지 |
| T8 | 출석 기록 + 통계 조회 | StudentGroup 기반 정상 동작 |
| T9 | 마이그레이션 후 기존 데이터 | 기존 그룹 type=GRADE, 기능 정상 |

---

**작성일**: 2026-03-13
**상태**: Draft
