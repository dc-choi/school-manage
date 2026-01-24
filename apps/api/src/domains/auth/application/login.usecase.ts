/**
 * Login UseCase
 *
 * 로그인 비즈니스 로직을 캡슐화
 */
import type { LoginInput, LoginOutput } from '@school/trpc';
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
                name: input.name,
                deletedAt: null,
            },
        });

        if (!account) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'NOT_FOUND: ID NOT_FOUND',
            });
        }

        // 2. 비밀번호 검증: bcrypt.hashSync(password, 12)로 만들어낸 패스워드끼리 비교.
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
            accessToken,
        };
    }
}
