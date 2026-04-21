# PRD: Account.name DB 유니크 제약 추가

> 상태: Draft | 작성일: 2026-04-21

## 배경/문제 요약

- 참고: `docs/specs/README.md` TARGET BUGFIX P1 "Account.name DB 유니크 제약 미비"
- **문제**: `account.name` 컬럼에 DB 레벨 UNIQUE 제약이 없고, 회원가입 시 애플리케이션 레벨의 `findFirst` → `insert` 체크만 존재한다. 두 트랜잭션이 동시에 동일 ID로 가입을 시도하면 race condition으로 중복 계정이 생성될 수 있다.
- **현재 상태**:
    - 스키마: `apps/api/prisma/schema.prisma:128` — `name String @db.VarChar(20)` (UNIQUE 없음, 인덱스 없음)
    - 회원가입 체크: `apps/api/src/domains/auth/application/signup.usecase.ts:24-41` — `findFirst({ name, deletedAt: null })` + `toLowerCase()` 정규화 후 CONFLICT throw
    - 중복 확인 API: `apps/api/src/domains/auth/application/check-id.usecase.ts:10-25`
    - **복구 플로우 존재**: `restore-account.usecase.ts:62-65` — 탈퇴 계정의 `deletedAt: null`로 복원. 2년 이내 가능 (`login.usecase.ts:43-55`에서 복구 유도)
    - 계정 이름 변경(rename) 경로 없음 (`update-profile.usecase.ts`는 `displayName`만 수정)
- **목표 상태**: `account.name` 전체(활성·탈퇴 포함)가 DB 레벨에서 유일성 보장. 탈퇴 name은 복구를 위해 예약된 상태로 유지. 기존 앱 레벨 체크는 UX 친화적 에러 메시지용으로 유지한다.

## 목표/성공 기준

- **목표**: `account.name`을 DB 레벨 UNIQUE로 설정하여 race condition과 복구 충돌을 모두 차단
- **성공 지표**:
    1. 동일 name으로 동시 signup 2건 → 정확히 1건 성공, 1건 CONFLICT (통합 테스트)
    2. 탈퇴 계정과 동일 name으로 signup 시도 → CONFLICT (복구 유도 유지, 기존 login 동작과 일관)
    3. 기존 `account` 테이블 전체(활성+탈퇴)에 대해 대소문자 무시 중복 0건
- **측정 기간**: 배포 후 즉시 검증

## 사용자/대상

- **주요 사용자**: 신규 가입 시도자 (교리교사·사제), 복구 시도자
- **사용 맥락**: 회원가입 페이지에서 ID 입력 → 중복 확인 → 제출. 동시 요청은 클라이언트 이중 클릭·여러 탭·자동화에서 발생 가능. 복구는 2년 이내 탈퇴 계정이 재로그인할 때 수행

## 범위

### 포함

- `account.name`에 `@unique` 추가 (schema.prisma + 표준 UNIQUE 마이그레이션)
- 선행 작업: 운영 DB의 전체 계정(활성+탈퇴) 중복 점검 → 중복 발견 시 cleanup
- `signup.usecase.ts`에 Prisma `P2002` 예외 감지 → 기존과 동일한 `CONFLICT: '이미 사용 중인 아이디입니다.'` 응답 (방어 레이어)
- 동시성 통합 테스트 1건 추가

### 제외

- **탈퇴 후 동일 name 재가입 허용**: 복구 플로우와 충돌하므로 불가 (탈퇴 name은 복구를 위해 예약 유지)
- 2년 경과 탈퇴 계정의 name 해제·hard-delete — 별도 운영 작업 (오픈 이슈)
- 대소문자 구분 정책 변경 — 앱 레벨 `toLowerCase()` 그대로 유지
- `check-id.usecase.ts` 로직 변경 — 기존대로 활성 계정 기준 가용성 판별
- `displayName` 유니크 제약 (표시명은 중복 허용 유지)
- `restore-account.usecase.ts` 로직 변경 (복구 시 기존 name은 이미 예약된 상태이므로 충돌 없음)
- Account 이름 변경(rename) 기능 도입

## 사용자 시나리오

1. **정상 가입**: 새 ID로 가입 → 앱 체크 통과 → DB insert 성공
2. **중복 가입 (순차, 활성 계정)**: 활성 계정과 동일 ID로 가입 → 앱 레벨 `findFirst`에서 감지 → `CONFLICT: '이미 사용 중인 아이디입니다.'`
3. **중복 가입 (순차, 탈퇴 계정)**: 탈퇴 계정과 동일 ID로 가입 → 앱 레벨 `findFirst({deletedAt: null})`는 미발견이지만 DB UNIQUE 위반 → Prisma `P2002` 캐치 → 동일 `CONFLICT` 응답. (기존 login의 `ACCOUNT_DELETED` 복구 유도는 signup 경로와 별개)
4. **중복 가입 (동시)**: 두 요청이 앱 체크를 동시에 통과 → DB insert 시 UNIQUE 위반 → `P2002` → 동일 `CONFLICT` 응답
5. **대소문자 다른 시도**: 기존 `alice` 존재 → `Alice` 가입 시도 → 앱 `toLowerCase()` 정규화 후 `findFirst`에서 감지 → CONFLICT
6. **복구**: 2년 이내 탈퇴 계정이 login → `ACCOUNT_DELETED` FORBIDDEN → `restoreAccount` 호출 → `deletedAt: null` 업데이트 성공 (name은 여전히 예약 상태였으므로 UNIQUE 충돌 없음)

## 요구사항

### 필수 (Must)

- [ ] **선행 점검 (마이그레이션 적용 전)**: 운영 DB에 `SELECT LOWER(name) AS lname, COUNT(*) FROM account GROUP BY lname HAVING COUNT(*) > 1` 실행 (전체 계정 대상, 탈퇴 포함) → 중복 0건 확인
- [ ] **중복 발견 시 cleanup 선행**: 활성 계정 우선 유지. 충돌하는 탈퇴 계정은 name에 suffix 부여(예: `<name>__legacy__<id>`) 또는 hard-delete — 운영자 수동 판단 (cleanup 마이그레이션 별도 커밋)
- [ ] `schema.prisma`의 `Account.name`에 `@unique` 추가
- [ ] 마이그레이션 SQL: `ALTER TABLE account ADD UNIQUE KEY account_name_unique (name)`
- [ ] `signup.usecase.ts`에 Prisma `P2002`(Unique constraint failed) 예외 캐치 후 기존과 동일한 `CONFLICT` TRPCError throw
- [ ] 동시성 통합 테스트: `Promise.all`로 동일 name signup 2건 동시 실행 → 정확히 1건 성공, 1건 CONFLICT
- [ ] 탈퇴 계정과 동일 name 가입 시도 통합 테스트: 기대 결과 CONFLICT
- [ ] 기존 signup·checkId·login·restoreAccount·deleteAccount 통합 테스트 전부 통과

### 선택 (Should)

- [ ] 마이그레이션 적용 결과를 `docs/business/HISTORY.md`에 기록
- [ ] 운영 DB collation이 `utf8mb4_0900_ai_ci`(대소문자 무시)임을 명시적으로 확인

### 제외 (Out)

- 탈퇴 계정 hard-delete 정책 (2년 경과 등)
- signup 경로에서 "복구 가능 계정입니다" 안내 (보안·UX 정책 변경 필요, 별도 PRD)
- 계정 이름 변경 기능
- 대규모 백필이나 정책 재정의

## 제약/가정/리스크/의존성

- **제약**:
    - `name` 컬럼은 `VarChar(20)` `NOT NULL` — UNIQUE 추가에 타입·NULL 제약 영향 없음
    - 마이그레이션은 단일 SQL로 적용 가능 (소규모 데이터)
- **가정**:
    - 현재 운영 DB의 계정 수 259개 규모(STATUS.md 04-20 기준)로 UNIQUE 인덱스 생성 시 락 영향 미미
    - MySQL 기본 collation이 대소문자 무시 비교를 수행 → 대소문자 다른 값도 UNIQUE 위반 처리
    - 탈퇴 계정의 name은 복구를 위해 예약된 상태로 유지되는 것이 운영 정책에 부합
- **리스크**:
    - **기존 중복 데이터(특히 활성+탈퇴 name 중복) 시 마이그레이션 실패**: 사전 SQL 점검 + cleanup 마이그레이션으로 대응. 현재 signup은 `deletedAt: null` 체크만 하므로 탈퇴 계정과 동일 name으로 신규 가입된 케이스가 있을 수 있음 → 점검 우선순위 높음
    - **cleanup 대상 탈퇴 계정의 복구 불가**: 충돌 해결을 위해 탈퇴 계정 name을 suffix 처리하면, 해당 사용자는 기존 name으로 `restoreAccount` 불가. 수용 (현재 피해 범위 확인 필요)
    - **Prisma 에러 코드 안정성**: `P2002`는 Prisma 표준. 테스트로 검증
- **내부 의존성**:
    - `apps/api/prisma/schema.prisma` + 신규 마이그레이션 파일
    - `apps/api/src/domains/auth/application/signup.usecase.ts`
    - `apps/api/test/integration/auth.test.ts`
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: 단일 PR. 운영 DB 중복 점검 SQL → 중복 0건 확인(또는 cleanup 선행) → 머지·배포. 사용자 수 적은 시간대 권장
- **이벤트**: GA4 이벤트 없음
- **검증**:
    - 통합 테스트 `pnpm test` 통과 (동시성·탈퇴중복 테스트 포함)
    - 스테이징: 마이그레이션 적용 → 기존 데이터 영향 없음 확인

## 오픈 이슈

- [ ] **운영 DB 전체 중복 점검**: 활성+탈퇴 계정 간 대소문자 무시 중복 존재 여부 확인 (2단계 착수 전)
- [ ] **충돌하는 탈퇴 계정 발견 시 정책**: suffix 부여 vs hard-delete. 해당 사용자 복구권 상실을 허용하는지 (운영자 판단)
- [ ] **장기 보관 정책**: 2년 경과한 탈퇴 계정의 name을 해제할지 여부 (현재 영구 예약). 별도 운영 작업으로 분리 가능

## 연결 문서

- 사업 문서: `docs/specs/README.md` (TARGET BUGFIX P1)
- 기능 설계: `docs/specs/functional-design/auth-account.md` (구현 완료 후 병합 예정)
