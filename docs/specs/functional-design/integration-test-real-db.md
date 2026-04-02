# 통합테스트 실제 DB 전환

> 비기능 요구사항 (DX/TEST)

## 배경

현재 `test/integration/` 14개 테스트 파일이 모두 PrismaClient를 mock하여 실행. 실제 DB 쿼리가 나가지 않아 쿼리 정합성, 트랜잭션 동작, Kysely 복합 쿼리를 검증하지 못함. Prisma 공식 가이드에 따라 Docker 기반 실제 DB 통합테스트로 전환.

## 요구사항

### Must

- Docker MySQL 컨테이너로 테스트 전용 DB 실행
- 모든 integration 테스트에서 mock 제거, 실제 DB 쿼리 실행
- `churn-detection`, `org-daily-report` UseCase 테스트를 integration으로 이동
- DB lifecycle: beforeAll(schema + seed) → afterEach(truncate) → afterAll(disconnect)
- 로컬: `docker-compose.test.yml` / CI: GitHub Actions `services:`
- `prisma db push`로 테스트 DB에 스키마 자동 적용

### Out

- 순수 로직 unit 테스트 변경 (adjust-for-saturday, example)
- 프로덕션 DB/인프라 변경
- 테스트 커버리지 확대 (기존 테스트의 DB 전환만 수행)

## 기술 설계

### 인프라 구성

```
docker-compose.test.yml     # 로컬 테스트 DB (MySQL 8, 포트 3307, tmpfs)
.github/workflows/ci.yml    # CI services: mysql (포트 3306)
.env.test                   # 테스트 DB 연결 정보
```

### Vitest 설정 분리

| 프로젝트 | setup 파일 | mock | DB |
|----------|-----------|------|----|
| unit | vitest.setup.ts (축소) | 유지 (순수 로직만) | 없음 |
| integration | vitest.integration-setup.ts (신규) | 없음 | 실제 MySQL |

### vitest.integration-setup.ts 흐름

1. `.env.test` 로드 → 실제 DB 연결 정보
2. `prisma db push --skip-generate` → 스키마 적용
3. PrismaClient 생성 + Kysely 확장 (프로덕션 동일 구성)
4. 테스트 헬퍼 export: `testDb`, `truncateAll()`, `seedTestData()`

### DB Lifecycle

```
beforeAll (suite)
  └─ seed: 기본 Parish → Church → Organization → Account 생성

afterEach (test)
  └─ truncate: 모든 테이블 TRUNCATE (FK 비활성화 → 실행 → 재활성화)

afterAll (suite)
  └─ disconnect: PrismaClient.$disconnect()
```

### Truncate 전략

```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE attendance;
TRUNCATE TABLE student_group;
-- ... 모든 테이블
SET FOREIGN_KEY_CHECKS = 1;
```

### Docker 구성

| 항목 | 로컬 | CI |
|------|------|-----|
| 이미지 | mysql:8.0 | mysql:8.0 |
| 포트 | 3307:3306 | 3306:3306 |
| DB명 | school_test | school_test |
| 스토리지 | tmpfs (메모리) | tmpfs |
| 문자셋 | utf8mb4_unicode_ci | utf8mb4_unicode_ci |

### 테스트 헬퍼 변경

| 파일 | 변경 |
|------|------|
| `test/helpers/trpc-caller.ts` | 유지 (tRPC caller 구조 동일) |
| `test/helpers/mock-data.ts` | → `test/helpers/seed-data.ts`로 리팩토링. mock 팩토리 → 실제 DB insert 헬퍼 |
| `vitest.setup.ts` | unit 전용으로 축소 (순수 로직 mock만) |
| `vitest.integration-setup.ts` | 신규. 실제 DB 연결 + lifecycle 헬퍼 |

### 전환 대상

| 분류 | 파일 | 비고 |
|------|------|------|
| integration (기존) | auth, student, group, attendance, organization, account, account-self-management, admin-transfer, refresh-token, snapshot, idor, church, statistics | mock → 실제 DB |
| unit → integration | churn-detection, org-daily-report | Kysely 쿼리 검증 필요 |
| unit (유지) | adjust-for-saturday, example | 순수 로직 |

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| Docker 미설치 (로컬) | 에러 메시지로 안내, unit 테스트는 독립 실행 가능 |
| DB 연결 실패 | beforeAll에서 fail-fast, 명확한 에러 출력 |
| 테이블 truncate 순서 | FK_CHECKS=0으로 순서 무관하게 처리 |
| BigInt ID 자동증가 | truncate 시 auto_increment 리셋됨. seed에서 명시적 ID 사용 |

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: Docker DB 기동 → prisma db push → 전체 integration 테스트 통과
2. **TC-2**: afterEach truncate 후 다음 테스트에 이전 데이터 잔류 없음

### 예외 케이스

1. **TC-E1**: DB 미기동 시 beforeAll에서 명확한 에러 메시지와 함께 즉시 실패
