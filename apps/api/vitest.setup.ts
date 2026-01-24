/**
 * 테스트 공통 setup (단위/통합 테스트 공용)
 *
 * Prisma mocking으로 DB 연결 없이 로직 검증
 */
import type { Mock } from 'vitest';
import { beforeAll, vi } from 'vitest';
import { logger } from '~/infrastructure/logger/logger.js';

process.env.NODE_ENV = 'test';

// Mock 모델 타입
interface MockModel {
    findMany: Mock;
    findUnique: Mock;
    findFirst: Mock;
    create: Mock;
    update: Mock;
    delete: Mock;
    count: Mock;
    updateMany: Mock;
    deleteMany: Mock;
}

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

// Mock Prisma Client
export const mockPrismaClient: MockPrismaClient = {
    account: createMockModel(),
    group: createMockModel(),
    student: createMockModel(),
    attendance: createMockModel(),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $on: vi.fn(),
    $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
};

// database 모듈 모킹
vi.mock('~/infrastructure/database/database.js', () => ({
    database: mockPrismaClient,
    connectDatabase: vi.fn().mockResolvedValue(undefined),
}));

// @prisma/adapter-mariadb 모킹
vi.mock('@prisma/adapter-mariadb', () => ({
    PrismaMariaDb: vi.fn().mockImplementation(() => ({})),
}));

// Prisma.sql 템플릿 태그 모킹
const mockSql = (strings: TemplateStringsArray, ...values: unknown[]) => ({
    strings,
    values,
});

// @prisma/client 모킹
vi.mock('@prisma/client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => mockPrismaClient),
    Prisma: {
        sql: mockSql,
    },
}));

beforeAll(async () => {
    // Logger 초기화 (최소 출력)
    logger.init({
        console: false,
        debug: false,
        log: false,
        error: true,
        fatal: true,
        sql: false,
        net: false,
    });
});
