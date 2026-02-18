/**
 * Login UseCase
 *
 * 로그인 비즈니스 로직을 캡슐화
 */
import type { LoginInput, LoginOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '~/global/config/env.js';
import { database } from '~/infrastructure/database/database.js';

export class LoginUseCase {
    async execute(input: LoginInput): Promise<LoginOutput> {
        // 1. 계정 조회
        const account = await database.account.findFirst({
            where: {
                name: input.name.toLowerCase(),
                deletedAt: null,
            },
        });

        if (!account) {
            // 삭제된 계정인지 확인
            const deletedAccount = await database.account.findFirst({
                where: {
                    name: input.name.toLowerCase(),
                    deletedAt: { not: null },
                },
            });

            if (deletedAccount) {
                const isPasswordValid = bcrypt.compareSync(input.password, deletedAccount.password);
                const twoYearsAgo = getNowKST();
                twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                const isWithinRetention = deletedAccount.deletedAt! > twoYearsAgo;

                if (isPasswordValid && isWithinRetention) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'ACCOUNT_DELETED',
                    });
                }
            }

            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'NOT_FOUND: ID NOT_FOUND',
            });
        }

        // 2. 비밀번호 검증: bcrypt.hashSync(password, 10)로 만들어낸 패스워드끼리 비교.
        const isPasswordValid = bcrypt.compareSync(input.password, account.password);
        if (!isPasswordValid) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'UNAUTHORIZED: PW is NOT_MATCHED',
            });
        }

        // 3. Access Token 생성
        const payload = {
            id: String(account.id),
            name: account.name,
        };
        const accessToken = jwt.sign(payload, env.jwt.secret, {
            expiresIn: env.jwt.expire.access as jwt.SignOptions['expiresIn'],
        });

        // 4. 결과 반환
        return {
            name: account.name,
            displayName: account.displayName,
            accessToken,
        };
    }
}
