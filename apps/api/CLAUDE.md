# CLAUDE.md - API Server (@school/api)

> **용도**: Express + tRPC API 서버 개발 가이드
> **언제 읽나**: API 엔드포인트, UseCase, Prisma DB 작업 시
> **스킵 조건**: 웹 프론트엔드, 문서 작업 시

이 문서는 `apps/api/` 폴더에서 작업할 때 참고하는 API 서버 가이드입니다.

## Architecture

### Clean Architecture + tRPC

```
tRPC Router (presentation) -> UseCase (application) -> Prisma (DB)
```

| 레이어 | 역할 | 위치 |
|--------|------|------|
| Presentation | tRPC procedure 정의, Zod 입력 검증 | `src/domains/{domain}/presentation/` |
| Application | 비즈니스 로직 (UseCase), Prisma 직접 사용 | `src/domains/{domain}/application/` |

> **Note**: Repository 레이어는 제거되었습니다. UseCase에서 Prisma를 직접 사용합니다.

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
│   │   │   └── login.usecase.ts
│   │   ├── presentation/           # tRPC Router
│   │   │   └── auth.router.ts
│   │   └── utils/                  # 도메인 전용 유틸
│   │       └── token.utils.ts
│   ├── account/
│   ├── group/
│   ├── student/
│   ├── attendance/
│   ├── statistics/
│   └── liturgical/         # 천주교 전례력 (의무축일)
├── global/                         # 프로젝트 공통
│   ├── config/                     # 환경설정 (env.ts)
│   ├── errors/                     # 에러 코드/클래스
│   │   ├── api.code.ts
│   │   ├── api.error.ts
│   │   └── api.message.ts
│   ├── middleware/                 # Express 미들웨어
│   │   └── error.middleware.ts
│   ├── utils/                      # 공용 유틸리티
│   │   └── utils.ts
│   └── health.router.ts            # 헬스체크 라우터
└── infrastructure/                 # 외부 연동
    ├── database/                   # Prisma
    │   └── database.ts
    ├── logger/
    │   └── logger.ts
    ├── scheduler/                  # 스케줄러 (연말 학년 변경)
    │   └── scheduler.ts
    └── trpc/                       # tRPC Context
        └── context.ts
```

## Commands

```bash
pnpm dev                # 개발 서버 (빌드 후 node --watch)
pnpm build              # TypeScript 빌드 (tsc -b)
pnpm start              # 프로덕션 서버
pnpm test               # 테스트 실행 (vitest)
pnpm test:watch         # 테스트 워치 모드
pnpm typecheck          # 타입 체크
pnpm lint               # ESLint
```

## 직군별 포인트

- 데이터 일관성: 출석/학생/행사/통계는 단일 소스로 유지하고 중복/불일치 방지 규칙(제약/검증) 명시
- 스케줄러/배치: 학년 전환/졸업 처리의 idempotency, 재실행 안전성, 실행 로그와 실패 알림
- 권한/보안: 역할 기반 접근, 개인정보 최소 수집·암호화·접근 로그, 마스킹 규칙 준수
- 지표/로그: 서버 이벤트 로그를 소스 오브 트루스로 유지, 이벤트 네이밍/속성 일관성, 누락률 모니터링
- 성능/신뢰성: 주간 피크 대비 쿼리/인덱스 최적화, 슬로우 쿼리 로그, 백업/복구 리드타임 관리

## Key Patterns

### Bootstrap 패턴

```typescript
// createApp(): Express 앱 인스턴스 반환 (미들웨어/라우터만 구성)
// - 포트를 열지 않음 (listen 호출 금지)
// - logger/DB/scheduler 초기화하지 않음
// - 테스트에서 사용

// main(): 서버 실행 (진입점에서만 호출)
// - logger 초기화
// - DB 연결 (database.$connect)
// - Scheduler 시작 (테스트 환경 제외)
// - app.listen() 호출
// - Graceful shutdown 핸들러 등록 (SIGINT/SIGTERM)

// ESM 진입점 감지: 직접 실행 시에만 main() 호출
const isMainModule = import.meta.url === `file://${resolve(process.argv[1])}`;
if (isMainModule) {
    main();
}
```

### Scheduler 정책

**초기화 순서:**
```
Logger → DB 연결 → Scheduler(테스트 제외) → Server 시작
```

**테스트 환경 비활성화:**
```typescript
// 테스트 환경에서는 스케줄러가 실행되지 않음
if (!env.mode.test) {
    await Scheduler.studentAge();
}
```

**Graceful Shutdown:**
```typescript
const shutdown = async () => {
    if (!env.mode.test) {
        await schedule.gracefulShutdown();  // 예약된 작업 취소
    }
    await database.$disconnect();
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
```

**에러 처리:**
- 스케줄러 콜백 내 에러는 로깅만 하고 프로세스 유지
- DB 연결 실패 시 스케줄러 시작 전 프로세스 종료

### UseCase 패턴

```typescript
import type { CreateStudentInput, CreateStudentOutput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

// 1 UseCase = 1 비즈니스 액션, Prisma 직접 사용
// Input/Output 타입은 @school/trpc에서 import
export class CreateStudentUseCase {
    async execute(input: CreateStudentInput): Promise<CreateStudentOutput> {
        const student = await database.student.create({
            data: {
                societyName: input.societyName,
                groupId: BigInt(input.groupId),
                // ...
            },
        });
        return { id: String(student.id), ...student };
    }
}
```

### UseCase 타입 패턴

| 패턴 | 사용 시점 | 예시 |
|------|----------|------|
| 직접 import | 스키마 Input과 UseCase Input이 동일 | `import type { GetStudentInput } from '@school/trpc'` |
| context 확장 | accountId 등 context 필드 추가 필요 | `type ListStudentsInput = ListStudentsSchemaInput & { accountId: string }` |

### 데이터 직렬화 (superjson)

tRPC에 superjson transformer가 적용되어 Date, BigInt 등 비-JSON 타입이 자동 직렬화됩니다.

```typescript
// packages/trpc/src/trpc.ts
import superjson from 'superjson';

export const transformer = superjson;

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});
```

> **Note**: 기존 `BigInt.prototype.toJSON` 핵은 제거되었습니다. superjson이 BigInt를 자동 처리합니다.

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

### 인증 컨텍스트 패턴

```typescript
// JWT Payload: { id, name } - DB 조회 없이 토큰에서 직접 추출
// context.ts에서 토큰 검증 후 ctx.account 설정

// protectedProcedure에서 ctx.account 사용 (타입 단언 불필요)
export const groupRouter = router({
    list: protectedProcedure.query(async ({ ctx }) => {
        // ctx.account는 AccountInfo 타입으로 보장됨
        const accountId = ctx.account.id;
        // ...
    }),
});
```

**토큰 검증 흐름:**
1. `createContext`: Bearer 토큰 파싱 → `decodeToken()` 호출
2. `decodeToken`: `jwt.verify()` 실행, 만료 시 `TokenExpiredError` 구분
3. `isAuthenticated` 미들웨어: `ctx.account` 존재 확인, 타입 좁히기 적용

### 에러 처리

```typescript
import { TRPCError } from '@trpc/server';

// tRPC 에러 throw
throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'NOT_FOUND: STUDENT NOT_FOUND',
});

// TRPCError codes: BAD_REQUEST, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, INTERNAL_SERVER_ERROR
```

## Path Aliases

- `~/` → `apps/api/src/` (tsconfig.json에 설정됨)

```typescript
// 사용 예시
import { env } from '~/global/config/env.js';
import { logger } from '~/infrastructure/logger/logger.js';
import { database } from '~/infrastructure/database/database.js';
```

## Database

- **ORM**: Prisma + Driver Adapter
- **Adapter**: `@prisma/adapter-mariadb`
- **스키마**: `apps/api/prisma/schema.prisma`
- **DB**: MariaDB/MySQL

### Driver Adapter

```typescript
// database.ts
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const adapter = new PrismaMariaDb({
    host: env.mysql.host,
    port: Number(env.mysql.port),
    user: env.mysql.username,
    password: env.mysql.password,
    database: env.mysql.schema,
    connectionLimit: 10,
});

export const database = new PrismaClient({ adapter });
```

### KST 타임스탬프 정책

Prisma의 `@default(now())`는 UTC만 지원하므로, 비즈니스 로직에서 KST 시간을 직접 입력합니다.

**유틸리티 함수:**
```typescript
import { getNowKST } from '@school/utils';

// 현재 KST 시간 반환 (UTC + 9시간)
const now = getNowKST();
```

**사용 규칙:**
- `createdAt`: 레코드 생성 시 `getNowKST()` 직접 설정
- `updatedAt`: 레코드 수정 시 `getNowKST()` 직접 설정
- `deletedAt`: 소프트 삭제 시 `getNowKST()` 직접 설정

**예시:**
```typescript
// Create
await database.student.create({
    data: {
        societyName: input.societyName,
        createdAt: getNowKST(),  // KST 시간 직접 입력
    },
});

// Update
await database.student.update({
    where: { id: BigInt(input.id) },
    data: {
        societyName: input.societyName,
        updatedAt: getNowKST(),  // KST 시간 직접 입력
    },
});

// Soft Delete
await database.student.update({
    where: { id: BigInt(input.id) },
    data: {
        deletedAt: getNowKST(),  // KST 시간 직접 입력
    },
});
```

> **Note**: Prisma 스키마에서 `@default(now())`를 제거하고, 모든 타임스탬프 필드는 UseCase에서 직접 설정해야 합니다.

### 슬로우 쿼리 로깅

```typescript
// 1000ms 이상 쿼리 시 경고 로그 출력
database.$on('query', (event) => {
    if (event.duration >= 1000) {
        logger.err(`[SLOW QUERY] ${event.duration}ms - ${event.query}`);
    }
});
```

### Prisma 명령어
```bash
pnpm prisma generate    # 클라이언트 생성
pnpm prisma db push     # 스키마 동기화
pnpm prisma studio      # DB GUI
```

## Environment

- `.env.{NODE_ENV}` 파일 사용
  - `.env.local` - 로컬 개발
  - `.env.test` - 테스트
- `.env.example`을 복사하여 환경변수 설정
- 실제 credentials는 절대 커밋하지 않음

## tRPC Endpoints

> 모든 API는 `/trpc/*` 경로로 제공됩니다. REST API (`/api/*`)는 제거되었습니다.

| Domain | Procedure | Type | 인증 |
|--------|-----------|------|------|
| auth | login | mutation | public |
| account | get | query | protected |
| group | list, get, create, update, delete, bulkDelete, attendance | query/mutation | protected |
| student | list, get, create, update, delete, bulkDelete, restore, graduate, cancelGraduation, promote | query/mutation | protected |
| attendance | update | mutation | protected |
| statistics | excellent, weekly, monthly, yearly, byGender, topGroups, topOverall, groupStatistics | query | protected |
| liturgical | holydays | query | protected |
| health | check | query | public |

## Testing

- **프레임워크**: Vitest
- **설정**: `vitest.config.ts` (projects 구성)

### 테스트 구조

| 프로젝트 | 위치 | Setup | 용도 |
|---------|------|-------|------|
| unit | `test/*.test.ts` | `vitest.setup.ts` | Prisma 모킹, 로직 검증 |
| integration | `test/integration/**/*.test.ts` | `vitest.setup.integration.ts` | tRPC caller, Prisma 모킹 |

### 테스트 헬퍼

| 헬퍼 | 용도 |
|------|------|
| `test/helpers/trpc-caller.ts` | tRPC caller 생성 (public/authenticated) |
| `test/helpers/mock-data.ts` | 결정적 mock 데이터 생성 |

### tRPC Caller 테스트 방식

통합 테스트는 HTTP 오버헤드 없이 tRPC `createCaller`로 프로시저를 직접 호출합니다.

```typescript
// test/helpers/trpc-caller.ts
import { createPublicCaller, createAuthenticatedCaller } from '../helpers/trpc-caller.js';

// 공개 프로시저 테스트
const caller = createPublicCaller();
const result = await caller.auth.login({ name: '중고등부', password: '5678' });

// 인증 필요 프로시저 테스트
const authCaller = createAuthenticatedCaller(accountId, accountName);
const groups = await authCaller.group.list();
```

### Prisma 모킹 (Unit 테스트)

단위 테스트에서는 실제 DB 연결 없이 Prisma Client가 모킹됩니다.

```typescript
// vitest.setup.ts
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn(() => mockPrismaClient),
}));
```

### 테스트 설정 (projects 구성)

```typescript
// vitest.config.ts
export default defineConfig({
    test: {
        projects: [
            defineProject({
                test: {
                    name: 'unit',
                    include: ['test/*.test.ts'],
                    setupFiles: ['./vitest.setup.ts'],
                },
            }),
            defineProject({
                test: {
                    name: 'integration',
                    include: ['test/integration/**/*.test.ts'],
                    setupFiles: ['./vitest.setup.ts'],
                    testTimeout: 30000,
                },
            }),
        ],
    },
});
```

### 테스트 작성 가이드

#### 테스트 파일 구조

```typescript
/**
 * {Domain} 통합 테스트 (tRPC + Prisma Mocking)
 *
 * Mock 데이터를 사용하여 {domain} 프로시저 테스트
 */
import { mockPrismaClient } from '../../vitest.setup.js';
import { createMockGroup, createMockStudent, getTestAccount } from '../helpers/mock-data.js';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('{domain} 통합 테스트', () => {
    beforeEach(() => {
        // 각 테스트 전 mock 초기화
        mockPrismaClient.{model}.findMany.mockReset();
        mockPrismaClient.{model}.findFirst.mockReset();
        // ...
    });

    describe('{procedure명}', () => {
        it('성공 케이스 설명', async () => {
            // 1. Arrange: Mock 데이터 준비
            // 2. Act: API 호출
            // 3. Assert: 결과 검증
        });

        it('에러 케이스 설명', async () => {
            // ...
        });
    });
});
```

#### Mock 데이터 생성 패턴

```typescript
// test/helpers/mock-data.ts 사용
import {
    createMockAccount,
    createMockGroup,
    createMockStudent,
    createMockAttendance,
    getTestAccount,
} from '../helpers/mock-data.js';

// 기본 mock 데이터 생성
const mockStudent = createMockStudent();

// 특정 필드 오버라이드
const mockStudent = createMockStudent({
    societyName: '홍길동',
    gender: 'M',
    groupId: BigInt(1),
});

// 테스트 계정 (로그인용)
const testAccount = getTestAccount();
```

#### Prisma Mock 패턴

```typescript
// 단일 결과 반환
mockPrismaClient.student.findFirst.mockResolvedValueOnce(mockStudent);

// 배열 결과 반환
mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent1, mockStudent2]);

// 여러 번 호출되는 경우 (체이닝)
mockPrismaClient.student.findMany
    .mockResolvedValueOnce([mockStudent1])  // 첫 번째 호출
    .mockResolvedValueOnce([mockStudent2]); // 두 번째 호출

// null 반환 (not found 케이스)
mockPrismaClient.student.findFirst.mockResolvedValueOnce(null);

// $queryRaw 모킹 (Raw SQL 사용 시)
mockPrismaClient.$queryRaw.mockResolvedValueOnce([
    { _id: BigInt(1), society_name: '홍길동', score: BigInt(15) },
]);

// $transaction 모킹
const txMock = {
    attendance: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(mockAttendance),
    },
};
(mockPrismaClient as any).$transaction = vi.fn().mockImplementation((cb) => cb(txMock));
```

#### 테스트 케이스 필수 항목

| 유형 | 필수 테스트 | 설명 |
|------|------------|------|
| 성공 케이스 | O | 정상 동작 검증 |
| 미인증 에러 | O | `protectedProcedure`는 반드시 테스트 |
| 입력 검증 에러 | △ | Zod 스키마 검증 실패 케이스 |
| 권한 에러 | △ | 다른 계정 데이터 접근 시 |
| Not Found | △ | 존재하지 않는 리소스 |
| 빈 데이터 | △ | 데이터 없을 때 기본값 반환 |

#### 성공 케이스 테스트

```typescript
it('학생 목록 조회 성공', async () => {
    // Arrange
    const testAccount = getTestAccount();
    const accountId = String(testAccount.id);
    const accountName = testAccount.name;
    const mockGroup = createMockGroup({ accountId: BigInt(accountId) });
    const mockStudent = createMockStudent({ groupId: mockGroup.id });

    mockPrismaClient.student.findMany.mockResolvedValueOnce([mockStudent]);
    mockPrismaClient.student.count.mockResolvedValueOnce(1);

    // Act
    const caller = createAuthenticatedCaller(accountId, accountName);
    const result = await caller.student.list({ groupId: String(mockGroup.id) });

    // Assert
    expect(result).toHaveProperty('students');
    expect(result).toHaveProperty('total');
    expect(Array.isArray(result.students)).toBe(true);
    expect(result.students.length).toBe(1);
    expect(result.students[0].societyName).toBe(mockStudent.societyName);
});
```

#### 미인증 에러 테스트

```typescript
it('미인증 시 UNAUTHORIZED 에러', async () => {
    const caller = createPublicCaller();

    await expect(caller.student.list({ groupId: '1' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
    });
});
```

#### 권한 에러 테스트

```typescript
it('다른 계정의 그룹 접근 시 FORBIDDEN 에러', async () => {
    const testAccount = getTestAccount();
    const accountId = String(testAccount.id);
    const accountName = testAccount.name;
    const otherAccountGroup = createMockGroup({ accountId: BigInt(999) }); // 다른 계정

    mockPrismaClient.group.findFirst.mockResolvedValueOnce(null); // 권한 없음

    const caller = createAuthenticatedCaller(accountId, accountName);

    await expect(
        caller.group.get({ id: String(otherAccountGroup.id) })
    ).rejects.toMatchObject({
        code: 'FORBIDDEN',
    });
});
```

#### 입력 검증 에러 테스트

```typescript
it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
    const testAccount = getTestAccount();
    const accountId = String(testAccount.id);
    const accountName = testAccount.name;

    const caller = createAuthenticatedCaller(accountId, accountName);

    await expect(
        caller.student.get({ id: 'invalid-id' })
    ).rejects.toMatchObject({
        code: 'BAD_REQUEST',
    });
});
```

#### 빈 데이터 테스트

```typescript
it('학생이 없는 경우 빈 배열 반환', async () => {
    const testAccount = getTestAccount();
    const accountId = String(testAccount.id);
    const accountName = testAccount.name;

    mockPrismaClient.student.findMany.mockResolvedValueOnce([]);

    const caller = createAuthenticatedCaller(accountId, accountName);
    const result = await caller.statistics.byGender({ year: 2024 });

    expect(result.male.count).toBe(0);
    expect(result.female.count).toBe(0);
});
```

### vitest.setup.ts 구성

```typescript
// Mock Prisma Client 타입
interface MockPrismaClient {
    account: MockModel;
    group: MockModel;
    student: MockModel;
    attendance: MockModel;
    $connect: Mock;
    $disconnect: Mock;
    $on: Mock;
    $queryRaw: Mock;
    $transaction?: Mock;
}

// 모델 모킹 헬퍼
function createMockModel(): MockModel {
    return {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    };
}

// Prisma.sql 템플릿 태그 모킹 ($queryRaw 사용 시 필요)
const mockSql = (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
});

vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
    Prisma: {
        sql: mockSql,
    },
}));
```

## Logging Policy

### 민감정보 마스킹
로그에 민감정보가 노출되지 않도록 자동 마스킹이 적용됩니다.

```typescript
// 마스킹 대상 필드 (logger.ts 내부)
const SENSITIVE_KEYS = ['password', 'token', 'secret', 'accesstoken', 'refreshtoken'];

// 마스킹 결과 예시
// 입력: { id: "admin", password: "secret" }
// 출력: { id: "admin", password: "***" }
```

### 로깅 규칙
- `logger.req()`: 요청 body 마스킹 적용, 쿠키 제외
- `logger.res()`: 응답 body 마스킹 적용, 구조화 로그 필드 포함 (requestId, account, status, latency)

### 구조화 로그 필드
```typescript
{
    requestId: string,    // cls-rtracer.id()
    account: string,      // context.get('account_name')
    status: number,       // 응답 상태 코드
    latency: number       // elapsed ms
}
```
