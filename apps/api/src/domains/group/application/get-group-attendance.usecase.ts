/**
 * Get Group Attendance UseCase
 *
 * 그룹별 출석 데이터 조회
 */
import type { GetGroupAttendanceInput, GetGroupAttendanceOutput } from '@school/shared';
import { TRPCError } from '@trpc/server';
import { getYearDate } from '~/global/utils/utils.js';
import { database } from '~/infrastructure/database/database.js';

export class GetGroupAttendanceUseCase {
    async execute(input: GetGroupAttendanceInput, organizationId: string): Promise<GetGroupAttendanceOutput> {
        // 권한 검증: 그룹이 해당 조직 소속인지 확인
        const group = await database.group.findFirst({
            where: { id: BigInt(input.groupId), organizationId: BigInt(organizationId), deletedAt: null },
        });
        if (!group) {
            throw new TRPCError({ code: 'FORBIDDEN', message: '해당 그룹에 대한 접근 권한이 없습니다.' });
        }

        // year가 없으면 현재 연도 사용
        const year = input.year ?? new Date().getFullYear();

        // 해당 연도의 토/일 날짜 계산
        const { saturday, sunday } = await getYearDate(year);

        // 그룹에 속한 학생들 조회 (졸업생 제외) — StudentGroup 기반
        const studentGroupRecords = await database.studentGroup.findMany({
            where: {
                groupId: BigInt(input.groupId),
                student: {
                    deletedAt: null,
                    graduatedAt: null,
                },
            },
            include: {
                student: true,
            },
            orderBy: { student: { age: 'asc' } },
        });
        const studentIds = studentGroupRecords.map((sg) => sg.student.id);

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
            students: studentGroupRecords.map((sg) => ({
                id: String(sg.student.id),
                societyName: sg.student.societyName,
                catholicName: sg.student.catholicName ?? undefined,
                age: sg.student.age != null ? Number(sg.student.age) : undefined,
                contact: sg.student.contact ?? undefined,
                description: sg.student.description ?? undefined,
                groups: [{ id: String(group.id), name: group.name, type: group.type }],
                baptizedAt: sg.student.baptizedAt ?? undefined,
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
