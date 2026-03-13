/**
 * Delete Account UseCase
 *
 * 계정 삭제 비즈니스 로직
 * 비밀번호 검증 → 트랜잭션 내 cascade 소프트 삭제 (출석→학생→그룹→계정)
 */
import { type DeleteAccountInput, type DeleteAccountOutput, ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import bcrypt from 'bcrypt';
import { database } from '~/infrastructure/database/database.js';

export class DeleteAccountUseCase {
    async execute(input: DeleteAccountInput, accountId: string, role?: string): Promise<DeleteAccountOutput> {
        // 0. 관리자 계정 삭제 차단
        if (role === ROLE.ADMIN) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: '관리자 계정은 삭제할 수 없습니다.',
            });
        }

        // 1. 계정 조회 (비밀번호 포함)
        const account = await database.account.findFirst({
            where: { id: BigInt(accountId), deletedAt: null },
            select: { id: true, password: true },
        });

        if (!account) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: '계정을 찾을 수 없습니다.',
            });
        }

        // 2. 비밀번호 검증
        const isValid = bcrypt.compareSync(input.password, account.password);
        if (!isValid) {
            throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: '비밀번호가 일치하지 않습니다.',
            });
        }

        // 3. 트랜잭션 내 cascade 소프트 삭제
        const now = getNowKST();

        await database.$transaction(async (tx) => {
            // 3a. 해당 계정의 그룹 ID 목록 조회
            const groups = await tx.group.findMany({
                where: { accountId: account.id, deletedAt: null },
                select: { id: true },
            });
            const groupIds = groups.map((g) => g.id);

            if (groupIds.length > 0) {
                // 3b. 해당 그룹들의 학생 ID 목록 조회 (StudentGroup 기반)
                const studentGroupRecords = await tx.studentGroup.findMany({
                    where: { groupId: { in: groupIds } },
                    select: { studentId: true },
                });
                const studentIds = [...new Set(studentGroupRecords.map((sg) => sg.studentId))];

                // 3c. 출석 소프트 삭제
                if (studentIds.length > 0) {
                    await tx.attendance.updateMany({
                        where: { studentId: { in: studentIds }, deletedAt: null },
                        data: { deletedAt: now },
                    });
                }

                // 3d. 학생 소프트 삭제
                if (studentIds.length > 0) {
                    await tx.student.updateMany({
                        where: { id: { in: studentIds }, deletedAt: null },
                        data: { deletedAt: now },
                    });
                }
            }

            // 3e. 그룹 소프트 삭제
            await tx.group.updateMany({
                where: { accountId: account.id, deletedAt: null },
                data: { deletedAt: now },
            });

            // 3f. 계정 소프트 삭제 + 조직 연결 해제
            await tx.account.update({
                where: { id: account.id },
                data: { deletedAt: now, organizationId: null },
            });

            // 3g. 모든 Refresh Token 삭제 (강제 로그아웃)
            await tx.refreshToken.deleteMany({
                where: { accountId: account.id },
            });
        });

        return { success: true };
    }
}
