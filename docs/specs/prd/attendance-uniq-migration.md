# Attendance UNIQUE 마이그레이션 점검·정리 SQL

> 연결: `docs/specs/prd/attendance-uniq.md`
> 운영 DB에 직접 실행. 점검 1~4는 read-only, 정리 5는 발견 시에만 archive 백업 후 실행. MySQL 8.x 기준.

## 점검 (read-only)

### 점검 1 — 중복 그룹 수 + 영향 row 합계

```sql
SELECT
    COUNT(*) AS duplicate_groups,
    COALESCE(SUM(cnt), 0) AS affected_rows
FROM (
    SELECT student_id, date, COUNT(*) AS cnt
    FROM attendance
    GROUP BY student_id, date
    HAVING COUNT(*) > 1
) dup;
```

기대: `duplicate_groups = 0`. N>0이면 점검 2로 상세 확인.

### 점검 2 — 중복 row 상세 (마크 충돌 여부)

```sql
SELECT a._id, a.student_id, a.date, a.content, a.group_id, a.create_at, a.update_at
FROM attendance a
INNER JOIN (
    SELECT student_id, date
    FROM attendance
    GROUP BY student_id, date
    HAVING COUNT(*) > 1
) dup ON a.student_id = dup.student_id AND a.date = dup.date
ORDER BY a.student_id, a.date, a._id;
```

용도: cleanup 룰("최신 `_id` 1건 유지") 적용 시 손실되는 마크가 무엇인지 사전 확인.

### 점검 3 — `date IS NULL` row 수

```sql
SELECT COUNT(*) AS null_date_rows FROM attendance WHERE date IS NULL;
```

기대: `0`. NULL row가 있으면 UNIQUE 제약 동작에는 영향 없으나(MySQL UNIQUE는 NULL 중복 허용), 입력 경로상 발생 불가하므로 별도 정리 필요.

### 점검 4 — content 분포 (cleanup 정책 검증용)

```sql
SELECT content, COUNT(*) AS cnt
FROM attendance
GROUP BY content
ORDER BY cnt DESC;
```

용도: 비정상 마크(공백·null·기타 문자) 비율 확인. `attendance.update`의 화이트리스트(◎/○/△/-/'') 외 값이 발견되면 별도 정리.

## 정리 (write — 점검 1에서 N>0인 경우만)

### 5-A — archive 백업 (필수 선행)

```sql
CREATE TABLE attendance_archive_20260428 AS
SELECT a.*
FROM attendance a
INNER JOIN (
    SELECT student_id, date
    FROM attendance
    GROUP BY student_id, date
    HAVING COUNT(*) > 1
) dup ON a.student_id = dup.student_id AND a.date = dup.date;

SELECT COUNT(*) AS archived FROM attendance_archive_20260428;
```

기대: `archived = affected_rows`(점검 1 결과)와 일치.

### 5-B — 중복 cleanup (가장 큰 `_id` 1건만 유지)

```sql
DELETE FROM attendance
WHERE (student_id, date) IN (
    SELECT student_id, date FROM (
        SELECT student_id, date
        FROM attendance
        GROUP BY student_id, date
        HAVING COUNT(*) > 1
    ) t
)
AND _id NOT IN (
    SELECT max_id FROM (
        SELECT MAX(_id) AS max_id
        FROM attendance
        GROUP BY student_id, date
        HAVING COUNT(*) > 1
    ) t
);
```

룰: `_id`(BIGINT autoincrement)가 가장 큰 row = 가장 마지막 INSERT = 가장 최근 입력 마크 유지. `update_at` 기준 대신 `_id` 기준을 사용하는 이유는 INSERT 직후 `update_at`이 NULL이라 비교 불가.

### 5-C — cleanup 검증

```sql
SELECT COUNT(*) AS remaining_duplicates
FROM (
    SELECT student_id, date, COUNT(*) AS cnt
    FROM attendance
    GROUP BY student_id, date
    HAVING COUNT(*) > 1
) dup;
```

기대: `0`. 0이 아니면 5-B 재실행.

## 운영 적용 순서

1. **사전 점검**: 1 → 2 → 3 → 4 순으로 실행, 결과 기록
2. **점검 1 결과 0건**: 곧바로 마이그레이션 PR 머지 → UNIQUE DDL 적용
3. **점검 1 결과 N>0**: 5-A archive 백업 → 5-B cleanup → 5-C 검증 → 마이그레이션 PR 머지 → UNIQUE DDL 적용
4. **archive 테이블 보관**: 마이그레이션 후 30일 동안 유지, 운영 이상 없으면 drop
