/**
 * Snapshot Helper Functions
 *
 * 스냅샷 생성/조회 헬퍼. 각 도메인 UseCase 내부에서 호출한다.
 */
import type { PrismaClient } from '@prisma/client';
import type { ITXClientDenyList } from '@prisma/client/runtime/library';
import { getNowKST } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

type TransactionClient = Omit<PrismaClient, ITXClientDenyList>;

// --- 생성 함수 (트랜잭션 내에서 호출) ---

interface CreateStudentSnapshotInput {
    studentId: bigint;
    societyName: string;
    catholicName: string | null;
    gender: string | null;
    contact: bigint | null;
    description: string | null;
    baptizedAt: string | null;
    groupId: bigint;
}

export const createStudentSnapshot = async (
    tx: TransactionClient,
    input: CreateStudentSnapshotInput
): Promise<void> => {
    await tx.studentSnapshot.create({
        data: {
            studentId: input.studentId,
            societyName: input.societyName,
            catholicName: input.catholicName,
            gender: input.gender,
            contact: input.contact,
            description: input.description,
            baptizedAt: input.baptizedAt,
            groupId: input.groupId,
            snapshotAt: getNowKST(),
        },
    });
};

interface CreateGroupSnapshotInput {
    groupId: bigint;
    name: string;
}

export const createGroupSnapshot = async (tx: TransactionClient, input: CreateGroupSnapshotInput): Promise<void> => {
    await tx.groupSnapshot.create({
        data: {
            groupId: input.groupId,
            name: input.name,
            snapshotAt: getNowKST(),
        },
    });
};

// --- 조회 함수 (읽기 전용, database 직접 사용) ---

interface StudentSnapshotData {
    societyName: string;
    catholicName: string | null;
    gender: string | null;
    contact: bigint | null;
    description: string | null;
    baptizedAt: string | null;
    groupId: bigint;
}

interface GroupSnapshotData {
    name: string;
}

export const getBulkStudentSnapshots = async (
    studentIds: bigint[],
    referenceDate: Date
): Promise<Map<bigint, StudentSnapshotData>> => {
    if (studentIds.length === 0) return new Map();

    const allSnapshots = await database.studentSnapshot.findMany({
        where: {
            studentId: { in: studentIds },
            snapshotAt: { lte: referenceDate },
        },
        orderBy: { snapshotAt: 'desc' },
    });

    // 각 studentId별 가장 최근 스냅샷만 취득
    const map = new Map<bigint, StudentSnapshotData>();
    for (const snap of allSnapshots) {
        if (!map.has(snap.studentId)) {
            map.set(snap.studentId, {
                societyName: snap.societyName,
                catholicName: snap.catholicName,
                gender: snap.gender,
                contact: snap.contact,
                description: snap.description,
                baptizedAt: snap.baptizedAt,
                groupId: snap.groupId,
            });
        }
    }
    return map;
};

export const getBulkGroupSnapshots = async (
    groupIds: bigint[],
    referenceDate: Date
): Promise<Map<bigint, GroupSnapshotData>> => {
    if (groupIds.length === 0) return new Map();

    const allSnapshots = await database.groupSnapshot.findMany({
        where: {
            groupId: { in: groupIds },
            snapshotAt: { lte: referenceDate },
        },
        orderBy: { snapshotAt: 'desc' },
    });

    const map = new Map<bigint, GroupSnapshotData>();
    for (const snap of allSnapshots) {
        if (!map.has(snap.groupId)) {
            map.set(snap.groupId, {
                name: snap.name,
            });
        }
    }
    return map;
};
