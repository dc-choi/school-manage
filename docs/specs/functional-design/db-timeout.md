# 기능 설계: DB 트랜잭션/쿼리 타임아웃 명시화 (Reliability)

> 상태: Draft | 작성일: 2026-04-24 | 분류: Non-Functional (Performance, P3)

## 연결 문서

- 코드: `apps/api/src/infrastructure/database/database.ts:42-65`
- 환경설정: `apps/api/src/global/config/env.ts:38-48`
- TARGET 등록: `docs/specs/README.md` PERFORMANCE 표 P3
- 관련 기능 설계: `db-connection-limit.md` (같은 접근 패턴 — env 기반 명시화)
- 참조: [Prisma Docs — Connection Pool](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool#mysql-or-mariadb-using-the-mariadb-driver), [Prisma Docs — Interactive Transactions](https://www.prisma.io/docs/orm/prisma-client/queries/transactions#interactive-transactions)

## 배경

현재 DB 타임아웃은 `@prisma/adapter-mariadb@6.19.2`(내부 `mariadb@3.4.5`) 및 Prisma v6 쿼리 엔진의 **암묵적 기본값**에 의존한다.

| 계층 | 항목 | 실제 기본값 | 코드 설정 | 출처 |
|------|------|------------|---------|------|
| 어댑터 | connectTimeout | **1000ms** | 없음 (암묵) | `mariadb/lib/config/connection-options.js:93` |
| 어댑터 | idleTimeout | **1800s** | 없음 (암묵) | `mariadb/lib/config/pool-options.js:30` |
| 어댑터 | acquireTimeout | 10000ms | 없음 (암묵) | 동일 |
| Prisma | `$transaction` timeout | 5000ms | 없음 (암묵) | Prisma v6 `TransactionOptions` |
| Prisma | `$transaction` maxWait | 2000ms | 없음 (암묵) | Prisma v6 `TransactionOptions` |

암묵 기본값의 리스크:
1. **어댑터/쿼리엔진 버전 업그레이드 시 값이 변경되면 동작이 소리 없이 바뀐다** (예: v6→v7 이관 시 기본값 재조정 가능성).
2. `connectTimeout` 1s는 순간적 네트워크 지연에도 부팅 실패를 유발할 수 있다 (Prisma v6 쿼리엔진 `connect_timeout`은 5s였음 — 어댑터 전환 후 값이 1s로 줄었다).
3. `idleTimeout` 1800s(30분)는 장기 유휴 커넥션이 풀에 점유되어 피크 시 재사용 지연 (Prisma v6 쿼리엔진 `max_idle_connection_lifetime`은 300s였음).
4. `$transaction` timeout 5s는 대량 반복 처리(출석 최대 500건, 학생 진급, 합류 승인 등)에서 여유가 부족하며, 타임아웃 발생 시 **락 점유 + 롤백 폭풍**을 유발할 수 있다.

이번 작업의 목표는 성능 개선이 아니라 **타임아웃 명시화 + 구성 가능성 확보**이다. 현재 동작을 유지하되 합리적 기본값으로 고정하고 필요 시 환경변수로 튜닝한다.

## 목표 / 비목표

| 구분 | 항목 |
|------|------|
| **목표** | (1) 4종 DB 타임아웃을 env로 명시. (2) 어댑터/쿼리엔진 버전 업그레이드 무영향 보장. (3) 운영 비상 튜닝 시 재배포 없이 조정. (4) 기본값은 운영 안정성 기준으로 일부 보정. |
| **비목표** | 개별 쿼리 단위 타임아웃 (Prisma 미지원). 트랜잭션별 개별 override (향후 필요 시). 성능 개선 자체. |

## 변경 대상 / 비대상

| 대상 | 현재 | 전환 후 |
|------|------|--------|
| `database.ts` 어댑터 옵션 | `connectTimeout`/`idleTimeout` 미지정 | `env.db.connectTimeoutMs`, `env.db.idleTimeoutSec` 참조 |
| `database.ts` PrismaClient 옵션 | `transactionOptions` 없음 | 전역 `transactionOptions: { timeout, maxWait }` 추가 |
| `env.ts` db 섹션 | `queryLogging`만 존재 | 타임아웃 4종 필드 추가 (선택, 기본값 있음) |
| `.env.example`, `.env.test.example` | 키 없음 | 4개 키 주석으로 안내 |
| 운영 환경 변수 | 미설정 | 미설정 유지 → 명시 기본값 적용 |

> `acquireTimeout`은 어댑터 기본값 10s 그대로 유지 (코드 수정 없음). 이번 범위 외.
> `MYSQL_CONNECTION_LIMIT`는 기존대로 유지 (별도 항목).

## 동작 명세

### 환경변수 계약

| 키 | 타입 | 필수 | 기본값 | 검증 범위 | 현재 기본값과 차이 |
|---|------|----|------|---------|--------------------|
| `DB_CONNECT_TIMEOUT_MS` | 정수 문자열 | 선택 | `5000` | `500 ≤ n ≤ 30000` | 현재 1000 → **5000** (Prisma v6 쿼리엔진 `connect_timeout`과 동등, 네트워크 지연 내성 ↑) |
| `DB_IDLE_TIMEOUT_SEC` | 정수 문자열 | 선택 | `300` | `60 ≤ n ≤ 3600` | 현재 1800 → **300** (Prisma v6 쿼리엔진 `max_idle_connection_lifetime`과 동등, 유휴 커넥션 조기 반환) |
| `DB_TRANSACTION_TIMEOUT_MS` | 정수 문자열 | 선택 | `15000` | `1000 ≤ n ≤ 60000` | 현재 5000 → **15000** (벌크 출석/진급/합류 여유) |
| `DB_TRANSACTION_MAX_WAIT_MS` | 정수 문자열 | 선택 | `5000` | `500 ≤ n ≤ 30000` | 현재 2000 → **5000** (풀 경합 내성 ↑) |

- **미설정**: 표의 기본값 적용. 부팅 로그에는 기본값 노출 불필요 (일반 기동).
- **설정 + 정상**: 해당 값 적용.
- **설정 + 비정상** (NaN, 범위 외): 부팅 시 throw (`getOsEnvIntOptional`가 처리 — 기존 패턴 재사용).

### 적용 위치

```
database.ts
├── PrismaMariaDb({ ..., connectTimeout, idleTimeout })   // env 참조
└── new PrismaClient({ adapter, log, transactionOptions: { timeout, maxWait } })   // env 참조
```

- `adapter` 생성 시 `connectTimeout`/`idleTimeout` 추가.
- `PrismaClient` 생성 시 `transactionOptions` 추가.
- 기존 슬로우 쿼리 로깅·Kysely 확장·`connectDatabase()`·`connectionLimit` 모두 무변경.

### `.env.example` 안내 주석

```
# DB 연결 타임아웃 (ms, 선택, default 5000 — mariadb 어댑터 기본 1000 보정)
# DB_CONNECT_TIMEOUT_MS=5000

# DB 유휴 커넥션 타임아웃 (초, 선택, default 300 — mariadb 어댑터 기본 1800 단축)
# DB_IDLE_TIMEOUT_SEC=300

# 트랜잭션 최대 실행 시간 (ms, 선택, default 15000 — Prisma 기본 5000 상향, 벌크 여유)
# DB_TRANSACTION_TIMEOUT_MS=15000

# 트랜잭션 풀 대기 시간 (ms, 선택, default 5000 — Prisma 기본 2000 상향)
# DB_TRANSACTION_MAX_WAIT_MS=5000
```

테스트 환경(`.env.test.example`)에는 짧은 값(예: 트랜잭션 5000ms) 권장 주석.

## 데이터/도메인 변경

없음.

## API/인터페이스

없음 (내부 설정만 변경).

## 성능/제약

| 항목 | 현재 (암묵) | 목표 (명시) |
|------|------------|-----------|
| 연결 실패 허용 시간 | 1s (네트워크 블립에 취약) | 5s |
| 유휴 커넥션 반환 | 30분 | 5분 |
| 트랜잭션 상한 | 5s (벌크 타임아웃 우려) | 15s |
| 트랜잭션 풀 대기 | 2s | 5s |
| 재배포 없는 튜닝 | 불가 | 가능 |

> 운영 영향: 현재 동작의 체감 변경은 없음. 엣지 케이스(네트워크 블립, 벌크 피크)에서 안정성만 향상.
> 벌크 작업은 여전히 트랜잭션 단위로 제한된다 (무한 점유 불가능).

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| env 4종 미설정 | 위 기본값 적용 → 부팅 정상 |
| 비정수 또는 범위 외 | 기존 `getOsEnvIntOptional` 검증 실패 → 부팅 throw |
| 트랜잭션 15s 초과 | Prisma가 자동 롤백 + `P2028` 에러 전파 (기존 동작) |
| 풀 대기 5s 초과 | Prisma가 `P2024` 에러 전파 (기존 동작) |
| TCP 연결 5s 초과 | 어댑터 연결 에러 → `connectDatabase()` throw (기존 동작) |
| 트랜잭션 중 개별 쿼리가 타임아웃 초과 시도 | 트랜잭션 전체가 롤백 — 쿼리 단위 타임아웃 부재는 수용 (본 범위 외) |

## 테스트 시나리오

### 정상 케이스

- **TC-1**: env 4종 미설정 시 기본값(5000/300/15000/5000) 적용 — 기존 통합 테스트 전체 통과 (회귀 게이트).
- **TC-2**: env 파싱 단위 테스트 — 정상 값이 `number`로 변환.
- **TC-3**: `$transaction`이 `transactionOptions` 기본값을 수용 — 벌크 출석 500건 통합 테스트가 15s 이내 완료.

### 예외 케이스

- **TC-E1**: `DB_TRANSACTION_TIMEOUT_MS=abc` → 부팅 throw.
- **TC-E2**: `DB_CONNECT_TIMEOUT_MS=100` (범위 외) → 부팅 throw.
- **TC-E3**: `DB_IDLE_TIMEOUT_SEC=5000` (범위 외) → 부팅 throw.

## 자기 검증 체크리스트

- [x] 동작 명세 수준 (구현 상세 위임)
- [x] 목표를 "성능 개선"이 아닌 "타임아웃 명시화 + 구성 가능성"으로 한정
- [x] 실제 기본값(mariadb@3.x + Prisma v6)과의 차이 및 보정/단축/상향 이유 명시
- [x] 환경변수는 모두 **선택**, 기본값 있음 — 운영 무설정에서 동작 보존
- [x] 검증은 기존 `getOsEnvIntOptional` 재사용 (중복 구현 회피)
- [x] 변경 대상/비대상 표로 명확화
- [x] 비기능 워크플로우(Task/Dev 생략) 고려해 짧게 유지 (190줄 이내)
- [x] 회귀 게이트(통합 테스트 전체 통과) 명시
