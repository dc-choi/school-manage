import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import type { ITXClientDenyList } from '@prisma/client/runtime/library';
import { Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from 'kysely';
import kyselyExtension from 'prisma-extension-kysely';
import { env } from '~/global/config/env.js';
import { CustomCamelCasePlugin } from '~/infrastructure/database/camel-case.plugin.js';
import type { DB } from '~/infrastructure/database/generated/types.js';
import { logger } from '~/infrastructure/logger/logger.js';

// 슬로우 쿼리 임계값 (ms)
const SLOW_QUERY_THRESHOLD = 1000;

/**
 * SQL 쿼리의 ? 플레이스홀더를 실제 파라미터 값으로 치환
 */
const interpolateQuery = (query: string, params: string): string => {
    try {
        const parsedParams: unknown[] = JSON.parse(params);
        let index = 0;
        return query.replaceAll('?', () => {
            const value = parsedParams[index++];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value}'`;
            if (typeof value === 'number' || typeof value === 'bigint') return String(value);
            if (value instanceof Date) return `'${value.toISOString()}'`;
            return String(value);
        });
    } catch {
        return `${query} -- params: ${params}`;
    }
};

// MariaDB Adapter 생성 (connection pool 내장)
const adapter = new PrismaMariaDb({
    host: env.mysql.host,
    port: Number(env.mysql.port),
    user: env.mysql.username,
    password: env.mysql.password,
    database: env.mysql.schema,
    connectionLimit: env.mysql.connectionLimit,
});

// PrismaClient 생성 (adapter 주입)
const baseClient = new PrismaClient({
    adapter,
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
    ],
});

// Query 이벤트 핸들러 등록 ($on은 $extends 전에 호출해야 함)
baseClient.$on('query', (event) => {
    const duration = event.duration;
    const query = event.query;
    const params = event.params;
    const interpolated = interpolateQuery(query, params);

    // 슬로우 쿼리 감지
    if (duration >= SLOW_QUERY_THRESHOLD) {
        logger.err(`[SLOW QUERY] ${duration}ms - ${interpolated}`);
    } else if (env.mode.local) {
        logger.sql(`${duration}ms - ${interpolated}`);
    }
});

// $transaction 콜백의 tx 타입 (확장 포함)
export type TransactionClient = Omit<typeof database, ITXClientDenyList>;

// Kysely 확장 적용 (Prisma 커넥션 공유)
export const database = baseClient.$extends(
    kyselyExtension({
        kysely: (driver) =>
            new Kysely<DB>({
                dialect: {
                    createDriver: () => driver,
                    createAdapter: () => new MysqlAdapter(),
                    createIntrospector: (db) => new MysqlIntrospector(db),
                    createQueryCompiler: () => new MysqlQueryCompiler(),
                },
                plugins: [new CustomCamelCasePlugin()],
            }),
    })
);

/**
 * DB 연결 및 상태 로깅
 */
export const connectDatabase = async (): Promise<void> => {
    const dbInfo = `${env.mysql.host}:${env.mysql.port}/${env.mysql.schema}`;
    try {
        // Driver Adapter는 lazy connection이므로 실제 쿼리로 연결 확인
        await database.$queryRaw`SELECT 1`;
        logger.log(`[DB] Connected to ${dbInfo}`);
        console.log(`[DB] Connected to ${dbInfo}`);
    } catch (error) {
        logger.err(`[DB] Connection failed: ${error}`);
        console.error(`[DB] Connection failed:`, error);
        throw error;
    }
};
