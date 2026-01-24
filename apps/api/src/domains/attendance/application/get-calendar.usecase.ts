/**
 * Get Calendar UseCase
 *
 * 월별 달력 데이터 조회 (출석 현황 + 의무축일)
 */
import type { CalendarDay, GetCalendarInput, GetCalendarOutput } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import { GetHolydaysUseCase } from '~/domains/liturgical/application/get-holydays.usecase.js';
import { database } from '~/infrastructure/database/database.js';

type GetCalendarUseCaseInput = GetCalendarInput & { accountId: string };

export class GetCalendarUseCase {
    async execute(input: GetCalendarUseCaseInput): Promise<GetCalendarOutput> {
        const { year, month, groupId, accountId } = input;

        // 1. 권한 검증: accountId가 groupId를 소유하는지 확인
        const group = await database.group.findFirst({
            where: {
                id: BigInt(groupId),
                accountId: BigInt(accountId),
                deletedAt: null,
            },
        });

        if (!group) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'FORBIDDEN: GROUP NOT_FOUND OR NOT_OWNED',
            });
        }

        // 2. 해당 월의 날짜 목록 생성
        const days = this.generateMonthDays(year, month);

        // 3. 의무축일 목록 조회
        const holydaysUseCase = new GetHolydaysUseCase();
        const holydaysResult = await holydaysUseCase.execute({ year });
        const holydayMap = new Map(holydaysResult.holydays.map((h) => [h.date, h.name]));

        // 4. 그룹의 전체 학생 수 조회
        const totalStudents = await database.student.count({
            where: {
                groupId: BigInt(groupId),
                deletedAt: null,
            },
        });

        // 5. 해당 월의 출석 데이터 조회
        const startDate = `${year}${String(month).padStart(2, '0')}01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}${String(month).padStart(2, '0')}${String(lastDay).padStart(2, '0')}`;

        const attendanceData = await this.getMonthlyAttendance(groupId, startDate, endDate);

        // 6. 날짜별 데이터 조합
        const calendarDays: CalendarDay[] = days.map((day) => ({
            date: day.date,
            dayOfWeek: day.dayOfWeek,
            attendance: {
                present: attendanceData.get(day.date) ?? 0,
                total: totalStudents,
            },
            holyday: holydayMap.get(day.date) ?? null,
        }));

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
     * 날짜별 출석 인원 수 (미사 OR 교리 참석)
     */
    private async getMonthlyAttendance(
        groupId: string,
        startDate: string,
        endDate: string
    ): Promise<Map<string, number>> {
        // 그룹에 속한 학생 ID 조회
        const students = await database.student.findMany({
            where: {
                groupId: BigInt(groupId),
                deletedAt: null,
            },
            select: { id: true },
        });
        const studentIds = students.map((s) => s.id);

        if (studentIds.length === 0) {
            return new Map();
        }

        // 출석 데이터 조회 (◎, ○, △ 인 경우 출석으로 간주)
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
            },
        });

        // 날짜별 출석 인원 집계
        const attendanceMap = new Map<string, Set<bigint>>();
        for (const a of attendances) {
            if (a.date) {
                // DB 형식(YYYYMMDD)을 표준 형식(YYYY-MM-DD)으로 변환
                const formattedDate = `${a.date.slice(0, 4)}-${a.date.slice(4, 6)}-${a.date.slice(6, 8)}`;
                if (!attendanceMap.has(formattedDate)) {
                    attendanceMap.set(formattedDate, new Set());
                }
                attendanceMap.get(formattedDate)!.add(a.studentId);
            }
        }

        // Set 크기를 count로 변환
        const result = new Map<string, number>();
        for (const [date, studentSet] of attendanceMap) {
            result.set(date, studentSet.size);
        }

        return result;
    }
}
