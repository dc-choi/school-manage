/**
 * Signup UseCase
 *
 * 회원가입 비즈니스 로직
 */
import type { SignupInput, SignupOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '~/global/config/env.js';
import { database } from '~/infrastructure/database/database.js';
import { mailService } from '~/infrastructure/mail/mail.service.js';

export class SignupUseCase {
    async execute(input: SignupInput): Promise<SignupOutput> {
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
                message: 'CONFLICT: 이미 사용 중인 아이디입니다',
            });
        }

        // 3. 비밀번호 해싱
        const hashedPassword = bcrypt.hashSync(input.password, 10);

        // 4. 계정 생성
        const account = await database.account.create({
            data: {
                name: normalizedName,
                displayName: input.displayName,
                password: hashedPassword,
                createdAt: getNowKST(),
                privacyAgreedAt: getNowKST(),
            },
        });

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

        // 7. 결과 반환
        return {
            name: account.name,
            displayName: account.displayName,
            accessToken,
        };
    }
}
