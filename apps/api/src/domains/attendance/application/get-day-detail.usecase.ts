/**
 * Get Day Detail UseCase
 *
 * 특정 날짜의 학생별 출석 상세 조회
 */
import type { GetDayDetailInput, GetDayDetailOutput, StudentAttendanceDetail } from '@school/shared';
import { TRPCError } from '@trpc/server';
import { GetHolydaysUseCase } from '~/domains/liturgical/application/get-holydays.usecase.js';
import { database } from '~/infrastructure/database/database.js';

type GetDayDetailUseCaseInput = GetDayDetailInput & { organizationId: string };

export class GetDayDetailUseCase {
    async execute(input: GetDayDetailUseCaseInput): Promise<GetDayDetailOutput> {
        const { groupId, date, organizationId } = input;

        // 1. 권한 검증: organizationId가 groupId를 소유하는지 확인
        const group = await database.group.findFirst({
            where: {
                id: BigInt(groupId),
                organizationId: BigInt(organizationId),
                deletedAt: null,
            },
        });

        if (!group) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: '접근 권한이 없는 학년입니다.',
            });
        }

        // 2. 날짜에서 연도 추출하여 의무축일 확인
        const year = Number.parseInt(date.substring(0, 4), 10);
        const holydaysUseCase = new GetHolydaysUseCase();
        const holydaysResult = await holydaysUseCase.execute({ year });
        const holyday = holydaysResult.holydays.find((h) => h.date === date)?.name ?? null;

        // 3. 그룹의 모든 학생 조회 (졸업생 제외, StudentGroup 기반)
        const studentGroupRecords = await database.studentGroup.findMany({
            where: {
                groupId: BigInt(groupId),
                student: {
                    deletedAt: null,
                    graduatedAt: null,
                },
            },
            include: {
                student: {
                    select: {
                        id: true,
                        societyName: true,
                        catholicName: true,
                    },
                },
            },
            orderBy: {
                student: { societyName: 'asc' },
            },
        });
        const students = studentGroupRecords.map((sg) => sg.student);

        // 4. 해당 날짜의 출석 데이터 조회
        // 입력 형식(YYYY-MM-DD)을 DB 형식(YYYYMMDD)으로 변환
        const dbDate = date.replaceAll('-', '');
        const studentIds = students.map((s) => s.id);
        const attendances = await database.attendance.findMany({
            where: {
                studentId: { in: studentIds },
                date: dbDate,
                deletedAt: null,
            },
            select: {
                studentId: true,
                content: true,
            },
        });

        // 5. 출석 데이터를 Map으로 변환
        const attendanceMap = new Map<string, string>();
        for (const a of attendances) {
            attendanceMap.set(String(a.studentId), a.content ?? '');
        }

        // 6. 학생별 출석 상태 조합
        const studentDetails: StudentAttendanceDetail[] = students.map((student) => ({
            id: String(student.id),
            societyName: student.societyName ?? '',
            catholicName: student.catholicName ?? undefined,
            content: attendanceMap.get(String(student.id)) ?? '',
        }));

        return {
            date,
            holyday,
            students: studentDetails,
        };
    }
}
