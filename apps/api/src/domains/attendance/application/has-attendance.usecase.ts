/**
 * Has Attendance UseCase
 *
 * 계정에 출석 기록이 존재하는지 확인
 */
import type { HasAttendanceOutput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

export class HasAttendanceUseCase {
    async execute(accountId: string): Promise<HasAttendanceOutput> {
        const count = await database.attendance.count({
            where: {
                student: {
                    group: {
                        accountId: BigInt(accountId),
                    },
                    deletedAt: null,
                },
                deletedAt: null,
            },
            take: 1,
        });

        return { hasAttendance: count > 0 };
    }
}
