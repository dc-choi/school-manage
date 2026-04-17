import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import type { ITXClientDenyList } from '@prisma/client/runtime/library';
import { Kysely, MysqlAdapter, MysqlIntrospector, MysqlQueryCompiler } from 'kysely';
import kyselyExtension from 'prisma-extension-kysely';
import { env } from '~/global/config/env.js';
import { CustomCamelCasePlugin } from '~/infrastructure/database/camel-case.plugin.js';
import type { DB } from '~/infrastructure/database/generated/types.js';
import { logger } from '~/infrastructure/logger/logger.js';

// 슬로우 쿼리 임계값 (ms)
const SLOW_QUERY_THRESHOLD = 1000;

const MASKED = "'***'";

/**
 * 파라미터 JSON 배열의 각 값을 SQL 리터럴로 마스킹/직렬화.
 * 문자열/Date/기타 타입 = 마스킹('***'), 숫자/bigint/null = 원값 유지.
 */
const maskParam = (value: unknown): string => {
    if (value === null) return 'NULL';
    if (typeof value === 'number' || typeof value === 'bigint') return String(value);
    return MASKED;
};

/**
 * SQL 쿼리의 ? 플레이스홀더를 마스킹된 파라미터 값으로 치환.
 * PII(이메일, 이름, 비밀번호 해시 등) 노출을 방지한다.
 */
export const interpolateQuery = (query: string, params: string): string => {
    try {
        const parsedParams: unknown[] = JSON.parse(params);
        let index = 0;
        return query.replaceAll('?', () => maskParam(parsedParams[index++]));
    } catch {
        return `${query} -- params: <masked>`;
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

// 쿼리 로깅 모드에 따른 log 배열 구성.
// 'off': query 이벤트 비발행 → 핸들러 등록 자체 생략 → 오버헤드 제거.
const buildLogConfig = (): Prisma.LogDefinition[] => {
    const base: Prisma.LogDefinition[] = [
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
    ];
    if (env.db.queryLogging === 'off') return base;
    return [{ emit: 'event', level: 'query' }, ...base];
};

const baseClient = new PrismaClient({
    adapter,
    log: buildLogConfig(),
});

// Query 이벤트 핸들러는 'slow'/'all' 모드에서만 등록 ($on은 $extends 전에 호출해야 함)
if (env.db.queryLogging !== 'off') {
    baseClient.$on('query', (event) => {
        const { duration, query, params } = event;
        const isSlow = duration >= SLOW_QUERY_THRESHOLD;

        if (isSlow) {
            logger.err(`[SLOW QUERY] ${duration}ms - ${interpolateQuery(query, params)}`);
            return;
        }

        if (env.db.queryLogging === 'all') {
            logger.sql(`${duration}ms - ${interpolateQuery(query, params)}`);
        }
    });
}

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
