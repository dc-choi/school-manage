---
paths:
  - "apps/api/**"
---

# API Server Rules (@school/api)

Express + tRPC API 서버 개발 가이드입니다.

## Architecture

### Clean Architecture + tRPC

```
tRPC Router (presentation) -> UseCase (application) -> Prisma (DB)
```

| 레이어 | 역할 | 위치 |
|-------|------|------|
| Presentation | tRPC procedure 정의, Zod 입력 검증 | `src/domains/{domain}/presentation/` |
| Application | 비즈니스 로직 (UseCase), Prisma 직접 사용 | `src/domains/{domain}/application/` |

> **Note**: Repository 레이어는 제거됨. UseCase에서 Prisma 직접 사용.

### Procedure 종류

| Procedure | 용도 | 인증 | 동의 | 조직 |
|-----------|------|------|------|------|
| `publicProcedure` | 공개 API (로그인 등) | 불필요 | 불필요 | 불필요 |
| `protectedProcedure` | 인증만 필요 (account.get, account.agreePrivacy) | 필요 | 불필요 | 불필요 |
| `consentedProcedure` | 합류 전 API (parish, church, organization 공개 조회) | 필요 | 필요 | 불필요 |
| `scopedProcedure` | 조직 스코프 API (group, student, attendance 등) | 필요 | 필요 | 필요 |

## Directory Structure

```
apps/api/src/
├── app.ts                          # createApp() + main() 부트스트랩
├── app.router.ts                   # tRPC AppRouter (도메인 라우터 병합)
├── domains/                        # 도메인 레이어
│   ├── auth/
│   │   ├── application/            # UseCase (Prisma 직접 사용)
│   │   ├── presentation/           # tRPC Router
│   │   └── utils/                  # 도메인 전용 유틸
│   └── ...
├── global/                         # 프로젝트 공통
│   ├── config/                     # 환경설정 (env.ts)
│   ├── errors/                     # 에러 코드/클래스
│   ├── middleware/                 # Express 미들웨어
│   └── utils/                      # 공용 유틸리티
└── infrastructure/                 # 외부 연동
    ├── analytics/                  # GA4 Measurement Protocol
    ├── database/                   # Prisma
    ├── logger/                     # 로거
    ├── scheduler/                  # 스케줄러
    └── trpc/                       # tRPC Context
```

## Commands

```bash
pnpm dev                # 개발 서버 (빌드 후 node --watch)
pnpm build              # TypeScript 빌드 (tsc -b)
pnpm start              # 프로덕션 서버
pnpm test               # 테스트 실행 (vitest)
pnpm test:watch         # 테스트 워치 모드
pnpm typecheck          # 타입 체크
```

## Key Patterns

### UseCase 패턴

```typescript
import type { CreateStudentInput, CreateStudentOutput } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

export class CreateStudentUseCase {
    async execute(input: CreateStudentInput): Promise<CreateStudentOutput> {
        const student = await database.student.create({
            data: { societyName: input.societyName, groupId: BigInt(input.groupId) },
        });
        return { id: String(student.id), ...student };
    }
}
```

### tRPC Router 정의

```typescript
import { router, protectedProcedure } from '@school/trpc';
import { createStudentInputSchema } from '@school/shared';

export const studentRouter = router({
    create: protectedProcedure
        .input(createStudentInputSchema)
        .mutation(async ({ input, ctx }) => {
            const usecase = new CreateStudentUseCase();
            return usecase.execute(input);
        }),
});
```

### 소유권 검증 (IDOR 방지)

scopedProcedure에서 리소스 접근 시 반드시 organizationId를 검증한다.

```typescript
import { assertGroupIdsOwnership } from '~/global/utils/ownership.js';

// 복수 그룹/학생 ID 검증
await assertGroupIdsOwnership(input.groupIds, organizationId);
await assertStudentIdsOwnership(input.studentIds, organizationId);

// 단일 리소스: where절에 organizationId 직접 포함
const student = await database.student.findFirst({
    where: { id: BigInt(input.id), organizationId: BigInt(organizationId) },
});
```

### 에러 처리

```typescript
import { TRPCError } from '@trpc/server';

throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'NOT_FOUND: STUDENT NOT_FOUND',
});

// codes: BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_SERVER_ERROR
```

## Path Aliases

- `~/` → `apps/api/src/` (tsconfig.json에 설정됨)

## Rate Limiting

`apps/api/src/app.ts`에 Express `rateLimit` 전역 미들웨어로 적용. 초과 시 HTTP 429.

| 범위 | 제한 |
|------|------|
| 전체 API | IP당 **200회/분** |
| 인증 (`/trpc/auth`) | IP당 **10회/분** |

헤더: `standardHeaders: 'draft-7'` (RFC 9469 draft).

## Database

- **ORM**: Prisma + Driver Adapter (`@prisma/adapter-mariadb`)
- **Query Builder**: Kysely (`prisma-extension-kysely` 확장)
- **스키마**: `apps/api/prisma/schema.prisma`
- **타입**: `src/infrastructure/database/generated/types.ts` (prisma-kysely 자동 생성)
- **DB**: MariaDB/MySQL

복잡한 쿼리(JOIN, GROUP BY, HAVING, 집계)는 `database.$kysely` 사용. CamelCasePlugin으로 코드는 camelCase, **`sql` 템플릿 내부는 반드시 DB snake_case** 사용. `.as('camelName')`도 SQL에서는 `snake_name`으로 변환되므로, ORDER BY 등에서 alias를 참조할 때 `sql`\`snake_name\``으로 작성해야 함. `prisma generate` 시 Kysely 타입 자동 생성 (lint/prettier 제외).

### KST 타임스탬프 정책

Prisma의 `@default(now())`는 UTC만 지원하므로, `getNowKST()`로 직접 입력:

```typescript
import { getNowKST } from '@school/utils';

await database.student.create({
    data: { societyName: input.societyName, createdAt: getNowKST() },
});
```

### Prisma 명령어

`pnpm prisma generate` (클라이언트+Kysely 타입 생성), `pnpm prisma db push`, `pnpm prisma studio`

### DB 환경변수

풀: `MYSQL_CONNECTION_LIMIT` (1~100, default 10). 로깅: `DB_QUERY_LOGGING` (off/slow/all, default slow, 슬로우 쿼리 PII 마스킹). 타임아웃(mariadb 어댑터 기본값 명시 보정): `DB_CONNECT_TIMEOUT_MS` (500~30000, default 5000), `DB_IDLE_TIMEOUT_SEC` (60~3600, default 300), `DB_TRANSACTION_TIMEOUT_MS` (1000~60000, default 15000), `DB_TRANSACTION_MAX_WAIT_MS` (500~30000, default 5000). 상세: `.env.example`

## Testing

- **프레임워크**: Vitest
- **DB**: 실제 MySQL 연결 (mock 없음). `vitest.global-setup.ts`에서 `prisma db push --force-reset`으로 스키마 적용
- **설정**: `vitest.config.ts` (단일 구성, `test/**/*.test.ts`)

| 파일 | 용도 |
|------|------|
| `vitest.global-setup.ts` | 테스트 DB 스키마 초기화 (1회) |
| `vitest.setup.ts` | env 로딩 + mailService mock + 로거 초기화 |
| `test/helpers/db-lifecycle.ts` | `truncateAll()`, `seedBase()` DB 헬퍼 |
| `test/helpers/test-stubs.ts` | Express Request/Response 스텁, mailService mock 참조 |
| `test/helpers/trpc-caller.ts` | tRPC caller 팩토리 |

### 테스트 패턴

```typescript
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createScopedCaller } from '../helpers/trpc-caller.ts';

let seed: SeedBase;
beforeEach(async () => { await truncateAll(); seed = await seedBase(); });
afterAll(async () => { await truncateAll(); });

it('그룹 생성', async () => {
    const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
    const result = await caller.group.create({ name: '1학년' });
    expect(result.name).toBe('1학년');
});
```

## Environment

- `.env.{NODE_ENV}` 파일 사용 (`.env.local`, `.env.test`)
- `.env.example`을 복사하여 환경변수 설정
- 실제 credentials는 절대 커밋하지 않음