---
paths:
  - "packages/trpc/**"
---

# tRPC Package Rules (@school/trpc)

tRPC 인프라(router, procedures, middleware, context) 전용 패키지입니다.

## 개요

`@school/trpc`는 tRPC 서버 인프라만 포함합니다.
도메인 상수, Zod 스키마, Input/Output 타입은 `@school/shared`에 위치합니다.

## Directory Structure

```
packages/trpc/src/
├── index.ts            # 메인 export (public API)
├── trpc.ts             # tRPC 인스턴스 (router, procedure, middleware)
└── context.ts          # tRPC 컨텍스트 타입 (Express 바인딩)
```

> **Note**: 도메인별 라우터는 `@school/api`의 `src/domains/{domain}/presentation/`에 정의됩니다.
> Zod 스키마와 도메인 타입은 `@school/shared`에 위치합니다.

## Commands

```bash
pnpm build              # TypeScript 빌드 (tsc -b)
pnpm dev                # 빌드 감시 (tsc --watch)
pnpm typecheck          # 타입 체크
```

## Exports

```typescript
// Context 타입 (Express 바인딩)
export type { Context, AuthContext, ScopedContext, BaseContext } from './context';

// tRPC 유틸리티
export { router, publicProcedure, protectedProcedure, consentedProcedure, scopedProcedure } from './trpc';
export { middleware, transformer, createCallerFactory } from './trpc';
```

## Context 타입

도메인 인증 상태(`AccountInfo` 등)는 `@school/shared`에서 가져오고,
Express `req/res`와 합성하여 tRPC 컨텍스트를 구성합니다.

```typescript
interface BaseContext { req: Request; res: Response; }

interface Context extends BaseContext {
    account?: AccountInfo;      // from @school/shared
    privacyAgreedAt?: Date | null;
    organization?: OrganizationInfo;
    church?: ChurchInfo;
}

interface AuthContext extends BaseContext { account: AccountInfo; ... }
interface ScopedContext extends BaseContext { ... organization: OrganizationInfo; church: ChurchInfo; }
```

## Procedure 종류

| Procedure | 용도 | 인증 | 동의 | 조직 |
|-----------|------|------|------|------|
| `publicProcedure` | 공개 API (로그인 등) | 불필요 | 불필요 | 불필요 |
| `protectedProcedure` | 인증만 필요 | 필요 | 불필요 | 불필요 |
| `consentedProcedure` | 인증 + 동의 | 필요 | 필요 | 불필요 |
| `scopedProcedure` | 조직 스코프 | 필요 | 필요 | 필요 |

## 라우터 작성 패턴

```typescript
// apps/api/src/domains/example/presentation/example.router.ts
import { router, scopedProcedure } from '@school/trpc';
import { createExampleInputSchema } from '@school/shared';

export const exampleRouter = router({
    create: scopedProcedure
        .input(createExampleInputSchema)
        .mutation(async ({ input, ctx }) => { ... }),
});
```

## Transformer (superjson)

Date, BigInt 등 비-JSON 타입 자동 직렬화. 서버/클라이언트 동일 transformer 사용 필수.

## 주의사항

- 이 패키지는 **tRPC 인프라만** 포함 (도메인 로직/타입 금지)
- 도메인 상수/스키마/타입 → `@school/shared`
- 비즈니스 로직 → `@school/api`
- 변경 시 `pnpm build` 후 의존 패키지 재빌드 필요
