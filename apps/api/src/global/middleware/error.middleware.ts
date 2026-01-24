import { ApiCode } from '../errors/api.code.js';
import { ApiError } from '../errors/api.error.js';
import { ApiMessage } from '../errors/api.message.js';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { logger } from '~/infrastructure/logger/logger.js';

/**
 * 중앙 에러 처리 미들웨어
 * 모든 예외를 catch하여 통일된 응답 포맷으로 반환한다.
 */
export const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next: NextFunction
) => {
    let code: number;
    let message: string;

    if (err instanceof ApiError) {
        // ApiError: 정의된 code/message 사용
        code = err.code;
        message = err.message;
    } else {
        // 예상치 못한 에러: 500으로 매핑
        code = ApiCode.INTERNAL_SERVER_ERROR;
        message = ApiMessage.INTERNAL_SERVER_ERROR;
    }

    // 로깅 1회 수행
    logger.error(
        JSON.stringify({
            code,
            message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
        })
    );

    const response = { code, message };
    logger.res(httpStatus.OK, response, req);

    // HTTP 상태 코드는 200 유지 (기존 동작 호환)
    res.status(httpStatus.OK).json(response);
};
