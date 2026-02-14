/**
 * Restore Account UseCase
 *
 * 삭제된 계정 복원 비즈니스 로직
 * 비밀번호 검증 → 2년 이내 확인 → 트랜잭션 내 cascade 복원 → JWT 발급
 */
import type { RestoreAccountInput, RestoreAccountOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { env } from '~/global/config/env.js';
import { database } from '~/infrastructure/database/database.js';

export class RestoreAccountUseCase {
    async execute(input: RestoreAccountInput): Promise<RestoreAccountOutput> {
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
                message: 'NOT_FOUND: ACCOUNT NOT_FOUND',
            });
        }

        // 2. 비밀번호 검증
        const isPasswordValid = bcrypt.compareSync(input.password, account.password);
        if (!isPasswordValid) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'UNAUTHORIZED: PW is NOT_MATCHED',
            });
        }

        // 3. 2년 이내 확인
        const twoYearsAgo = getNowKST();
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

        if (account.deletedAt! <= twoYearsAgo) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'FORBIDDEN: 복원 가능 기간(2년)이 경과했습니다',
            });
        }

        // 4. 트랜잭션 내 cascade 복원
        await database.$transaction(async (tx) => {
            // 4a. 계정 복원
            await tx.account.update({
                where: { id: account.id },
                data: { deletedAt: null },
            });

            // 4b. 그룹 복원
            const groups = await tx.group.findMany({
                where: { accountId: account.id, deletedAt: { not: null } },
                select: { id: true },
            });
            const groupIds = groups.map((g) => g.id);

            if (groupIds.length > 0) {
                await tx.group.updateMany({
                    where: { accountId: account.id, deletedAt: { not: null } },
                    data: { deletedAt: null },
                });

                // 4c. 학생 복원
                const students = await tx.student.findMany({
                    where: { groupId: { in: groupIds }, deletedAt: { not: null } },
                    select: { id: true },
                });
                const studentIds = students.map((s) => s.id);

                await tx.student.updateMany({
                    where: { groupId: { in: groupIds }, deletedAt: { not: null } },
                    data: { deletedAt: null },
                });

                // 4d. 출석 복원
                if (studentIds.length > 0) {
                    await tx.attendance.updateMany({
                        where: { studentId: { in: studentIds }, deletedAt: { not: null } },
                        data: { deletedAt: null },
                    });
                }
            }
        });

        // 5. JWT 발급
        const payload = {
            id: String(account.id),
            name: account.name,
        };
        const accessToken = jwt.sign(payload, env.jwt.secret, {
            expiresIn: env.jwt.expire.access as jwt.SignOptions['expiresIn'],
        });

        return {
            name: account.name,
            displayName: account.displayName,
            accessToken,
        };
    }
}
