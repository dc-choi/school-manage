import { NextFunction, Request, Response } from 'express';
import { logger } from '~/infrastructure/logger/logger.js';

interface ExpressError extends Error {
    status?: number;
    statusCode?: number;
}

/**
 * tRPC 외 라우트의 에러를 처리하는 폴백 미들웨어.
 * tRPC procedure 에러는 어댑터의 responseMeta가 처리하므로 이 미들웨어에 도달하지 않는다.
 *
 * - Express body-parser/라우트 등에서 status를 명시한 에러는 그 status 사용 (예: JSON 파싱 실패 → 400)
 * - 그 외 예상치 못한 에러는 500 + 일반 메시지 (내부 메시지/스택 노출 금지)
 */
export const errorHandler = (
    err: ExpressError,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {
    const status = err.status ?? err.statusCode ?? 500;
    const isClientError = status >= 400 && status < 500;
    const message = isClientError ? err.message || 'BAD_REQUEST' : 'INTERNAL_SERVER_ERROR';

    logger.error(
        JSON.stringify({
            code: status,
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
        })
    );

    const response = { code: status, message };
    logger.res(status, response, req);

    res.status(status).json(response);
};
