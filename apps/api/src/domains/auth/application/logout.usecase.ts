/**
 * Logout UseCase
 *
 * cookie RT의 family 전체 삭제 + 쿠키 삭제
 */
import { clearRefreshTokenCookie, getRefreshTokenFromCookies, hashRefreshToken } from '../utils/refresh-token.utils.js';
import type { LogoutOutput } from '@school/shared';
import type { Request, Response } from 'express';
import { database } from '~/infrastructure/database/database.js';

export class LogoutUseCase {
    async execute(req: Request, res: Response): Promise<LogoutOutput> {
        const rawToken = getRefreshTokenFromCookies(req.cookies);

        if (rawToken) {
            const tokenHash = hashRefreshToken(rawToken);
            const storedToken = await database.refreshToken.findFirst({
                where: { tokenHash },
                select: { familyId: true },
            });

            if (storedToken) {
                // 같은 family의 모든 RT 삭제
                await database.refreshToken.deleteMany({
                    where: { familyId: storedToken.familyId },
                });
            }
        }

        clearRefreshTokenCookie(res);
        return { success: true };
    }
}
