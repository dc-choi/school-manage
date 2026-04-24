/**
 * Snapshot Helper Functions
 *
 * 스냅샷 생성/조회 헬퍼. 각 도메인 UseCase 내부에서 호출한다.
 */
import { getNowKST } from '@school/utils';
import { type TransactionClient, database } from '~/infrastructure/database/database.js';

// --- 생성 함수 (트랜잭션 내에서 호출) ---

interface CreateStudentSnapshotInput {
    studentId: bigint;
    societyName: string;
    catholicName: string | null;
    gender: string | null;
    contact: bigint | null;
    parentContact: string | null;
    description: string | null;
    baptizedAt: string | null;
    groupId: bigint | null;
    organizationId?: bigint | null;
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
            parentContact: input.parentContact,
            description: input.description,
            baptizedAt: input.baptizedAt,
            groupId: input.groupId ?? 0n,
            organizationId: input.organizationId ?? null,
            snapshotAt: getNowKST(),
        },
    });
};

export const createBulkStudentSnapshots = async (
    tx: TransactionClient,
    inputs: CreateStudentSnapshotInput[]
): Promise<void> => {
    if (inputs.length === 0) return;

    const snapshotAt = getNowKST();
    await tx.studentSnapshot.createMany({
        data: inputs.map((input) => ({
            studentId: input.studentId,
            societyName: input.societyName,
            catholicName: input.catholicName,
            gender: input.gender,
            contact: input.contact,
            parentContact: input.parentContact,
            description: input.description,
            baptizedAt: input.baptizedAt,
            groupId: input.groupId ?? 0n,
            organizationId: input.organizationId ?? null,
            snapshotAt,
        })),
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

interface CreateAccountSnapshotInput {
    accountId: bigint;
    name: string;
    displayName: string;
    organizationId: bigint;
}

export const createAccountSnapshot = async (
    tx: TransactionClient,
    input: CreateAccountSnapshotInput
): Promise<void> => {
    await tx.accountSnapshot.create({
        data: {
            accountId: input.accountId,
            name: input.name,
            displayName: input.displayName,
            organizationId: input.organizationId,
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
    parentContact: string | null;
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
                parentContact: snap.parentContact,
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
