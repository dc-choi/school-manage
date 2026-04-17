# 기능 설계: DB connectionLimit 환경변수화 (Configurability)

> 상태: Draft | 작성일: 2026-04-17 | 분류: Non-Functional (Performance, P2)

## 연결 문서

- 코드: `apps/api/src/infrastructure/database/database.ts:41`
- 환경설정: `apps/api/src/global/config/env.ts`
- TARGET 등록: `docs/specs/README.md` PERFORMANCE 표 P2
- 참조: [Prisma Docs — Connection Pool](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections/connection-pool#mysql-or-mariadb-using-the-mariadb-driver)

## 배경

`PrismaMariaDb` 어댑터의 `connectionLimit: 10`이 코드에 하드코딩되어 있다. 이 값 자체는 **Prisma v7 공식 default와 일치**(v7부터 모든 드라이버 어댑터가 10으로 통일)이므로 잘못된 값은 아니다. 다만 코드 수정 없이는 환경별 조정·운영 튜닝이 불가능한 **구성 부채**이다.

이번 작업의 목표는 성능 개선이 아니라 **구성 가능성 확보**이다. Default는 Prisma v7 기준 그대로 두고, 필요 시 환경변수로 override 가능하게 한다.

## 목표 / 비목표

| 구분 | 항목 |
|------|------|
| **목표** | (1) 매직 넘버 제거 → env 참조. (2) 테스트 환경에서 작은 값 적용 가능. (3) 운영 비상 튜닝 시 재배포 없이 환경변수만으로 조정 가능. |
| **비목표** | 성능 개선·풀 고갈 해결. (필요성은 옵션 C 모니터링으로 별도 확인) |

## 변경 대상 / 비대상

| 대상 | 현재 | 전환 후 |
|------|------|--------|
| `database.ts` connection pool 크기 | `10` 하드코딩 | `env.mysql.connectionLimit` 참조 |
| `env.ts` mysql 섹션 | `connectionLimit` 없음 | `connectionLimit: number` 추가 (선택, default 10) |
| `.env.example`, `.env.test.example` | 키 없음 | `MYSQL_CONNECTION_LIMIT` 안내 추가 |
| 운영 환경(.env.local/.env.test/.env) | 미설정 | 미설정 유지 → default 10 적용 (현재 동작 보존) |

> Prisma 자체 connection pool, 트랜잭션 타임아웃, 쿼리 타임아웃 등은 변경 없음 (별도 P3 항목).

## 동작 명세

### 환경변수 계약

| 키 | 타입 | 필수 | 기본값 | 검증 |
|---|------|----|------|------|
| `MYSQL_CONNECTION_LIMIT` | 정수 문자열 | **선택** | `10` (Prisma v7 기준) | 설정 시 `1 ≤ n ≤ 100` |

- **미설정**: default 10 적용 (현재 동작과 100% 동일).
- **설정 + 정상**: 해당 값 적용.
- **설정 + 비정상** (NaN, 범위 외): 부팅 시 throw (Fail-fast로 잘못된 운영 설정 차단).

### 적용 위치

`database.ts`의 `PrismaMariaDb({ ..., connectionLimit })`만 `env.mysql.connectionLimit`로 교체. 기존 슬로우 쿼리 로깅·Kysely 확장·`connectDatabase()` 모두 무변경.

### `.env.example` 안내 주석

```
# DB 커넥션 풀 크기 (선택, default 10 — Prisma v7 표준)
# MYSQL_CONNECTION_LIMIT=10
```

테스트 환경(`.env.test.example`)에는 `5` 권장 주석.

## 데이터/도메인 변경

없음.

## API/인터페이스

없음.

## 성능/제약

| 항목 | 현재 | 목표 |
|------|------|------|
| connection pool default | 10 (하드코딩) | 10 (env 참조) — **동작 동일** |
| 운영 튜닝 | 코드 수정+재배포 필요 | 환경변수만 변경 |
| 테스트 풀 크기 | 10 (불필요하게 큼) | 5 권장 (오버헤드 감소) |

> 이번 PR로 **프로덕션 동작은 변하지 않음**. 풀 크기 변경은 운영자가 모니터링 후 별도 결정.

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| `MYSQL_CONNECTION_LIMIT` 미설정 | default 10 → 부팅 정상 (회귀 없음) |
| 비정수 값 (`"abc"`) | parseInt → NaN 검증 → throw |
| 범위 외 (`0`, `-1`, `200`) | 검증 실패 → throw (운영 실수 차단) |
| 풀 고갈 런타임 | adapter 자체 에러 (이번 범위 외) |

## 테스트 시나리오

### 정상 케이스

- **TC-1**: `MYSQL_CONNECTION_LIMIT` 미설정 시 default 10 적용 — 기존 통합 테스트 전체 통과 (회귀 게이트).
- **TC-2**: env 파싱 단위 테스트 — 정상 정수 문자열이 `number`로 변환됨.
- **TC-3**: env 미설정 시 default 10 반환 단위 테스트.

### 예외 케이스

- **TC-E1**: `MYSQL_CONNECTION_LIMIT=abc` 시 부팅 throw.
- **TC-E2**: `MYSQL_CONNECTION_LIMIT=0` 또는 `=200` 시 부팅 throw.

## 자기 검증 체크리스트

- [x] 동작 명세 수준 (구현 상세 위임)
- [x] **목표를 "성능 개선"이 아닌 "구성 가능성 확보"로 명시** — Prisma v7 default 일치 사실 반영
- [x] Default 10 유지 → 현재 동작 보존, 회귀 위험 0
- [x] 환경변수는 **선택**(default 있음) — Fail-fast는 "설정했는데 잘못된 값"일 때만
- [x] 변경 대상/비대상 표로 명확화
- [x] 비기능 워크플로우(Task/Dev 생략) 고려해 짧게 유지 (190줄 이내)
- [x] 회귀 게이트(통합 테스트 전체 통과) 명시
