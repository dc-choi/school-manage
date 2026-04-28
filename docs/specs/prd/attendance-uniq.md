# PRD: Attendance (student_id, date) 유니크 제약 추가

> 상태: Draft | 작성일: 2026-04-28

## 배경/문제 요약

- 참고: `docs/specs/README.md` TARGET BUGFIX P3 "Attendance 중복 레코드 방지"
- **문제**: `attendance` 테이블에 `(student_id, date)` DB 레벨 UNIQUE 제약이 없다. `update-attendance.usecase.ts:124-167`이 트랜잭션 내 `findFirst → create/updateMany` 패턴으로 단일 세션 race는 차단하지만, 두 세션이 동시에 같은 `(student_id, date)`로 출석을 입력하면 두 트랜잭션 모두 `findFirst` null을 보고 각자 `create`를 수행할 수 있다. 결과적으로 동일 학생·동일 날짜에 중복 row가 발생할 수 있다.
- **현재 상태**:
    - 스키마: `apps/api/prisma/schema.prisma:226-241` — `(student_id, date)` 일반 인덱스만 존재 (`@@index([studentId, date])`), UNIQUE 없음
    - 입력 경로: `attendance.update` mutation → `update-attendance.usecase.ts:124-167` (자동 저장 + 일괄 저장 공통)
    - 삭제 정책: **hard delete** (`tx.attendance.deleteMany`, `update-attendance.usecase.ts:172-188`) — FD 명시 (`functional-design/attendance-management.md:55`)
    - `deletedAt` 컬럼: schema에 존재하나 attendance 도메인에서 사실상 미사용 (UseCase의 `findFirst`만 `deletedAt: null` 필터, 삭제는 hard)
    - 실측: 04-27 기준 출석 11,255건. 실 중복 미발생 (관찰 기반)
- **목표 상태**: `(student_id, date)` 조합이 DB 레벨에서 유일성 보장. 두 세션 동시 입력 시 정확히 1건만 성공하고, 후속 요청은 기존 row를 update하는 동작으로 수렴.

## 목표/성공 기준

- **목표**: `attendance(student_id, date)` UNIQUE 제약 도입 + UseCase를 race-safe 패턴으로 전환하여 교차 세션 중복 발생 가능성 제거
- **성공 지표**:
    1. 동일 `(student_id, date)`로 동시 `attendance.update` 2건(서로 다른 caller 세션) → 정확히 1건 INSERT, 1건 UPDATE로 수렴, 결과 row 1건 (통합 테스트)
    2. 마이그레이션 적용 전 운영 DB의 `(student_id, date)` 중복 0건 확인 (사전 점검 SQL)
    3. 기존 attendance 통합 테스트 전부 통과 (현 290/290)
- **측정 기간**: 배포 후 즉시 검증

## 사용자/대상

- **주요 사용자**: 출석을 입력하는 교리교사 (모임 단위, 다수 교사 동시 사용 가능)
- **사용 맥락**: 출석 페이지 셀 단위 자동 저장(`isFull=false`) + 일괄 저장(`isFull=true`). 한 모임에 여러 교사가 동시 접속하여 같은 학년·같은 날짜를 편집할 수 있음. 동시 편집 시점에 실측 중복은 미발생했지만 구조적 차단이 부재.

## 범위

### 포함

- `attendance` 테이블에 `@@unique([studentId, date])` 추가 (schema.prisma)
- 마이그레이션 SQL: `ALTER TABLE attendance ADD UNIQUE KEY attendance_student_date_unique (student_id, date)` + 기존 일반 인덱스 `attendance_student_id_date_idx` 제거(중복) + `(group_id, date)` 인덱스는 유지
- 선행 작업: 운영 DB의 `(student_id, date)` 중복 점검 SQL → 중복 발견 시 cleanup
- `update-attendance.usecase.ts`의 `updateAttendance` 메서드를 **upsert 패턴**으로 전환 (`findFirst → create/updateMany` 제거)
    - 또는 차선책: `create` 시 Prisma `P2002` 캐치 → `updateMany` fallback (코드 변경 최소, 실용적)
- 동시성 통합 테스트 추가: 동일 `(student_id, date)`로 caller 2개가 `Promise.all`로 동시 호출 → 결과 row 1건 검증

### 제외

- `attendance.deletedAt` 컬럼 정리 (사실상 미사용이지만 별도 정리 사이클로 분리)
- `(student_id, date)` 외 다른 유니크 후보 (예: `groupId` 포함) — 동일 학생이 그룹 이동 후 같은 날짜에 두 그룹 출석 가능성은 운영상 0이고, 현 정책은 "최초 그룹 유지" (`update-attendance.usecase.ts:150` 주석)
- `attendance.update` API 시그니처 변경 — 입력 schema, 응답 형태 모두 유지
- 출석 입력 UX 변경 (자동 저장 동작·달력 모달 등 변경 없음)
- soft delete 도입 — 정책상 hard delete 유지

## 사용자 시나리오

1. **단일 교사 정상 입력**: 출석 셀 입력 → 자동 저장 1건 → DB INSERT 성공
2. **단일 교사 수정**: 동일 셀 재입력 → 기존 row UPDATE (마크 변경)
3. **두 교사 동시 입력 (race)**: 교사 A·B가 동시에 같은 학생·같은 날짜에 출석 입력 → 한 트랜잭션 INSERT 성공, 다른 트랜잭션 INSERT 시 `P2002` 발생 → fallback UPDATE로 수렴 → 최종 row 1건 (마지막 update 마크 유지)
4. **일괄 저장 (`isFull=true`) 중 일부 충돌**: 같은 그룹을 두 교사가 동시에 일괄 저장 → 각 셀별로 race-safe upsert로 수렴 (mutation 단위는 트랜잭션이지만 셀별 병렬은 아님 → 트랜잭션 내 순차)
5. **삭제 후 재입력**: 빈 마크로 자동 저장(hard delete) → 같은 셀에 다시 입력 → 새 INSERT 성공 (UNIQUE 위반 없음, 이전 row가 삭제됐으므로)

## 요구사항

### 필수 (Must)

- [ ] **선행 점검 (마이그레이션 적용 전)**: 운영 DB에 `SELECT student_id, date, COUNT(*) AS cnt FROM attendance GROUP BY student_id, date HAVING cnt > 1` 실행 → 중복 0건 확인. 발견 시 cleanup 선행
- [ ] **중복 발견 시 cleanup**: 동일 `(student_id, date)`의 가장 최신 `update_at`(없으면 `create_at`) 행 1건만 유지, 나머지 hard delete (별도 마이그레이션 커밋)
- [ ] `schema.prisma`의 `Attendance`에 `@@unique([studentId, date], name: "attendance_student_date_unique")` 추가, 기존 `@@index([studentId, date])` 제거
- [ ] 마이그레이션 SQL: 기존 인덱스 drop + UNIQUE KEY add (online DDL 전제, 무중단)
- [ ] `update-attendance.usecase.ts`의 `updateAttendance`를 race-safe 패턴으로 전환:
    - **권장**: `tx.attendance.upsert({ where: { studentId_date: ... }, create: ..., update: ... })`
    - **차선**: 기존 흐름 유지 + `create` 시 `P2002` 캐치 → `updateMany` fallback
- [ ] 통합 테스트: 동일 `(student_id, date)`로 caller 2개가 `Promise.all` 동시 호출 → 결과 row 1건, 마지막 마크 반영 확인
- [ ] 기존 attendance 통합 테스트(290건) 전부 통과

### 선택 (Should)

- [ ] 마이그레이션 적용 결과(중복 cleanup 건수)를 `docs/business/HISTORY.md`에 기록
- [ ] `update-attendance.usecase.ts:150` 주석 업데이트 (groupId 보존 정책 + race-safe 패턴 설명)

### 제외 (Out)

- `attendance.deletedAt` 컬럼 제거
- 출석 입력 UX 변경
- soft delete 정책 도입

## 제약/가정/리스크/의존성

- **제약**:
    - `date` 컬럼은 `VARCHAR(50) NULL` (schema:228) — UNIQUE 추가 시 `NULL` 처리 필요. MySQL은 `NULL`을 UNIQUE에서 중복으로 취급하지 않음 (다중 NULL 허용). 하지만 attendance 입력 경로에서 `date`는 `getFullTime(year, month, day)`로 항상 채워지므로 NULL row는 사실상 없음. 운영 DB의 `WHERE date IS NULL` row 수도 사전 점검 시 함께 확인
    - 마이그레이션은 단일 SQL로 적용 가능 (출석 11,255건 규모, MySQL 8.x online DDL 지원)
- **가정**:
    - 운영 DB에서 `(student_id, date)` 중복 row가 0건 (관찰 기반, 사전 SQL로 확정)
    - `date NULL` row 0건 (입력 경로상 발생 불가)
    - upsert 또는 P2002 캐치 fallback이 트랜잭션 내에서 정상 동작 (Prisma 표준)
- **리스크**:
    - **운영 DB 중복 발견**: 사전 점검 SQL 결과로만 확인 가능. 발견 시 cleanup 마이그레이션 별도 커밋 필요. 발견 가능성은 낮으나 0이 아님 (브라우저 다중 탭, 동시 편집 등)
    - **upsert 전환 시 groupId 보존 정책 위배 가능**: 기존 코드는 update 시 `groupId`를 명시적으로 갱신하지 않음 (최초 기록 시점 유지). upsert로 전환할 때 `update` 절에서 `groupId`를 누락해야 정책 유지. 누락 안 할 시 학생이 그룹 이동 후 출석을 수정하면 historical groupId가 손실됨 → 통계 영향. 명시적으로 update 절에서 `groupId` 제외 필수
    - **차선 패턴(P2002 캐치)의 추가 쿼리 부담**: 정상 케이스에서도 `findFirst` 1회 + `create` 1회 = 2 쿼리, 충돌 시 3 쿼리. upsert는 1 쿼리. 트래픽 규모가 작아 영향 미미하나, upsert가 우월함
- **내부 의존성**:
    - `apps/api/prisma/schema.prisma` + 신규 마이그레이션 파일 (`/prisma-migrate` 스킬)
    - `apps/api/src/domains/attendance/application/update-attendance.usecase.ts`
    - `apps/api/test/integration/attendance.test.ts`
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: 단일 PR. 운영 DB 사전 점검 SQL(부록) → 중복 0건 확인(또는 cleanup 선행) → 머지·배포. 출석 입력 트래픽이 적은 시간대(평일 야간) 권장. UNIQUE 인덱스 추가는 online DDL이므로 실 서비스 영향 미미 (선례: Attendance 복합 인덱스 추가 #272 무중단 적용)
- **이벤트**: GA4 이벤트 없음
- **데이터 안전 장치**:
    - 마이그레이션 직전 RDS 스냅샷 또는 `mysqldump attendance` 백업
    - cleanup 필요 시 `attendance_archive_YYYYMMDD` 테이블에 영향 row 백업 선행
    - 스테이징/로컬에서 마이그레이션 dry run + 회귀 테스트 후 운영 적용
- **검증**:
    - 통합 테스트 `pnpm test` 통과 (동시성 테스트 신규 + 기존 290건)
    - 스테이징 또는 로컬 DB에서 마이그레이션 적용 → 기존 데이터 보존 확인

## 오픈 이슈

- [ ] **운영 DB 중복 점검 결과**: 사전 SQL 실행 후 결과 기록 (0건 / N건). N>0이면 cleanup 마이그레이션 첨부
- [ ] **upsert vs P2002 캐치 fallback 패턴 선택**: 기능 설계(2단계)에서 확정. upsert 권장
- [ ] **`attendance.deletedAt` 컬럼 정리**: 사실상 미사용. 별도 사이클로 분리 (본 PRD 범위 외)

## 연결 문서

- 사업 문서: `docs/specs/README.md` (TARGET BUGFIX P3)
- 마이그레이션 SQL: `docs/specs/prd/attendance-uniq-migration.md` (점검 4건 + 정리 3단계)
- 기능 설계: `docs/specs/functional-design/attendance-management.md` (구현 완료 후 병합 예정)
