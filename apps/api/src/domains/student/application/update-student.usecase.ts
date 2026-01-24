/**
 * Update Student UseCase
 *
 * 학생 정보 수정
 */
import type { UpdateStudentInput, UpdateStudentOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { getNowKST } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

export class UpdateStudentUseCase {
    async execute(input: UpdateStudentInput): Promise<UpdateStudentOutput> {
        try {
            const student = await database.student.update({
                where: {
                    id: BigInt(input.id),
                },
                data: {
                    societyName: input.societyName,
                    catholicName: input.catholicName,
                    age: input.age ? BigInt(input.age) : null,
                    contact: input.contact ? BigInt(input.contact) : null,
                    description: input.description,
                    groupId: BigInt(input.groupId),
                    baptizedAt: input.baptizedAt,
                    updatedAt: getNowKST(),
                },
            });

            return {
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                age: student.age != null ? Number(student.age) : undefined,
                contact: student.contact != null ? Number(student.contact) : undefined,
                description: student.description ?? undefined,
                groupId: String(student.groupId),
                baptizedAt: student.baptizedAt ?? undefined,
            };
        } catch (e) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }
}
