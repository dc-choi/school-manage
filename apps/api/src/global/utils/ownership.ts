/**
 * 소유권 검증 유틸리티
 *
 * IDOR(Insecure Direct Object Reference) 방지를 위한 공통 검증 함수.
 * 리소스가 요청자의 조직에 속하는지 검증하고, 미소속 시 FORBIDDEN 에러를 throw한다.
 */
import { TRPCError } from '@trpc/server';
import { database } from '~/infrastructure/database/database.js';

/**
 * 복수 그룹 소유권 검증
 *
 * 모든 groupIds가 해당 조직 소속인지 검증한다.
 * 하나라도 미소속이면 FORBIDDEN을 throw한다.
 */
export const assertGroupIdsOwnership = async (groupIds: string[], organizationId: string): Promise<void> => {
    const uniqueIds = [...new Set(groupIds)];
    if (uniqueIds.length === 0) return;
    const validCount = await database.group.count({
        where: {
            id: { in: uniqueIds.map((id) => BigInt(id)) },
            organizationId: BigInt(organizationId),
            deletedAt: null,
        },
    });
    if (validCount !== uniqueIds.length) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: '접근 권한이 없는 그룹입니다.',
        });
    }
};

/**
 * 복수 학생 소유권 검증
 *
 * 모든 studentIds가 해당 조직 소속인지 검증한다.
 * 하나라도 미소속이면 FORBIDDEN을 throw한다.
 */
export const assertStudentIdsOwnership = async (studentIds: string[], organizationId: string): Promise<void> => {
    const uniqueIds = [...new Set(studentIds)];
    if (uniqueIds.length === 0) return;
    const validCount = await database.student.count({
        where: {
            id: { in: uniqueIds.map((id) => BigInt(id)) },
            organizationId: BigInt(organizationId),
            deletedAt: null,
        },
    });
    if (validCount !== uniqueIds.length) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: '접근 권한이 없는 학생입니다.',
        });
    }
};
