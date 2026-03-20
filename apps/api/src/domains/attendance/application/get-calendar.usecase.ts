/**
 * Get Calendar UseCase
 *
 * 월별 달력 데이터 조회 (출석 현황 + 의무축일)
 */
import type { CalendarDay, GetCalendarInput, GetCalendarOutput } from '@school/shared';
import { TRPCError } from '@trpc/server';
import { GetHolydaysUseCase } from '~/domains/liturgical/application/get-holydays.usecase.js';
import { database } from '~/infrastructure/database/database.js';

type GetCalendarUseCaseInput = GetCalendarInput & { organizationId: string };

export class GetCalendarUseCase {
    async execute(input: GetCalendarUseCaseInput): Promise<GetCalendarOutput> {
        const { year, month, groupId, organizationId } = input;

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

        // 2. 해당 월의 날짜 목록 생성
        const days = this.generateMonthDays(year, month);

        // 3. 의무축일 목록 조회
        const holydaysUseCase = new GetHolydaysUseCase();
        const holydaysResult = await holydaysUseCase.execute({ year });
        const holydayMap = new Map<string, string>();
        for (const h of holydaysResult.holydays) {
            const existing = holydayMap.get(h.date);
            holydayMap.set(h.date, existing ? `${existing} / ${h.name}` : h.name);
        }

        // 4. 그룹의 전체 학생 수 조회 (졸업생 제외, StudentGroup 기반)
        const totalStudents = await database.studentGroup.count({
            where: {
                groupId: BigInt(groupId),
                student: {
                    deletedAt: null,
                    graduatedAt: null,
                },
            },
        });

        // 5. 해당 월의 출석 데이터 조회
        const startDate = `${year}${String(month).padStart(2, '0')}01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;

        const attendanceData = await this.getMonthlyAttendance(groupId, startDate, endDate);

        // 6. 날짜별 데이터 조합
        const defaultAttendance = { present: 0, massPresent: 0, catechismPresent: 0 };
        const calendarDays: CalendarDay[] = days.map((day) => {
            const data = attendanceData.get(day.date) ?? defaultAttendance;
            return {
                date: day.date,
                dayOfWeek: day.dayOfWeek,
                attendance: {
                    ...data,
                    total: totalStudents,
                },
                holyday: holydayMap.get(day.date) ?? null,
            };
        });

        return {
            year,
            month,
            totalStudents,
            days: calendarDays,
        };
    }

    /**
     * 월별 날짜 목록 생성
     */
    private generateMonthDays(year: number, month: number): { date: string; dayOfWeek: number }[] {
        const days: { date: string; dayOfWeek: number }[] = [];
        const daysInMonth = new Date(year, month, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.push({
                date: dateStr,
                dayOfWeek: date.getDay(),
            });
        }

        return days;
    }

    /**
     * 월별 출석 데이터 조회
     * 날짜별 출석 인원 수 (전체/미사/교리 분리 집계)
     */
    private async getMonthlyAttendance(
        groupId: string,
        startDate: string,
        endDate: string
    ): Promise<Map<string, { present: number; massPresent: number; catechismPresent: number }>> {
        // 그룹에 속한 학생 ID 조회 (졸업생 제외, StudentGroup 기반)
        const studentGroupRecords = await database.studentGroup.findMany({
            where: {
                groupId: BigInt(groupId),
                student: {
                    deletedAt: null,
                    graduatedAt: null,
                },
            },
            select: { studentId: true },
        });
        const studentIds = studentGroupRecords.map((sg) => sg.studentId);

        if (studentIds.length === 0) {
            return new Map();
        }

        // 출석 데이터 조회 (content 포함)
        // content: ◎ = 미사+교리, ○ = 미사만, △ = 교리만
        const attendances = await database.attendance.findMany({
            where: {
                studentId: { in: studentIds },
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                date: true,
                studentId: true,
                content: true,
            },
        });

        // 날짜별 미사/교리 분리 집계
        const attendanceMap = new Map<string, { present: Set<bigint>; mass: Set<bigint>; catechism: Set<bigint> }>();
        for (const a of attendances) {
            if (!a.date) continue;

            const formattedDate = `${a.date.slice(0, 4)}-${a.date.slice(4, 6)}-${a.date.slice(6, 8)}`;
            if (!attendanceMap.has(formattedDate)) {
                attendanceMap.set(formattedDate, {
                    present: new Set(),
                    mass: new Set(),
                    catechism: new Set(),
                });
            }
            const sets = attendanceMap.get(formattedDate)!;

            sets.present.add(a.studentId);

            // ◎(미사+교리), ○(미사만) → 미사 참석
            if (a.content === '◎' || a.content === '○') {
                sets.mass.add(a.studentId);
            }
            // ◎(미사+교리), △(교리만) → 교리 참석
            if (a.content === '◎' || a.content === '△') {
                sets.catechism.add(a.studentId);
            }
        }

        // Set 크기를 count로 변환
        const result = new Map<string, { present: number; massPresent: number; catechismPresent: number }>();
        for (const [date, sets] of attendanceMap) {
            result.set(date, {
                present: sets.present.size,
                massPresent: sets.mass.size,
                catechismPresent: sets.catechism.size,
            });
        }

        return result;
    }
}
