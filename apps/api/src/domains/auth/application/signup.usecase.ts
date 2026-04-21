/**
 * Signup UseCase
 *
 * 회원가입 비즈니스 로직
 */
import {
    generateFamilyId,
    generateRefreshToken,
    getRefreshTokenExpiry,
    hashRefreshToken,
    setRefreshTokenCookie,
} from '../utils/refresh-token.utils.js';
import { Prisma } from '@prisma/client';
import type { SignupInput, SignupOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '~/global/config/env.js';
import { database } from '~/infrastructure/database/database.js';
import { logger } from '~/infrastructure/logger/logger.js';
import { mailService } from '~/infrastructure/mail/mail.service.js';

const DUPLICATE_NAME_MESSAGE = '이미 사용 중인 아이디입니다.';

export class SignupUseCase {
    async execute(input: SignupInput, res: Response): Promise<SignupOutput> {
        // 1. ID를 소문자로 정규화
        const normalizedName = input.name.toLowerCase();

        // 2. ID 중복 확인
        const existingAccount = await database.account.findFirst({
            where: {
                name: normalizedName,
                deletedAt: null,
            },
        });

        if (existingAccount) {
            throw new TRPCError({
                code: 'CONFLICT',
                message: DUPLICATE_NAME_MESSAGE,
            });
        }

        // 3. 비밀번호 해싱
        const hashedPassword = bcrypt.hashSync(input.password, 10);

        // 4. 계정 생성 (DB UNIQUE 제약으로 동시 가입·탈퇴 계정 충돌 차단)
        let account;
        try {
            account = await database.account.create({
                data: {
                    name: normalizedName,
                    displayName: input.displayName,
                    password: hashedPassword,
                    createdAt: getNowKST(),
                    privacyAgreedAt: getNowKST(),
                },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                logger.log('[signup] name collision on DB unique', { name: normalizedName });
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: DUPLICATE_NAME_MESSAGE,
                });
            }
            throw e;
        }

        // 5. 회원가입 알림 메일 발송 (비동기, fire-and-forget)
        mailService.sendSignupNotification({
            displayName: account.displayName,
        });

        // 6. Access Token 생성
        const payload = {
            id: String(account.id),
            name: account.name,
        };
        const accessToken = jwt.sign(payload, env.jwt.secret, {
            expiresIn: env.jwt.expire.access as jwt.SignOptions['expiresIn'],
        });

        // 7. Refresh Token 발급 (new family)
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

        // 8. 결과 반환
        return {
            name: account.name,
            displayName: account.displayName,
            accessToken,
        };
    }
}
