/**
 * Create Church UseCase
 *
 * 새 본당 생성
 */
import { Prisma } from '@prisma/client';
import type { CreateChurchInput, CreateChurchOutput } from '@school/shared';
import { getNowKST, normalizeChurchName } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';
import { logger } from '~/infrastructure/logger/logger.js';

const DUPLICATE_NAME_MESSAGE = '이미 존재하는 본당명입니다.';

export class CreateChurchUseCase {
    async execute(input: CreateChurchInput): Promise<CreateChurchOutput> {
        const normalizedName = normalizeChurchName(input.name);

        if (normalizedName.length === 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: '본당명을 입력해주세요.',
            });
        }

        const church = await database.$transaction(async (tx) => {
            const existingChurch = await tx.church.findFirst({
                where: {
                    parishId: BigInt(input.parishId),
                    normalizedName,
                    deletedAt: null,
                },
            });

            if (existingChurch) {
                throw new TRPCError({
                    code: 'CONFLICT',
                    message: DUPLICATE_NAME_MESSAGE,
                });
            }

            try {
                return await tx.church.create({
                    data: {
                        name: input.name,
                        normalizedName,
                        parishId: BigInt(input.parishId),
                        createdAt: getNowKST(),
                    },
                });
            } catch (e) {
                // DB UNIQUE 제약으로 동시 생성 요청 충돌 차단
                if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                    logger.log('[create-church] normalized name collision on DB unique', {
                        parishId: input.parishId,
                        normalizedName,
                    });
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: DUPLICATE_NAME_MESSAGE,
                    });
                }
                throw e;
            }
        });

        return {
            id: String(church.id),
            name: church.name,
            parishId: String(church.parishId),
        };
    }
}
