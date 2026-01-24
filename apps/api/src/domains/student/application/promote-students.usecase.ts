/**
 * Promote Students UseCase
 *
 * TODO: 학생 데이터 이관 (추후 구현 예정)
 * 현재: 단일 계정 내 그룹 이동
 * 향후: 본당 내 계정 간 졸업생 데이터 이관 (예: 초등부 → 중고등부)
 */
import { PrismaClient, Student } from '@prisma/client';
import type { ITXClientDenyList } from '@prisma/client/runtime/library';
import type { PromoteStudentsOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';
import { logger } from '~/infrastructure/logger/logger.js';

type TransactionClient = Omit<PrismaClient, ITXClientDenyList>;

export class PromoteStudentsUseCase {
    async execute(input: { accountId: string; accountName: string }): Promise<PromoteStudentsOutput> {
        try {
            let row = 0;

            // 현재 초등부, 중고등부를 제외하면 관리자임. 관리자는 전부 진급처리가 가능하도록 하기.
            if (input.accountName === '초등부') {
                row = await this.elementaryPromotion(input.accountId);
            }
            if (input.accountName === '중고등부') {
                row = await this.middleHighPromotion();
            }

            return { row };
        } catch (e) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }

    /**
     * 초등부 진급 처리
     */
    private async elementaryPromotion(accountId: string): Promise<number> {
        const groups = await database.group.findMany({
            where: {
                accountId: BigInt(accountId),
                deletedAt: null,
            },
        });

        const targetGroup = await database.group.findFirst({
            where: {
                name: '예비 중1',
                deletedAt: null,
            },
        });

        if (!targetGroup) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'NOT_FOUND: 예비 중1 그룹을 찾을 수 없습니다.',
            });
        }

        // 그룹 이름으로 매핑
        const groupMap = new Map(groups.map((g) => [g.name, g]));
        const gradeMap: [string, string][] = [
            ['유치부', '1학년'],
            ['1학년', '2학년'],
            ['2학년', '3학년'],
            ['3학년', '4학년'],
            ['4학년', '5학년'],
            ['5학년', '6학년'],
        ];

        return await database.$transaction(async (tx) => {
            let count = 0;

            for (const group of groups) {
                const students = await tx.student.findMany({
                    where: {
                        groupId: group.id,
                        deletedAt: null,
                    },
                    orderBy: [{ age: 'asc' }, { societyName: 'asc' }],
                });
                logger.log(
                    '진급하는 초등부 학생들',
                    students.map((s) => s.societyName)
                );

                if (group.name === '6학년') {
                    // 6학년 -> 예비 중1 (중고등부로 이동)
                    count += await this.moveStudentsToGroup(students, targetGroup.id, tx);
                } else {
                    // 다른 학년은 다음 학년으로 진급
                    const nextGrade = gradeMap.find(([from]) => from === group.name)?.[1];
                    const nextGroup = nextGrade ? groupMap.get(nextGrade) : null;
                    if (nextGroup) {
                        count += await this.moveStudentsToGroup(students, nextGroup.id, tx);
                    }
                }
            }
            return count;
        });
    }

    /**
     * 중고등부 진급 처리
     */
    private async middleHighPromotion(): Promise<number> {
        const adultGroup = await database.group.findFirst({
            where: {
                name: '성인',
                deletedAt: null,
            },
        });

        const high3Group = await database.group.findFirst({
            where: {
                name: '고3',
                deletedAt: null,
            },
        });

        if (!adultGroup || !high3Group) {
            throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'NOT_FOUND: 성인 또는 고3 그룹을 찾을 수 없습니다.',
            });
        }

        // 20세 이상 -> 성인 그룹으로 이동
        const adults = await database.student.findMany({
            where: {
                age: BigInt(20),
                deletedAt: null,
            },
            orderBy: { societyName: 'asc' },
        });

        // 19세 -> 고3 그룹으로 이동
        const candidates = await database.student.findMany({
            where: {
                age: BigInt(19),
                deletedAt: null,
            },
            orderBy: { societyName: 'asc' },
        });

        logger.log(
            '성인 그룹으로 이동하는 학생들',
            adults.map((s) => s.societyName)
        );
        logger.log(
            '고3 그룹으로 이동하는 학생들',
            candidates.map((s) => s.societyName)
        );

        return await database.$transaction(async (tx) => {
            let count = 0;

            if (adults.length > 0) {
                count += await this.moveStudentsToGroup(adults, adultGroup.id, tx);
            }
            if (candidates.length > 0) {
                count += await this.moveStudentsToGroup(candidates, high3Group.id, tx);
            }
            return count;
        });
    }

    /**
     * 학생들을 새 그룹으로 이동
     */
    private async moveStudentsToGroup(students: Student[], groupId: bigint, tx: TransactionClient): Promise<number> {
        let count = 0;

        for (const student of students) {
            // 8세 이상인 학생만 진급 처리
            if (student.age && Number(student.age) >= 8) {
                await tx.student.update({
                    where: { id: student.id },
                    data: {
                        groupId,
                        updatedAt: getNowKST(),
                    },
                });
                count++;
            }
        }

        return count;
    }
}
