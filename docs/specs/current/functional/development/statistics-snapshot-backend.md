# Development: 통계 스냅샷 (Backend)

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 상위 문서

- PRD: `docs/specs/prd/statistics-snapshot.md`
- 기능 설계: `docs/specs/functional-design/statistics.md` (통계 스냅샷 섹션)
- Task: `docs/specs/target/functional/tasks/statistics-snapshot.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| B1 | DB 스키마 변경 | O |
| B2 | 스냅샷 서비스 구현 | O |
| B3 | Student UseCase에 스냅샷 연동 | O |
| B4 | Group UseCase에 스냅샷 연동 | O |
| B5 | Attendance UseCase에 groupId 저장 | O |
| B6 | 통계 UseCase 스냅샷 기반 전환 | O |
| B7 | 테스트 | O |

## 구현 개요

Student/Group 변경 시 스냅샷 테이블에 해당 시점 상태를 자동 저장하고, Attendance에 groupId를 추가하여, 통계 조회 시 과거 시점 기준의 정확한 데이터를 반환한다.

---

## B1: DB 스키마 변경

### Prisma 스키마 추가

#### StudentSnapshot 모델

```
model StudentSnapshot {
    id          BigInt   @id @default(autoincrement()) @map("_id")
    studentId   BigInt   @map("student_id")
    societyName String   @map("society_name") @db.VarChar(50)
    catholicName String? @map("catholic_name") @db.VarChar(50)
    gender      String?  @db.VarChar(10)
    groupId     BigInt   @map("group_id")
    snapshotAt  DateTime @map("snapshot_at")

    student Student @relation(fields: [studentId], references: [id])

    @@map("student_snapshot")
}
```

#### GroupSnapshot 모델

```
model GroupSnapshot {
    id         BigInt   @id @default(autoincrement()) @map("_id")
    groupId    BigInt   @map("group_id")
    name       String   @db.VarChar(50)
    snapshotAt DateTime @map("snapshot_at")

    group Group @relation(fields: [groupId], references: [id])

    @@map("group_snapshot")
}
```

#### Attendance 모델 변경

```
# 기존 필드에 추가:
groupId BigInt? @map("group_id")
```

#### 인덱스

```
StudentSnapshot:
    @@index([studentId, snapshotAt])

GroupSnapshot:
    @@index([groupId, snapshotAt])
```

> 스냅샷 조회 핵심 패턴 `snapshotAt <= referenceDate ORDER BY snapshotAt DESC LIMIT 1`의 성능을 위해 복합 인덱스 필수.

#### 관계 추가

- Student 모델에 `snapshots StudentSnapshot[]` 관계 추가
- Group 모델에 `snapshots GroupSnapshot[]` 관계 추가

### 마이그레이션 (DDL + DML 통합)

1. `schema.prisma` 변경 후 `/prisma-migrate` 스킬 실행 → DDL + DML 포함된 단일 SQL 파일 생성
2. `pnpm prisma db push` → 개발 DB 적용
3. `pnpm prisma generate` → 클라이언트 재생성

#### DML: 기존 데이터 초기 스냅샷 + Attendance groupId 역보정

> `/prisma-migrate` 스킬이 생성하는 SQL 파일의 DML 섹션에 아래 내용이 포함되어야 함.

```sql
-- 기존 Student → StudentSnapshot 초기 생성 (deletedAt, graduatedAt 무관 — 전체)
INSERT INTO student_snapshot (student_id, society_name, catholic_name, gender, group_id, snapshot_at)
SELECT _id, society_name, catholic_name, gender, group_id, NOW()
FROM student;

-- 기존 Group → GroupSnapshot 초기 생성 (deletedAt 무관 — 전체)
INSERT INTO group_snapshot (group_id, name, snapshot_at)
SELECT _id, name, NOW()
FROM `group`;

-- Attendance groupId 역보정 (group_id가 NULL인 레코드만)
UPDATE attendance a
JOIN student s ON a.student_id = s._id
SET a.group_id = s.group_id
WHERE a.group_id IS NULL;

-- 결과 확인
SELECT 'student_snapshot' AS table_name, COUNT(*) AS count FROM student_snapshot
UNION ALL
SELECT 'group_snapshot', COUNT(*) FROM group_snapshot
UNION ALL
SELECT 'attendance_group_id_filled', COUNT(*) FROM attendance WHERE group_id IS NOT NULL
UNION ALL
SELECT 'attendance_group_id_null', COUNT(*) FROM attendance WHERE group_id IS NULL;
```

> **주의**: 역보정은 현재 Student.groupId 기준이므로, 과거 다른 그룹에 속했던 기록도 현재 그룹으로 설정됨 (최선 추정).

---

## B2: 스냅샷 헬퍼 함수 구현

### 파일 위치

```
apps/api/src/domains/snapshot/snapshot.helper.ts
```

> 별도 UseCase가 아닌 **헬퍼 함수**로 구현. 각 도메인 UseCase 내부에서 트랜잭션 클라이언트(tx)와 함께 호출한다.

### createStudentSnapshot

```
입력: tx (트랜잭션 클라이언트), studentId, societyName, catholicName, gender, groupId
동작:
  1. tx.studentSnapshot.create({
       studentId, societyName, catholicName, gender, groupId,
       snapshotAt: getNowKST()
     })
```

### createGroupSnapshot

```
입력: tx (트랜잭션 클라이언트), groupId, name
동작:
  1. tx.groupSnapshot.create({
       groupId, name,
       snapshotAt: getNowKST()
     })
```

---

## B3: Student UseCase에 스냅샷 연동

각 UseCase의 엔티티 변경 **이후**에 스냅샷을 생성한다.

### create-student.usecase.ts

```
기존: database.student.create(...)
변경: 트랜잭션으로 감싸기
  1. tx.student.create(...)
  2. createStudentSnapshot 호출 (tx 전달)
     - studentId: 생성된 student.id
     - societyName, catholicName, gender, groupId: 입력값
```

> **원자성**: 기존 코드는 트랜잭션 없음. 엔티티 생성과 스냅샷 생성을 트랜잭션으로 묶어 불일치 방지.

### update-student.usecase.ts

```
기존: database.student.update(...)
변경: 트랜잭션으로 감싸기
  1. tx.student.update(...)
  2. createStudentSnapshot 호출 (tx 전달)
     - studentId: 수정된 student.id
     - societyName, catholicName, gender, groupId: 수정 후 값
```

> **원자성**: 기존 코드는 트랜잭션 없음. 엔티티 수정과 스냅샷 생성을 트랜잭션으로 묶어 불일치 방지.

### graduate-students.usecase.ts

```
기존: 트랜잭션 내 for loop → tx.student.update(data: { graduatedAt })
추가: 각 학생 update 후 → createStudentSnapshot 호출 (tx 전달)
  - 학생의 현재 societyName, catholicName, gender, groupId
```

### cancel-graduation.usecase.ts

```
기존: 트랜잭션 내 for loop → tx.student.update(data: { graduatedAt: null })
추가: 각 학생 update 후 → createStudentSnapshot 호출 (tx 전달)
  - 학생의 현재 societyName, catholicName, gender, groupId
```

### promote-students.usecase.ts

> **변경 없음**. 이 UseCase는 TODO(학생 데이터 이관)가 남아있어 향후 구조 변경 예정이므로 현재 스냅샷 연동 대상에서 제외.

---

## B4: Group UseCase에 스냅샷 연동

### create-group.usecase.ts

```
기존: database.group.create(...)
변경: 트랜잭션으로 감싸기
  1. tx.group.create(...)
  2. createGroupSnapshot 호출 (tx 전달)
     - groupId: 생성된 group.id
     - name: 입력값
```

> **원자성**: 기존 코드는 트랜잭션 없음. 엔티티 생성과 스냅샷 생성을 트랜잭션으로 묶어 불일치 방지.

### update-group.usecase.ts

```
기존: database.group.update(...)
변경: 트랜잭션으로 감싸기
  1. tx.group.update(...)
  2. createGroupSnapshot 호출 (tx 전달)
     - groupId: 수정된 group.id
     - name: 수정 후 값
```

> **원자성**: 기존 코드는 트랜잭션 없음. 엔티티 수정과 스냅샷 생성을 트랜잭션으로 묶어 불일치 방지.

---

## B5: Attendance UseCase에 groupId 저장

### update-attendance.usecase.ts

```
기존 (생성 분기):
  tx.attendance.create({
      data: { date, content, studentId, createdAt }
  })

변경 (생성 분기):
  1. 해당 studentId로 Student 조회 → student.groupId 획득
  2. tx.attendance.create({
      data: { date, content, studentId, groupId: student.groupId, createdAt }
  })

기존 (수정 분기):
  tx.attendance.updateMany({
      data: { content, updatedAt }
  })

변경 (수정 분기): 변경 없음 (groupId는 최초 기록 시점 유지)
```

> **최적화**: 트랜잭션 시작 시 attendance 배열의 모든 studentId에 대해 Student를 한 번에 조회하여 studentId→groupId 매핑을 미리 구성.

---

## B6: 통계 UseCase 스냅샷 기반 전환

### 공통 변경: 스냅샷 조회 헬퍼

```
apps/api/src/domains/snapshot/snapshot.helper.ts
```

> B2에서 구현한 헬퍼 파일에 조회 함수도 함께 작성.

#### getStudentSnapshot

```
입력: studentId, referenceDate (기준 날짜)
동작:
  1. StudentSnapshot에서 studentId 일치 AND snapshotAt <= referenceDate 중 가장 최근 조회
  2. 결과 없으면 null 반환
출력: { societyName, catholicName, gender, groupId } | null
```

#### getGroupSnapshot

```
입력: groupId, referenceDate (기준 날짜)
동작:
  1. GroupSnapshot에서 groupId 일치 AND snapshotAt <= referenceDate 중 가장 최근 조회
  2. 결과 없으면 null 반환
출력: { name } | null
```

#### getBulkStudentSnapshots

```
입력: studentIds[], referenceDate
동작:
  1. 각 studentId별로 snapshotAt <= referenceDate 중 가장 최근 스냅샷 조회
  2. studentId → snapshot 매핑 반환
출력: Map<studentId, { societyName, catholicName, gender, groupId }>
```

#### getBulkGroupSnapshots

```
입력: groupIds[], referenceDate
동작:
  1. 각 groupId별로 snapshotAt <= referenceDate 중 가장 최근 스냅샷 조회
  2. groupId → snapshot 매핑 반환
출력: Map<groupId, { name }>
```

### 공통 변경: 학생 목록 조회 방식

```
기존:
  database.student.findMany({
      where: { deletedAt: null, graduatedAt: null, group: { accountId, deletedAt: null } }
  })

변경:
  1. 계정 소속 그룹 목록 조회 (삭제 포함: deletedAt 필터 제거)
     → accountId 기준 모든 그룹의 groupId 목록
  2. 해당 기간의 attendance에서 groupId IN (그룹 목록) AND deletedAt IS NULL인 레코드 조회
  3. attendance에서 고유 studentId 추출 → 이것이 "해당 기간의 학생 수"(분모)
  4. attendance에서 content IN ('◎', '○', '△')인 레코드만 → 실제 출석 수(분자)
```

> **핵심 변경**: `graduatedAt: null` 필터 제거. attendance 레코드 존재 자체가 해당 기간 활성 학생의 증거.

### get-attendance-rate.usecase.ts 변경

```
기존:
  students = Student에서 graduatedAt: null 조건으로 조회
  totalStudents = students.length
  attendances = Attendance에서 studentIds, 기간, content 조건 조회

변경:
  1. 계정 소속 groupIds 조회 (deletedAt 필터 없이 전체)
  2. attendances = Attendance에서 groupId IN (groupIds), 기간, deletedAt: null 조건 조회
  3. totalStudents = 기간 내 고유 studentId 수 (attendance 기반)
  4. actualAttendances = content IN ('◎', '○', '△') 필터 적용한 수
  5. 출석률 = actualAttendances / (totalStudents × totalDays) × 100
```

### get-group-statistics.usecase.ts 변경

```
기존:
  groups = Group에서 deletedAt: null 조회
  각 group → students = Student에서 groupId, graduatedAt: null 조회
  각 group → attendance 조회 후 통계 계산

변경:
  1. 기간 내 attendance에서 groupId IN (계정 소속 groupIds), deletedAt: null 조회
  2. attendance.groupId로 그룹핑
  3. 각 groupId별:
     - totalStudents = 해당 groupId의 고유 studentId 수
     - actualAttendances = content IN ('◎', '○', '△') 수
     - 출석률/평균 계산
  4. groupName: getBulkGroupSnapshots로 해당 연도 말 기준 스냅샷 조회
     - 스냅샷 없으면 Group.name 폴백
     - Group도 없으면 "삭제된 학년"
```

### get-by-gender.usecase.ts 변경

```
기존:
  students = Student에서 graduatedAt: null 조회
  성별로 그룹핑 → 각 성별 attendance 조회

변경:
  1. 기간 내 attendance에서 고유 studentId 추출
  2. getBulkStudentSnapshots로 해당 연도 말 기준 스냅샷 조회
  3. 스냅샷의 gender로 그룹핑 (스냅샷 없으면 Student.gender 폴백)
  4. 각 성별: attendance 기반 출석률 계산
```

### get-top-groups.usecase.ts 변경

```
기존:
  groups = Group에서 deletedAt: null 조회
  각 group → students (graduatedAt: null) → attendance → 출석률

변경:
  1. get-group-statistics와 동일한 로직으로 groupId별 출석률 계산
  2. 출석률 내림차순 정렬 → limit 적용
  3. groupName: GroupSnapshot 기준 (폴백: Group.name → "삭제된 학년")
```

### get-top-overall.usecase.ts 변경

```
기존 (raw SQL):
  JOIN student s → group g
  WHERE s.graduated_at IS NULL
  SELECT s.society_name, g.name as group_name

변경 (raw SQL):
  1. graduated_at IS NULL 조건 제거
  2. JOIN attendance a → a.group_id 사용
  3. 결과의 society_name, group_name: 스냅샷 기반으로 대체
     - raw SQL 결과 후 애플리케이션 레벨에서 getBulkStudentSnapshots, getBulkGroupSnapshots 호출
     - 스냅샷 값으로 덮어쓰기 (폴백: raw SQL 결과 유지)
```

### get-excellent-students.usecase.ts 변경

```
기존 (raw SQL):
  WHERE s.graduated_at IS NULL
  SELECT s.society_name
  출력: { id, society_name (snake_case), count }

변경 (raw SQL):
  1. graduated_at IS NULL 조건 제거
  2. 결과의 society_name: 스냅샷 기반으로 대체
     - raw SQL 결과 후 getBulkStudentSnapshots 호출
     - 스냅샷의 societyName → row.society_name에 매핑 (폴백: raw SQL 결과 유지)
  3. 최종 출력 필드명: society_name (기존 snake_case 유지)
```

> **필드명 주의**: 이 UseCase는 출력이 `society_name` (snake_case). `get-top-overall`은 `societyName` (camelCase). 스냅샷 대체 시 각 UseCase의 기존 출력 형식을 유지해야 함.

---

## B7: 테스트

### 파일 위치

```
apps/api/test/integration/snapshot.test.ts
```

### 정상 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 학생 생성 시 스냅샷 | createStudent 호출 | StudentSnapshot 1건 생성 |
| 학생 수정 시 스냅샷 | updateStudent 호출 (이름 변경) | StudentSnapshot 추가 1건 생성 (변경 후 값) |
| 그룹 생성 시 스냅샷 | createGroup 호출 | GroupSnapshot 1건 생성 |
| 그룹 수정 시 스냅샷 | updateGroup 호출 (이름 변경) | GroupSnapshot 추가 1건 생성 (변경 후 값) |
| 출석 생성 시 groupId | attendance.update (isFull: true) | attendance.groupId = student의 현재 groupId |
| 졸업 학생 과거 통계 | 학생 졸업 후 → 과거 연도 statistics.yearly | 졸업 학생의 출석 포함 |
| 학년 전환 후 과거 통계 | promote 후 → 과거 연도 statistics.groupStatistics | 이전 학년명으로 그룹핑 |
| 스냅샷 기반 이름 조회 | 이름 변경 후 → 과거 연도 statistics.excellent | 변경 전 이름으로 표시 |

### 예외 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 스냅샷 없는 학생 | 마이그레이션 전 학생 통계 조회 | Student 현재 정보로 폴백 |
| attendance.groupId null | 역보정 안 된 레코드 통계 | Student.groupId로 폴백 |
| 삭제된 그룹 (스냅샷 있음) | 그룹 삭제 후 과거 통계 | 마지막 GroupSnapshot name 사용 |
| 삭제된 그룹 (스냅샷 없음) | 스냅샷 없는 삭제 그룹 통계 | "삭제된 학년" 표시 |

---

## 구현 시 주의사항

- [ ] 스냅샷 헬퍼 함수는 트랜잭션 클라이언트(tx)를 필수로 받음 (모든 호출이 트랜잭션 내에서 수행)
- [ ] Bulk 스냅샷 조회 시 N+1 방지: studentId/groupId별 최신 스냅샷을 한 번의 쿼리로 조회
- [ ] raw SQL UseCase (excellent, topOverall)는 SQL에서 graduated_at 조건만 제거하고, 이름/그룹명은 애플리케이션 레벨에서 스냅샷으로 대체
- [ ] B1 마이그레이션 SQL은 DDL(스키마 변경) + DML(데이터 이관)을 단일 파일로 관리
- [ ] KST 타임스탬프: `getNowKST()` 사용

## AI 구현 지침

### 파일 위치

- 스냅샷 헬퍼: `apps/api/src/domains/snapshot/snapshot.helper.ts`
- 스키마: `apps/api/prisma/schema.prisma`
- 마이그레이션 SQL: `/prisma-migrate` 스킬이 `apps/api/prisma/migrations/` 하위에 생성
- 테스트: `apps/api/test/integration/snapshot.test.ts`

### 참고할 기존 패턴

- UseCase 구조: `apps/api/src/domains/student/application/create-student.usecase.ts`
- 트랜잭션 패턴: `apps/api/src/domains/student/application/graduate-students.usecase.ts`
- raw SQL 패턴: `apps/api/src/domains/statistics/application/get-excellent-students.usecase.ts`
- tRPC 스키마: `packages/trpc/src/schemas/statistics.ts`

### 코드 스타일

- UseCase 클래스 패턴: `class XxxUseCase { async execute(input): Promise<Output> }`
- BigInt 변환: 입력 `BigInt(input.id)`, 출력 `String(entity.id)`
- 날짜: `getNowKST()` (from @school/utils)

---

**작성일**: 2026-02-24
**리뷰 상태**: Draft
