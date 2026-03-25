/**
 * Restore Account UseCase
 *
 * 삭제된 계정 복원 비즈니스 로직
 * 비밀번호 검증 → 2년 이내 확인 → 계정 복원 → JWT 발급
 * 조직 재합류는 사용자가 직접 수행
 */
import {
    generateFamilyId,
    generateRefreshToken,
    getRefreshTokenExpiry,
    hashRefreshToken,
    setRefreshTokenCookie,
} from '../utils/refresh-token.utils.js';
import type { RestoreAccountInput, RestoreAccountOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '~/global/config/env.js';
import { database } from '~/infrastructure/database/database.js';

export class RestoreAccountUseCase {
    async execute(input: RestoreAccountInput, res: Response): Promise<RestoreAccountOutput> {
        // 1. 삭제된 계정 조회
        const account = await database.account.findFirst({
            where: {
                name: input.name.toLowerCase(),
                deletedAt: { not: null },
            },
        });

        if (!account) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        // 2. 비밀번호 검증
        const isPasswordValid = bcrypt.compareSync(input.password, account.password);
        if (!isPasswordValid) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '비밀번호가 일치하지 않습니다.',
            });
        }

        // 3. 2년 이내 확인
        const twoYearsAgo = getNowKST();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        if (account.deletedAt! <= twoYearsAgo) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: '복원 가능 기간(2년)이 경과했습니다.',
            });
        }

        // 4. 계정 복원 (조직 재합류는 사용자가 직접 수행)
        await database.account.update({
            where: { id: account.id },
            data: { deletedAt: null },
        });

        // 5. JWT 발급
        const payload = {
            id: String(account.id),
            name: account.name,
        };
        const accessToken = jwt.sign(payload, env.jwt.secret, {
            expiresIn: env.jwt.expire.access as jwt.SignOptions['expiresIn'],
        });

        // 6. Refresh Token 발급 (new family)
        const rawRefreshToken = generateRefreshToken();
        const tokenHash = hashRefreshToken(rawRefreshToken);
        const familyId = generateFamilyId();
        const expiresAt = getRefreshTokenExpiry();

        await database.refreshToken.create({
            data: {
                accountId: account.id,
                tokenHash,
                familyId,
                expiresAt,
                createdAt: getNowKST(),
            },
        });

        setRefreshTokenCookie(res, rawRefreshToken);

        return {
            name: account.name,
            displayName: account.displayName,
            accessToken,
        };
    }
}
