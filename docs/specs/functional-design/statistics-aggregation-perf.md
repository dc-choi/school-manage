# 기능 설계: 통계 집계 DB 레벨 전환 (Performance)

> 상태: Draft | 작성일: 2026-04-17 | 분류: Non-Functional (Performance, P1)

## 연결 문서

- 기능 설계 (SSoT): `docs/specs/functional-design/statistics.md`
- TARGET 등록: `docs/specs/README.md` PERFORMANCE 표 P1

## 배경

통계 UseCase 4개가 `attendance.findMany()`로 전체 행을 Node 메모리에 적재한 뒤 JS `filter`/`forEach`로 집계한다. 데이터 증가 시 **메모리 사용량 + p95 응답 시간 동시 악화** 위험. 모델: `GetExcellentStudentsUseCase`/`GetTopOverallUseCase`는 이미 `database.$kysely` + `GROUP BY` 사용 중이며 패턴으로 정착.

## 변경 대상 / 비대상

| UseCase | 현재 | 전환 후 | 비고 |
|---------|------|--------|------|
| GetAttendanceRateUseCase | `findMany` + `filter().length` | Kysely `SUM(CASE)` 단일 스칼라 | 가장 단순 |
| GetTopGroupsUseCase | `findMany` + `forEach Map` | Kysely `GROUP BY group_id` + `SUM(CASE)` | 정렬/limit는 JS 유지 |
| GetGroupStatisticsUseCase | `findMany × 3` (주/월/년) + `forEach Map × 3` | Kysely `GROUP BY group_id` × 3 (Promise.all 유지) | 학년 그룹만 |
| GetByGenderUseCase | `findMany` + `filter × 3` | Kysely `SUM(CASE)` 3회 (M/F/unknown) — `studentId IN` 절 사용 | 스냅샷 gender 결정 후 쿼리 |
| GetExcellentStudentsUseCase | Kysely `GROUP BY` | 변경 없음 | 모델 패턴 |
| GetTopOverallUseCase | Kysely `GROUP BY` | 변경 없음 | 모델 패턴 |

## 동작 명세

기능 동작은 **완전 동일**. 결과 dto/필드/필터링 규칙(졸업, 스냅샷 폴백, `PRESENT_MARKS = ◎/○/△`) 모두 보존. 변경은 집계 위치(JS → DB)뿐.

### 알고리즘 (전환 후, 1줄 요약)

- 출석 카운트: `SUM(CASE WHEN content IN ('◎','○','△') THEN 1 ELSE 0 END)`
- 그룹별: `GROUP BY group_id` + 위 SUM
- 성별: 스냅샷에서 결정한 (M/F/unknown 학생 ID 집합)을 `studentId IN (...)` 필터로 SUM 3회

### 스냅샷/폴백 보존

- `getBulkStudentSnapshots`, `getBulkGroupSnapshots`, missing → student/group 폴백 — 기존 로직 그대로. 집계 SQL 진입 **전에** 학생 ID 분류만 수행.

### 공통 유틸 추가

`statistics.helper.ts`에 출석 카운트 SQL 추가 (`ATTENDANCE_SCORE_SQL`와 동일 위치):

```
PRESENT_COUNT_SQL = SUM(CASE WHEN a.content IN ('◎','○','△') THEN 1 ELSE 0 END)
```

> 의사코드/완전한 SQL은 작성하지 않음. 코드(SSoT)와 `rules/api.md`(Kysely 규칙)에 위임.

## 데이터/도메인 변경

없음. 스키마/마이그레이션/Prisma 모델 변경 없음.

## API/인터페이스

8개 procedure 시그니처/응답 필드 변경 없음. tRPC 라우터·Zod 스키마 무변경.

## 성능/제약

| 항목 | 현재 | 목표 |
|------|------|------|
| 출석 행 메모리 적재 | 기간 내 모든 행 (수천~수만/조회) | **0행 적재** (스칼라/소수 행만 수신) |
| 응답 시간 | findMany + JS 집계 (행 수 비례) | DB GROUP BY 단일 왕복 |
| Kysely 사용 | 2개 UseCase | 6개 UseCase |
| 인덱스 의존 | 없음 (앱 집계) | `attendance.(group_id, date)` 인덱스 권장 — BUGFIX P2 "Attendance 인덱스 누락"과 시너지 (이번 범위 외) |

## 예외/엣지 케이스

| 상황 | 처리 (변화 없음) |
|------|---------------|
| groupIds 빈 배열 | 출석 쿼리 생략, 0/빈 결과 즉시 반환 |
| totalDays 0 | 출석률 0% 즉시 반환 |
| 스냅샷 없음 | 현재 엔티티 폴백 (Student/Group) |
| `att.groupId` null | DB GROUP BY가 자연 제외. JS `if (!groupId) continue` 로직 제거 |

## 테스트 시나리오

### 정상 케이스 (회귀)

- **TC-1**: 기존 `apps/api/test/integration/statistics.test.ts` 521줄 전체 통과 — 결과 dto 동일성이 회귀 게이트.
- **TC-2**: 졸업생 필터링 케이스 (test:408-464) 통과 유지.
- **TC-3**: 성별 분포 케이스 (test:494-518) 통과 유지.

### 예외 케이스

- **TC-E1**: 빈 organization (그룹 0개) → 모든 procedure 0/빈 결과.
- **TC-E2**: `groupId IS NULL` 출석 행 존재 시 — 그룹 통계에서 자연 제외 확인 (DB GROUP BY 동작).
- **TC-E3**: PRESENT_MARKS 외 content (예: `'×'`, null) → 카운트 0 확인.

## 자기 검증 체크리스트

- [x] 동작 명세 수준 (구현 상세 위임)
- [x] PRD 요구사항 = "DB 레벨 GROUP BY 집계로 전환" 반영
- [x] 결과 동일성 (스냅샷/폴백/졸업 필터 전부 보존) 명시
- [x] 변경 대상/비대상 표로 명확화
- [x] 비기능 워크플로우(Task/Dev 생략) 고려해 짧게 유지 (190줄 이내)
- [x] 기존 `statistics.md` SSoT는 무변경 (기능 동작 변화 없음)
