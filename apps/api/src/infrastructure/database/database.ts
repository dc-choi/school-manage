import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import { env } from '~/global/config/env.js';
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
        return query.replace(/\?/g, () => {
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
    connectionLimit: 10,
});

// PrismaClient 생성 (adapter 주입)
export const database = new PrismaClient({
    adapter,
    log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
    ],
});

// Query 이벤트 핸들러 등록
database.$on('query', (event) => {
    const duration = event.duration;
    const query = event.query;
    const params = event.params;
    const interpolated = interpolateQuery(query, params);

    // 슬로우 쿼리 감지
    if (duration >= SLOW_QUERY_THRESHOLD) {
        logger.err(`[SLOW QUERY] ${duration}ms - ${interpolated}`);
    } else {
        // 일반 쿼리 로깅 (개발 환경만)
        if (env.mode.local) {
            logger.sql(`${duration}ms - ${interpolated}`);
        }
    }
});

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
