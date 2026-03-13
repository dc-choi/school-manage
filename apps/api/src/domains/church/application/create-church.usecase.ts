/**
 * Create Church UseCase
 *
 * 새 본당 생성
 */
import type { CreateChurchInput, CreateChurchOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

export class CreateChurchUseCase {
    async execute(input: CreateChurchInput): Promise<CreateChurchOutput> {
        const church = await database.$transaction(async (tx) => {
            const existingChurch = await tx.church.findFirst({
                where: {
                    name: input.name,
                    parishId: BigInt(input.parishId),
                    deletedAt: null,
                },
            });

            if (existingChurch) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: '이미 존재하는 본당명입니다.',
                });
            }

            return tx.church.create({
                data: {
                    name: input.name,
                    parishId: BigInt(input.parishId),
                    createdAt: getNowKST(),
                },
            });
        });

        return {
            id: String(church.id),
            name: church.name,
            parishId: String(church.parishId),
        };
    }
}
