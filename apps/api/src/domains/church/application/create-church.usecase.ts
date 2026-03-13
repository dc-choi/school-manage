/**
 * Create Church UseCase
 *
 * 새 본당 생성
 */
import type { CreateChurchInput, CreateChurchOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

export class CreateChurchUseCase {
    async execute(input: CreateChurchInput): Promise<CreateChurchOutput> {
        const church = await database.church.create({
            data: {
                name: input.name,
                parishId: BigInt(input.parishId),
                createdAt: getNowKST(),
            },
        });

        return {
            id: String(church.id),
            name: church.name,
            parishId: String(church.parishId),
        };
    }
}
