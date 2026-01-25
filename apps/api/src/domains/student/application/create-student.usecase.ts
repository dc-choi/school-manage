/**
 * Create Student UseCase
 *
 * 새 학생 생성
 */
import type { CreateStudentInput, CreateStudentOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class CreateStudentUseCase {
    async execute(input: CreateStudentInput): Promise<CreateStudentOutput> {
        try {
            const student = await database.student.create({
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
            };
        } catch (e) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }
}
