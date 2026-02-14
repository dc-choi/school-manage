/**
 * Reset Password UseCase
 *
 * 비밀번호 재설정 비즈니스 로직
 * 임시 비밀번호 생성 → 이메일 발송 (동기) → 성공 시 DB 업데이트
 */
import type { ResetPasswordInput, ResetPasswordOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { database } from '~/infrastructure/database/database.js';
import { mailService } from '~/infrastructure/mail/mail.service.js';

export class ResetPasswordUseCase {
    async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
        // 1. name으로 계정 조회
        const account = await database.account.findFirst({
            where: { name: input.name.toLowerCase(), deletedAt: null },
            select: { id: true },
        });

        // 2. 계정 미존재 시 → 동일한 성공 응답 (계정 존재 여부 노출 방지)
        if (!account) {
            return { success: true };
        }

        // 3. 임시 비밀번호 생성 (12자 영숫자)
        const tempPassword = crypto.randomBytes(6).toString('hex');

        // 4. 이메일 발송 (동기)
        const sent = await mailService.sendTemporaryPassword(input.email, tempPassword);

        // 5. 발송 실패 시 → 클라이언트에 알림 (재시도 유도)
        if (!sent) {
            return { success: false, emailFailed: true };
        }

        // 6. 발송 성공 시에만 DB 업데이트
        const hashedPassword = bcrypt.hashSync(tempPassword, 10);
        await database.account.update({
            where: { id: account.id },
            data: {
                password: hashedPassword,
                updatedAt: getNowKST(),
            },
        });

        return { success: true };
    }
}
