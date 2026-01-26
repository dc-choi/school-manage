---
paths:
  - "packages/trpc/**"
---

# tRPC Package Rules (@school/trpc)

tRPC 라우터, Zod 스키마, 공유 타입 정의 가이드입니다.

## 개요

`@school/trpc`는 서버(`@school/api`)와 클라이언트(`@school/web`)가 공유하는 tRPC 타입과 라우터 정의를 포함합니다.

## Directory Structure

```
packages/trpc/src/
├── index.ts            # 메인 export (public API)
├── trpc.ts             # tRPC 인스턴스 (router, procedure)
├── context.ts          # tRPC 컨텍스트 타입
├── types.ts            # 공유 타입
├── shared.ts           # 공유 유틸리티
├── schemas/            # Zod 스키마 + 타입 정의
│   ├── index.ts        # 스키마/타입 export
│   ├── common.ts       # 공통 스키마 (id, page 등)
│   ├── auth.ts         # auth 도메인 (Input + Output)
│   ├── account.ts      # account 도메인 (Output)
│   ├── group.ts        # group 도메인 (Input + Output)
│   ├── student.ts      # student 도메인 (Input + Output)
│   ├── attendance.ts   # attendance 도메인 (Input + Output)
│   └── statistics.ts   # statistics 도메인 (Input + Output)
└── routers/            # tRPC 라우터 정의 (health만)
```

> **Note**: 도메인별 라우터는 `@school/api`의 `src/domains/{domain}/presentation/`에 정의됩니다.

## Commands

```bash
pnpm build              # TypeScript 빌드 (tsc -b)
pnpm dev                # 빌드 감시 (tsc --watch)
pnpm typecheck          # 타입 체크
```

## Exports

```typescript
// Context 타입
export type { Context, AuthContext, BaseContext } from './context';

// 공통 타입
export type { AccountInfo } from './shared';

// tRPC 유틸리티
export { router, publicProcedure, protectedProcedure, middleware, transformer } from './trpc';

// AppRouter
export { appRouter } from './routers';
export type { AppRouter } from './routers';

// Input 스키마 및 타입
export { loginInputSchema, createStudentInputSchema, ... } from './schemas';
export type { LoginInput, CreateStudentInput, ... } from './schemas';

// Output 타입
export type { LoginOutput, StudentBase, StudentWithGroup, GroupOutput, ... } from './schemas';
```

## Context 타입

```typescript
// 기본 컨텍스트
interface BaseContext {
    req: Request;
    res: Response;
}

// 인증된 컨텍스트
interface AuthContext extends BaseContext {
    account: AccountInfo;  // { id: string, name: string }
}

// 통합 컨텍스트
type Context = BaseContext & { account?: AccountInfo };
```

> **Note**: `protectedProcedure`에서는 `ctx.account`가 `AccountInfo` 타입으로 보장됩니다.

## 스키마 타입 구조

### Input 타입
- Zod 스키마로 정의 (`z.object({...})`)
- `z.infer<typeof schema>`로 타입 추출
- tRPC `input()`에서 런타임 검증에 사용

### Output 타입
- 순수 TypeScript `interface`로 정의
- Zod 스키마 없음 (런타임 검증 불필요)
- UseCase 반환 타입으로 사용

### 타입 계층 예시 (Student)

```typescript
// 기본 타입
interface StudentBase { id, societyName, groupId, ... }

// 확장 타입
interface StudentWithGroup extends StudentBase { groupName }

// 응답 타입
interface ListStudentsOutput { page, size, totalPage, students: StudentWithGroup[] }
```

## 라우터 작성 규칙

### 새 라우터 추가

```typescript
// src/routers/example.ts
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const exampleRouter = router({
    getItem: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(({ input, ctx }) => {
            // 로직
        }),
});

// src/routers/index.ts
import { exampleRouter } from './example';

export const appRouter = router({
    example: exampleRouter,
});
```

## Transformer (superjson)

Date, BigInt 등 비-JSON 타입 자동 직렬화를 위해 superjson transformer가 적용되어 있습니다.

```typescript
import superjson from 'superjson';

export const transformer = superjson;

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});
```

> **Note**: 서버/클라이언트가 동일 transformer를 사용해야 합니다.

## 주의사항

- 이 패키지는 **타입과 라우터 정의만** 포함
- 실제 비즈니스 로직은 `@school/api`에 구현
- 변경 시 `pnpm build` 후 의존 패키지 재빌드 필요