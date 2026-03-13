/**
 * Has Attendance UseCase
 *
 * 조직에 출석 기록이 존재하는지 확인
 */
import type { HasAttendanceOutput } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

export class HasAttendanceUseCase {
    async execute(organizationId: string): Promise<HasAttendanceOutput> {
        const count = await database.attendance.count({
            where: {
                student: {
                    organizationId: BigInt(organizationId),
                    deletedAt: null,
                },
                deletedAt: null,
            },
            take: 1,
        });

        return { hasAttendance: count > 0 };
    }
}
