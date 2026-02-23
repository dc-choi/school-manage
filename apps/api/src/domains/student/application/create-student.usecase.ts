/**
 * Create Student UseCase
 *
 * 새 학생 생성
 */
import type { CreateStudentInput, CreateStudentOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

export class CreateStudentUseCase {
    async execute(input: CreateStudentInput, accountId: string): Promise<CreateStudentOutput> {
        try {
            // 측정 인프라: 계정의 첫 학생인지 확인
            const existingStudentCount = await database.student.count({
                where: {
                    group: {
                        accountId: BigInt(accountId),
                    },
                    deletedAt: null,
                },
            });
            const isFirstStudent = existingStudentCount === 0;

            // 측정 인프라: 가입 후 경과일 계산
            let daysSinceSignup: number | undefined;
            if (isFirstStudent) {
                const account = await database.account.findUnique({
                    where: { id: BigInt(accountId) },
                    select: { createdAt: true },
                });
                if (account?.createdAt) {
                    const now = getNowKST();
                    const diffMs = now.getTime() - account.createdAt.getTime();
                    daysSinceSignup = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }
            }

            const student = await database.$transaction(async (tx) => {
                const created = await tx.student.create({
                    data: {
                        societyName: input.societyName,
                        catholicName: input.catholicName,
                        gender: input.gender,
                        age: input.age ? BigInt(input.age) : null,
                        contact: input.contact ? BigInt(input.contact) : null,
                        description: input.description,
                        groupId: BigInt(input.groupId),
                        baptizedAt: input.baptizedAt,
                        createdAt: getNowKST(),
                    },
                });
                await createStudentSnapshot(tx, {
                    studentId: created.id,
                    societyName: created.societyName,
                    catholicName: created.catholicName,
                    gender: created.gender,
                    groupId: created.groupId,
                });
                return created;
            });

            return {
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                gender: student.gender ?? undefined,
                age: student.age != null ? Number(student.age) : undefined,
                contact: student.contact != null ? Number(student.contact) : undefined,
                description: student.description ?? undefined,
                groupId: String(student.groupId),
                baptizedAt: student.baptizedAt ?? undefined,
                // 측정 인프라용 필드
                isFirstStudent,
                daysSinceSignup,
            };
        } catch (e) {
            console.error('[CreateStudentUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 등록에 실패했습니다.',
            });
        }
    }
}
