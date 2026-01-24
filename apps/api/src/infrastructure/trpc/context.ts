import type { Context } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { decodeToken } from '~/domains/auth/utils/token.utils.js';
import { logger } from '~/infrastructure/logger/logger.js';

/**
 * tRPC 컨텍스트 생성 함수
 *
 * - Authorization 헤더에서 Bearer 토큰 파싱
 * - 토큰 검증 (jwt.verify가 만료 검증 포함)
 * - decoded에서 직접 account 정보 추출 (DB 조회 없음)
 */
export const createContext = ({ req, res }: CreateExpressContextOptions): Context => {
    const baseContext: Context = { req, res };

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer')) {
        return baseContext;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return baseContext;
    }

    try {
        const decoded = decodeToken(token);

        return {
            ...baseContext,
            account: {
                id: decoded.id,
                name: decoded.name,
            },
        };
    } catch (error) {
        // TRPCError (인증 에러)는 그대로 throw
        if (error instanceof TRPCError) {
            throw error;
        }

        // 예상치 못한 에러만 로깅 후 기본 컨텍스트 반환
        logger.error('Unexpected error in createContext:', error);
        return baseContext;
    }
};
