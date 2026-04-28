import pkg from '../package.json' with { type: 'json' };
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import tracer from 'cls-rtracer';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import context from 'express-http-context';
import rateLimit from 'express-rate-limit';
import schedule from 'node-schedule';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import requestIp from 'request-ip';
import { appRouter } from '~/app.router.js';
import { env } from '~/global/config/env.js';
import { errorHandler } from '~/global/middleware/error.middleware.js';
import { connectDatabase, database } from '~/infrastructure/database/database.js';
import { logger } from '~/infrastructure/logger/logger.js';
import { Scheduler } from '~/infrastructure/scheduler/scheduler.js';
import { createContext } from '~/infrastructure/trpc/context.js';
import { buildResponseMeta } from '~/infrastructure/trpc/response-meta.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Express 앱 인스턴스 생성
 *
 * 미들웨어와 라우터만 등록하고, 포트를 열지 않음.
 * 테스트에서는 이 함수만 사용하여 앱 인스턴스를 얻음.
 */
export const createApp = (): Express => {
    const app = express();

    // 정적 파일 서빙
    app.use(express.static(join(__dirname, '../public')));
    app.use(cookieParser());

    // 각 요청의 최대 사이즈를 지정해 주는 부분이다.
    app.use(express.urlencoded({ extended: true })); // parameterLimit을 줘서 최대 파라미터 개수를 지정할 수도 있다.
    app.use(express.json({ limit: '10mb', strict: true }));
    app.use(express.raw({ limit: '10mb' }));

    // CORS
    const corsOrigin = env.cors.origin;
    app.use(
        cors({
            origin: corsOrigin || false, // 미설정 시 same-origin만 허용
            credentials: true,
        })
    );

    // Rate Limiting — 전체 API: IP당 200회/분 (정책: .claude/rules/api.md)
    app.use(
        rateLimit({
            windowMs: 60 * 1000,
            limit: 200,
            standardHeaders: 'draft-7',
            legacyHeaders: false,
        })
    );

    // Rate Limiting — 인증 엔드포인트: IP당 10회/분
    app.use(
        '/trpc/auth',
        rateLimit({
            windowMs: 60 * 1000,
            limit: 10,
            standardHeaders: 'draft-7',
            legacyHeaders: false,
            message: { error: 'Too many requests. Please try again later.' },
        })
    );

    // 요청 트레이싱
    app.use(tracer.expressMiddleware());
    app.use(context.middleware);

    // 로깅 미들웨어
    app.use((req, _res, next) => {
        const { method, url } = req;

        // body, params, query는 logger.req()에서 마스킹 처리하여 로깅
        logger.log(`ip: ${requestIp.getClientIp(req)} [${method}] ${url}`);
        logger.req(req);
        next();
    });

    // tRPC 엔드포인트
    app.use(
        '/trpc',
        createExpressMiddleware({
            router: appRouter,
            createContext,
            responseMeta: buildResponseMeta,
        })
    );

    // 중앙 에러 처리 미들웨어 (라우터 등록 후 마지막에 추가)
    app.use(errorHandler);

    return app;
};

/**
 * 서버 실행 (진입점에서만 호출)
 *
 * logger 초기화, DB 연결, scheduler 시작, listen, graceful shutdown 등록
 */
export const main = async (): Promise<void> => {
    // 1. Logger 초기화
    logger.init({
        log: true,
        sql: true,
        net: true,
        debug: !env.mode.prod,
        error: true,
        fatal: true,
        console: false,
    });

    logger.log(`[ v${pkg.version}, ${env.mode.value} ] =========================================`);

    // 2. DB 연결 (스케줄러보다 먼저)
    try {
        await connectDatabase();
    } catch (e) {
        logger.error('Failed to connect to database:', e);
        process.exit(1);
    }

    // 3. Scheduler 시작 (테스트 환경 제외)
    if (!env.mode.test) {
        await Scheduler.studentAge();
        await Scheduler.churnDetection();
        await Scheduler.orgDailyReport();
        logger.log('Scheduler started');
    }

    // 4. 서버 시작
    const app = createApp();
    app.listen(env.app.port, () => {
        logger.log(`----------------------------------------------`);
        logger.log(`🚀 App listening on the port ${env.app.port}`);
        logger.log(`==============================================`);
        console.log(
            `[ v${pkg.build || pkg.version}, ${env.mode.value} ] =================================== READY !!!`
        );
    });

    // 5. Graceful shutdown 등록
    const shutdown = async () => {
        // 스케줄러 정리 (테스트 환경 제외)
        if (!env.mode.test) {
            await schedule.gracefulShutdown();
            logger.log('Scheduler shutdown');
        }
        await database.$disconnect();
        logger.log('Database disconnected');
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
};

// ESM 진입점 감지: 직접 실행 시에만 main() 호출
const isMainModule = import.meta.url === `file://${resolve(process.argv[1])}`;

if (isMainModule) {
    try {
        await main();
    } catch (e) {
        console.error('Failed to start server:', e);
        process.exit(1);
    }
}
