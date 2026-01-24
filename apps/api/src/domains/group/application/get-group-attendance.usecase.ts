/**
 * Get Group Attendance UseCase
 *
 * 그룹별 출석 데이터 조회
 */
import type { GetGroupAttendanceInput, GetGroupAttendanceOutput } from '@school/trpc';
import { getYearDate } from '~/global/utils/utils.js';
import { database } from '~/infrastructure/database/database.js';

export class GetGroupAttendanceUseCase {
    async execute(input: GetGroupAttendanceInput): Promise<GetGroupAttendanceOutput> {
        // year가 없으면 현재 연도 사용
        const year = input.year ?? new Date().getFullYear();

        // 해당 연도의 토/일 날짜 계산
        const { saturday, sunday } = await getYearDate(year);

        // 그룹에 속한 학생들 조회
        const students = await database.student.findMany({
            where: {
                groupId: BigInt(input.groupId),
                deletedAt: null,
            },
            orderBy: [{ age: 'asc' }, { societyName: 'asc' }],
        });
        const studentIds = students.map((s) => s.id);

        // 학생들의 출석 데이터 조회
        const attendances = await database.attendance.findMany({
            where: {
                studentId: { in: studentIds },
                deletedAt: null,
            },
        });

        return {
            year,
            sunday,
            saturday,
            students: students.map((s) => ({
                id: String(s.id),
                societyName: s.societyName,
                catholicName: s.catholicName ?? undefined,
                age: s.age != null ? Number(s.age) : undefined,
                contact: s.contact != null ? Number(s.contact) : undefined,
                description: s.description ?? undefined,
                groupId: String(s.groupId),
                baptizedAt: s.baptizedAt ?? undefined,
            })),
            attendances: attendances.map((a) => ({
                id: String(a.id),
                studentId: String(a.studentId),
                date: a.date ?? '',
                content: a.content ?? '',
            })),
        };
    }
}
