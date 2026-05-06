# PRD: Student.contact 타입 이관 (BigInt → String)

> 상태: Draft | 작성일: 2026-04-30

## 배경/문제 요약

- 참고:
    - `docs/specs/README.md` TARGET BUGFIX P3 "Student.contact 타입 이관"
    - `docs/specs/prd/student-extra-fields.md` (parentContact 도입 — 후속 과제로 명시)
    - `docs/specs/prd/input-validation-hardening.md` (contact 검증 규칙 계승)
- **문제**: `Student.contact`가 `BigInt?`로 저장되어 **선행 0이 잘리는 잠재 버그**가 존재한다. `01012345678`이 `1012345678`로 저장되며, 응답 시 String 변환만으로는 원본 입력 형식을 복원할 수 없다.
    - 현재 임시 회피책: `formatContact` 유틸이 표시 직전 `padStart(11, '0')` 적용 → 11자리 휴대폰 번호 가정 하에서만 동작. 일반 전화·해외 번호는 복원 실패.
    - `parentContact`(2026-04 도입)는 처음부터 `String? @db.VarChar(20)` — 동일 도메인 내 두 연락처 필드의 타입 불일치.
- **현재 상태**:
    - 스키마: `apps/api/prisma/schema.prisma:187` (`Student.contact BigInt?`), `:249` (`StudentSnapshot.contact BigInt?`)
    - 앱 레이어는 이미 String 기반:
        - Zod 스키마 (`packages/shared/src/schemas/student.ts`): `contact: z.string().regex(/^\d+$/).max(15).optional()` — 입력 String
        - 응답 타입(`StudentBase.contact: string`)도 String
        - UseCase 9곳에서 `BigInt(input.contact)`(쓰기) / `String(student.contact)`(읽기) 양 끝 변환만 수행
        - 프론트엔드(`StudentForm`, `StudentDetailPage`, `StudentListPage`, `GroupDetailPage`, `excel-import.ts`)는 이미 String 처리
    - DB 데이터: 활성 학생 2,684명(STATUS 04-27 기준) + 비활성 포함 누적, `StudentSnapshot.contact` 동일
    - `formatContact` (`packages/utils/src/format.ts:8`)는 String 가정 + `padStart(11, '0')` 적용 — 11자리 휴대폰 외 케이스 미지원
- **목표 상태**: `Student.contact`/`StudentSnapshot.contact` 모두 `String? @db.VarChar(20)`로 통일. 사용자 입력 원본 그대로 보존. UseCase의 양 끝 변환 코드 제거. `parentContact`와 타입 일관성 확보.

## 목표/성공 기준

- **목표**: `Student.contact`/`StudentSnapshot.contact` BigInt → String 이관 + 선행 0 보존 + 양 끝 변환 코드 제거
- **성공 지표**:
    1. 마이그레이션 후 운영 DB의 `student.contact` NOT NULL row 중 BigInt 변환 흔적(예: 11자리 미만 휴대폰 후보) 0건 — 사전 점검 SQL로 확인된 패딩 대상 전부 정상 이관
    2. 마이그레이션 전후 `student` row 수, `student_snapshot` row 수 동일 (데이터 손실 0)
    3. 기존 student 통합 테스트 전부 통과 (현 student.test.ts 케이스)
    4. `BigInt(input.contact)` / `String(student.contact)` 호출이 백엔드 코드에서 제거됨 (grep 0건)
- **측정 기간**: 배포 후 즉시 검증 + 1주 운영 모니터링 (입력 회귀 없음 확인)

## 사용자/대상

- **주요 사용자**: 주일학교 교사 (학생 등록·수정 시 contact 입력)
- **사용 맥락**:
    - 신규 학생 등록 시 휴대폰/일반 전화 번호 입력 → 원본 그대로 저장
    - 기존 학생 contact 표시 — 선행 0 보존된 형태로 노출
    - 엑셀 일괄 등록 시 텍스트 셀 그대로 저장 (선행 0 보존)
    - 사용자 가시 변경 없음 (UX 무변동) — DB 타입 일관성 확보가 핵심

## 범위

### 포함

- `Student.contact`: `BigInt?` → `String? @db.VarChar(20)` 스키마 변경
- `StudentSnapshot.contact`: `BigInt?` → `String? @db.VarChar(20)` 스키마 변경 (이력 일관성)
- 데이터 마이그레이션: 기존 BigInt 값 → String 변환 + **11자리 휴대폰 후보 패딩** 정책 적용
    - 패딩 정책: 변환 결과가 10자리이고 `1[0-9]`로 시작하면 `0` 한 자리 prefix (예: `1012345678` → `01012345678`)
    - 그 외 길이/패턴은 BigInt 디지트 그대로 (해외번호·일반전화 분기 없이 원형 보존)
    - 정책 한계: 본래 `1012345678`이 정상 입력이었던 케이스(가능성 매우 낮음)는 구분 불가 — 사전 점검 SQL로 분포 확인 후 결정
- UseCase 정리 (총 9곳, 백엔드):
    - `create-student.usecase.ts`, `update-student.usecase.ts`, `bulk-create-students.usecase.ts`: `BigInt(input.contact)` 제거 → `input.contact` 그대로 전달
    - `get-student.usecase.ts`, `list-students.usecase.ts`, `delete-student.usecase.ts`: `String(student.contact)` 제거 → 그대로 반환
    - `graduate-students.usecase.ts`, `cancel-graduation.usecase.ts`: snapshot 데이터 전달 시 BigInt → String 그대로
    - `snapshot.helper.ts`: `CreateStudentSnapshotInput.contact`, `StudentSnapshotData.contact` 타입 `bigint | null` → `string | null`
- `formatContact` 단순화 (`packages/utils/src/format.ts`): `padStart(11, '0')` 제거 — 원본 입력이 보존되므로 표시 단계 패딩 불필요. 단, 표시 포매팅(`010-1234-5678` 분리)은 유지
- 통합 테스트 갱신: `student.test.ts` mock 데이터에서 BigInt 리터럴(`1099998888n`) 제거, String 일관 사용
- Prisma 마이그레이션 SQL: `ALTER TABLE student MODIFY COLUMN contact VARCHAR(20) NULL` + `student_snapshot` 동일

### 제외

- `parentContact` 관련 변경 — 이미 `String? VARCHAR(20)`
- `Account.email` 등 다른 도메인 타입 통일 — 본 PRD 범위 외
- contact 입력 검증 강화 (E.164 등 국제 표준 도입) — 별도 과제. 본 PRD는 **타입 이관**에 집중
- 표시 포매팅 정책 변경 (`010-XXXX-XXXX` 외 패턴) — 현 정책 유지
- Excel Import 시 텍스트/숫자 셀 처리 강화 — 클라이언트 `padStart(11, '0')` 정책은 마이그레이션 후 재검토 (Should)

## 사용자 시나리오

1. **마이그레이션 적용**: 운영 DB에서 `ALTER TABLE` 적용 → 기존 `01012345678` BigInt 저장값(`1012345678`)이 String `01012345678`로 패딩 변환되어 저장
2. **마이그레이션 후 신규 등록**: 교사가 `010-1234-5678` 입력 → 클라이언트 정규화 → 서버에 `01012345678` 전달 → DB에 String 그대로 저장
3. **마이그레이션 후 기존 학생 조회**: 응답 contact가 패딩된 String → 프론트엔드 `formatContact`가 `010-1234-5678`로 포매팅 (기존과 동일 표시)
4. **해외번호/일반전화 케이스 (있다면)**: BigInt 저장 흔적이 11자리 휴대폰 패턴이 아니면 디지트 그대로 보존 → 표시 포매팅이 알아서 처리 (현 `formatContact` 동작 호환)
5. **엑셀 일괄 등록**: 클라이언트가 String 정규화 → 서버에 String 전달 → DB String 저장 (변환 단계 제거)

## 요구사항

### 필수 (Must)

- [ ] **선행 점검 (마이그레이션 적용 전)**: 운영 DB에서 `Student.contact` 분포 확인 SQL
    - `SELECT LENGTH(CAST(contact AS CHAR)) AS len, COUNT(*) FROM student WHERE contact IS NOT NULL GROUP BY len ORDER BY len`
    - `SELECT contact, COUNT(*) FROM student WHERE contact IS NOT NULL AND LENGTH(CAST(contact AS CHAR)) NOT IN (10, 11) GROUP BY contact LIMIT 50` (이상치 샘플)
    - `student_snapshot.contact` 동일 점검
- [ ] **데이터 마이그레이션 전략 확정**: 점검 결과 기반으로 패딩 규칙 적용 (10자리 + `1[0-9]` 시작 → `0` prefix), 그 외 디지트 그대로
- [ ] `schema.prisma:187` `Student.contact`: `BigInt?` → `String? @db.VarChar(20)`
- [ ] `schema.prisma:249` `StudentSnapshot.contact`: `BigInt?` → `String? @db.VarChar(20)`
- [ ] Prisma 마이그레이션 SQL (`/prisma-migrate` 스킬 사용):
    - `student` 테이블 `contact` 컬럼 ALTER + 데이터 변환 (단일 SQL 또는 임시 컬럼 경유)
    - `student_snapshot` 동일 처리
    - online DDL 가능 여부 확인 (MySQL 8.x). 불가 시 점검 + 임시 컬럼 경유 + RENAME 방식
- [ ] 백엔드 UseCase 양 끝 변환 제거 (9곳):
    - `create-student.usecase.ts:49`, `:98`
    - `update-student.usecase.ts:40`, `:96`
    - `bulk-create-students.usecase.ts:36`
    - `get-student.usecase.ts:42`
    - `list-students.usecase.ts:95`
    - `delete-student.usecase.ts:51`
    - `graduate-students.usecase.ts:93`, `cancel-graduation.usecase.ts:50`
- [ ] `snapshot.helper.ts` 인터페이스 String 화 (`L16`, `L34`, `L58`, `L112`, `L145`)
- [ ] `formatContact` (`packages/utils/src/format.ts:8`)에서 `padStart(11, '0')` 제거 (원본 입력 보존되므로 불필요)
- [ ] 통합 테스트 (`apps/api/test/integration/student.test.ts`) BigInt 리터럴 제거 + String 일관화
- [ ] 마이그레이션 적용 후 회귀 테스트 (student 도메인 전체 통과)

### 선택 (Should)

- [ ] 마이그레이션 결과(패딩 적용 row 수, 이상치 샘플)를 `docs/business/HISTORY.md`에 기록
- [ ] Excel Import 클라이언트 정규화(`excel-import.ts:152-157`의 `padStart(11, '0')`) 재검토 — 사용자 원본 입력 보존 vs 자동 패딩 트레이드오프
- [ ] `formatContact` JSDoc 갱신 — "원본 입력 보존 가정" 명시

### 제외 (Out)

- contact 검증 정규식 강화 (국제 표준)
- 표시 포매팅 정책 변경
- 다른 도메인 BigInt 필드 정리

## 제약/가정/리스크/의존성

- **제약**:
    - 운영 DB는 단일 인스턴스 + 단일 라이터 (Lightsail). 마이그레이션 중 짧은 락 허용 (출석 입력 트래픽 적은 시간대 권장)
    - `student.contact` row 수: 활성 2,684명 + 비활성 포함 ~3,000건 추정. `student_snapshot` 더 적음 (졸업 처리 시점 기록만)
    - Prisma 스키마 변경 시 마이그레이션은 `/prisma-migrate` 스킬을 통한 수동 SQL 작성 (자동 마이그레이션 차단 정책)
    - `VARCHAR(20)`은 `parentContact` 정책과 동일 — 충분히 여유 (E.164 최대 15자 + 포맷 문자)
- **가정**:
    - 운영 DB의 `student.contact`는 대부분 11자리 휴대폰 (`010-XXXX-XXXX`). 일반 전화/해외번호 비율 낮음 — 사전 점검으로 확정
    - 정규 입력 경로(Zod 스키마)는 이미 `z.string().regex(/^\d+$/).max(15)` — 디지트만 저장됨. 따라서 BigInt → String 변환 시 정보 손실은 **선행 0 한 자리만** (11자리 휴대폰 가정)
    - `StudentSnapshot.contact`는 졸업 처리 시점 스냅샷 — 마이그레이션 정책 동일 적용 (`Student.contact`와 일치)
    - 클라이언트는 이미 String 처리 — 백엔드 응답 변경 시 client breaking 없음
- **리스크**:
    - **본래 10자리였던 정상 입력 케이스 오인식**: `1012345678`이 본래 정상 입력이었다면 `01012345678`로 패딩되어 의미 변경. 사전 점검에서 10자리 분포 확인 + 이상 샘플 검토로 완화. 발견 시 정책 분기 또는 수동 조정
    - **트랜잭션 중 락 시간**: ~3,000건 ALTER TABLE은 MySQL 8.x online DDL 지원 (INSTANT 또는 INPLACE). 영향 미미 예상. 임시 컬럼 경유 시 약간 더 길어질 수 있음
    - **동시 입력 race**: 마이그레이션 중 `student.create`/`update` 트랜잭션이 contact를 BigInt로 저장 시도 → 스키마 mismatch. 마이그레이션 적용은 짧은 maintenance window 또는 트래픽 적은 시간대 권장
    - **롤백 복잡성**: String → BigInt 역변환 시 선행 0 손실 비가역. 롤백 계획에 데이터 백업 + 무롤백 전제 명시
- **내부 의존성**:
    - `apps/api/prisma/schema.prisma`
    - `apps/api/src/domains/student/application/*.usecase.ts` (9개)
    - `apps/api/src/domains/snapshot/snapshot.helper.ts`
    - `packages/utils/src/format.ts` (`formatContact`)
    - `apps/api/test/integration/student.test.ts`
    - `apps/api/prisma/seed.ts` (BigInt 리터럴 사용 시 변경)
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: 단일 PR
    1. 사전 점검 SQL 실행 → 분포 보고서 생성 (Should 산출물)
    2. 점검 결과 기반 패딩 정책 최종 확정
    3. 스테이징/로컬 DB에서 마이그레이션 dry run + 통합 테스트
    4. 운영 적용 — 트래픽 적은 시간대 (평일 야간) 권장. RDS 스냅샷 또는 `mysqldump student, student_snapshot` 백업 선행
    5. 마이그레이션 후 즉시 회귀 테스트 + 1주 운영 모니터링
- **이벤트**: GA4 이벤트 없음 (사용자 가시 변경 없음)
- **데이터 안전 장치**:
    - 마이그레이션 직전 RDS 스냅샷 또는 `mysqldump`
    - `student_archive_YYYYMMDD` 테이블에 변환 전 row 백업 (Should)
    - 무롤백 전제 — 롤백 시 String → BigInt 역변환 정보 손실 회복 불가
- **검증**:
    - 통합 테스트 `pnpm test --filter @school/api` 통과
    - 타입체크 `pnpm typecheck` 통과 (snapshot.helper 인터페이스 변경 영향 확인)
    - 운영 DB 적용 후 contact 분포 재점검 — 패딩 적용 건수 확인

## 오픈 이슈

- [ ] **사전 점검 SQL 결과**: `student.contact` 길이 분포 + 이상치 샘플 — FD 작성 전 실행
- [ ] **10자리 분포 결과에 따른 패딩 정책 최종 확정**: 99%+ 휴대폰이면 일괄 패딩, 다양하면 분기 또는 수동 처리
- [ ] **`formatContact` API 변경 범위**: `padStart(11, '0')` 제거가 비휴대폰 케이스 표시에 영향 미치는지 — 사전 점검 결과 후 결정
- [ ] **Excel Import 클라이언트 정규화 유지 여부**: 마이그레이션 후 사용자 원본 입력 보존이 일관 정책이라면 클라이언트 `padStart` 제거 검토 (Should)
- [ ] **마이그레이션 방식**: 단일 SQL `MODIFY COLUMN` + `UPDATE` vs 임시 컬럼 경유 + `RENAME` — 점검 후 안전한 방식 선택

## 연결 문서

- 사업 문서: `docs/specs/README.md` (TARGET BUGFIX P3)
- 관련 PRD:
    - `docs/specs/prd/student-extra-fields.md` (parentContact 도입 — 후속 과제로 명시)
    - `docs/specs/prd/input-validation-hardening.md` (contact 검증 정규식)
    - `docs/specs/prd/attendance-uniq-migration.md` (마이그레이션 SQL 패턴 참조)
- 기능 설계: `docs/specs/functional-design/student-contact-string-migration.md` (작성 예정 — 2단계)
- 도메인 메인 FD: `docs/specs/functional-design/student-management.md` (병합 대상)
