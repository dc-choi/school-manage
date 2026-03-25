/**
 * Refresh UseCase
 *
 * RTR (Refresh Token Rotation) + Token Family
 * cookie RT → DB 검증 → new AT + new RT (회전)
 * 탈취 감지: DB에 없는 RT → 401
 */
import {
    clearRefreshTokenCookie,
    generateRefreshToken,
    getRefreshTokenExpiry,
    getRefreshTokenFromCookies,
    hashRefreshToken,
    setRefreshTokenCookie,
} from '../utils/refresh-token.utils.js';
import type { RefreshOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '~/global/config/env.js';
import { database } from '~/infrastructure/database/database.js';

export class RefreshUseCase {
    async execute(req: Request, res: Response): Promise<RefreshOutput> {
        // 1. Cookie에서 RT 추출
        const rawToken = getRefreshTokenFromCookies(req.cookies);
        if (!rawToken) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '인증이 만료되었습니다. 다시 로그인해 주세요.',
            });
        }

        // 2. RT 해시 계산 → DB 검색
        const tokenHash = hashRefreshToken(rawToken);
        const storedToken = await database.refreshToken.findFirst({
            where: { tokenHash },
        });

        // 3-a. DB에 없음 → 탈취 감지 또는 이미 회전됨 → 401
        if (!storedToken) {
            clearRefreshTokenCookie(res);
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '인증이 만료되었습니다. 다시 로그인해 주세요.',
            });
        }

        // 3-b. 만료됨
        if (storedToken.expiresAt < getNowKST()) {
            await database.refreshToken.delete({ where: { id: storedToken.id } });
            clearRefreshTokenCookie(res);
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '인증이 만료되었습니다. 다시 로그인해 주세요.',
            });
        }

        // 4. 계정 조회
        const account = await database.account.findFirst({
            where: { id: storedToken.accountId, deletedAt: null },
        });

        if (!account) {
            await database.refreshToken.deleteMany({ where: { accountId: storedToken.accountId } });
            clearRefreshTokenCookie(res);
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        // 5. 토큰 회전: old RT 삭제 + new RT 생성 (같은 familyId)
        const newRawToken = generateRefreshToken();
        const newTokenHash = hashRefreshToken(newRawToken);
        const newExpiresAt = getRefreshTokenExpiry();

        await database.$transaction([
            database.refreshToken.delete({ where: { id: storedToken.id } }),
            database.refreshToken.create({
                data: {
                    accountId: account.id,
                    tokenHash: newTokenHash,
                    familyId: storedToken.familyId,
                    expiresAt: newExpiresAt,
                    createdAt: getNowKST(),
                },
            }),
            // 같은 계정의 만료된 RT 정리
            database.refreshToken.deleteMany({
                where: { accountId: account.id, expiresAt: { lt: getNowKST() } },
            }),
        ]);

        // 6. New AT 발급
        const payload = { id: String(account.id), name: account.name };
        const accessToken = jwt.sign(payload, env.jwt.secret, {
            expiresIn: env.jwt.expire.access as jwt.SignOptions['expiresIn'],
        });

        // 7. New RT 쿠키 설정
        setRefreshTokenCookie(res, newRawToken);

        return { accessToken };
    }
}
