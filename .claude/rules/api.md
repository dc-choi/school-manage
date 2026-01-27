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

| Procedure | 용도 | 인증 |
|-----------|------|------|
| `publicProcedure` | 공개 API (로그인 등) | 불필요 |
| `protectedProcedure` | 보호된 API | 필요 |

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
import type { CreateStudentInput, CreateStudentOutput } from '@school/trpc';
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
import { router, protectedProcedure, createStudentInputSchema } from '@school/trpc';

export const studentRouter = router({
    create: protectedProcedure
        .input(createStudentInputSchema)
        .mutation(async ({ input, ctx }) => {
            const usecase = new CreateStudentUseCase();
            return usecase.execute(input);
        }),
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

## Database

- **ORM**: Prisma + Driver Adapter (`@prisma/adapter-mariadb`)
- **스키마**: `apps/api/prisma/schema.prisma`
- **DB**: MariaDB/MySQL

### KST 타임스탬프 정책

Prisma의 `@default(now())`는 UTC만 지원하므로, `getNowKST()`로 직접 입력:

```typescript
import { getNowKST } from '@school/utils';

await database.student.create({
    data: { societyName: input.societyName, createdAt: getNowKST() },
});
```

### Prisma 명령어

```bash
pnpm prisma generate    # 클라이언트 생성
pnpm prisma db push     # 스키마 동기화
pnpm prisma studio      # DB GUI
```

## Testing

- **프레임워크**: Vitest
- **설정**: `vitest.config.ts` (projects 구성)

| 프로젝트 | 위치 | 용도 |
|---------|------|------|
| unit | `test/*.test.ts` | Prisma 모킹, 로직 검증 |
| integration | `test/integration/**/*.test.ts` | tRPC caller, Prisma 모킹 |

### tRPC Caller 테스트

```typescript
import { createPublicCaller, createAuthenticatedCaller } from '../helpers/trpc-caller.js';

const caller = createPublicCaller();
const result = await caller.auth.login({ name: '중고등부', password: '5678' });

const authCaller = createAuthenticatedCaller(accountId, accountName);
const groups = await authCaller.group.list();
```

## Environment

- `.env.{NODE_ENV}` 파일 사용 (`.env.local`, `.env.test`)
- `.env.example`을 복사하여 환경변수 설정
- 실제 credentials는 절대 커밋하지 않음