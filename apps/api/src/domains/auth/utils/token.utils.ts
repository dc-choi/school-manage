/**
 * Token Utils
 *
 * JWT 토큰 관련 유틸리티 함수
 */
import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';
import { env } from '~/global/config/env.js';

export interface DecodedToken {
    id: string;
    name: string;
    iat: number;
    exp: number;
}

/**
 * JWT 토큰 복호화
 *
 * jwt.verify()가 만료 검증을 자동으로 수행함
 */
export const decodeToken = (token: string): DecodedToken => {
    try {
        return jwt.verify(token, env.jwt.secret) as DecodedToken;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'UNAUTHORIZED: Token expired',
            });
        }
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'UNAUTHORIZED: Invalid token',
        });
    }
};
