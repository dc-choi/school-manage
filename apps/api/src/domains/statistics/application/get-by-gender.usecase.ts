/**
 * Get By Gender UseCase
 *
 * 성별 분포 조회 (스냅샷 기반)
 */
import type { GenderDistributionOutput, StatisticsInput as StatisticsSchemaInput } from '@school/trpc';
import {
    clampToToday,
    countSundays,
    formatDateCompact,
    getGraduationCutoff,
    getNowKST,
    getWeekRangeInMonth,
    roundToDecimal,
} from '@school/utils';
import { getBulkStudentSnapshots } from '~/domains/snapshot/snapshot.helper.js';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { accountId: string };

export class GetByGenderUseCase {
    async execute(input: StatisticsInput): Promise<GenderDistributionOutput> {
        const year = input.year ?? getNowKST().getFullYear();
        const { month, week } = input;
        const accountId = BigInt(input.accountId);

        // 1. 날짜 범위 계산
        const { startDateStr, endDateStr, totalDays } = this.getDateRange(year, month, week);

        // 2. 계정 소속 그룹 ID 조회 (deletedAt 필터 없이 전체)
        const groups = await database.group.findMany({
            where: { accountId },
            select: { id: true },
        });
        const groupIds = groups.map((g) => g.id);

        if (groupIds.length === 0) {
            return { year, male: { count: 0, rate: 0 }, female: { count: 0, rate: 0 }, unknown: { count: 0, rate: 0 } };
        }

        // 3. 그룹에 속한 전체 학생 ID 조회 (조회 기간 시작일 기준 졸업 필터 적용)
        const graduationCutoff = getGraduationCutoff(year, month, week);
        const students = await database.student.findMany({
            where: {
                groupId: { in: groupIds },
                deletedAt: null,
                OR: [{ graduatedAt: null }, { graduatedAt: { gte: graduationCutoff } }],
            },
            select: { id: true },
        });
        const uniqueStudentIds = students.map((s) => s.id);

        if (uniqueStudentIds.length === 0) {
            return { year, male: { count: 0, rate: 0 }, female: { count: 0, rate: 0 }, unknown: { count: 0, rate: 0 } };
        }

        // 4. 기간 내 출석 데이터 조회 (attendance.groupId 기반)
        const allAttendances = await database.attendance.findMany({
            where: {
                deletedAt: null,
                groupId: { in: groupIds },
                date: { gte: startDateStr, lte: endDateStr },
            },
            select: { studentId: true, content: true },
        });

        // 5. 스냅샷에서 성별 정보 조회 (폴백: Student.gender)
        const referenceDate = new Date(year, 11, 31);
        const studentSnapshots = await getBulkStudentSnapshots(uniqueStudentIds, referenceDate);

        // 스냅샷에 없는 학생은 Student 테이블에서 폴백
        const missingIds = uniqueStudentIds.filter((id) => !studentSnapshots.has(id));
        let fallbackGenders = new Map<bigint, string | null>();
        if (missingIds.length > 0) {
            const fallbackStudents = await database.student.findMany({
                where: { id: { in: missingIds } },
                select: { id: true, gender: true },
            });
            fallbackGenders = new Map(fallbackStudents.map((s) => [s.id, s.gender]));
        }

        // 6. studentId → gender 매핑
        const studentGenderMap = new Map<bigint, string | null>();
        for (const studentId of uniqueStudentIds) {
            const snapshot = studentSnapshots.get(studentId);
            studentGenderMap.set(studentId, snapshot?.gender ?? fallbackGenders.get(studentId) ?? null);
        }

        // 7. 성별별 출석률 계산
        const genderGroups = { M: new Set<bigint>(), F: new Set<bigint>(), unknown: new Set<bigint>() };
        for (const [studentId, gender] of studentGenderMap) {
            if (gender === 'M') genderGroups.M.add(studentId);
            else if (gender === 'F') genderGroups.F.add(studentId);
            else genderGroups.unknown.add(studentId);
        }

        const calcRate = (studentIds: Set<bigint>): { count: number; rate: number } => {
            const count = studentIds.size;
            if (count === 0 || totalDays === 0) return { count, rate: 0 };

            const presentCount = allAttendances.filter(
                (a) => studentIds.has(a.studentId) && a.content && ['◎', '○', '△'].includes(a.content)
            ).length;

            const expected = count * totalDays;
            const rate = expected > 0 ? (presentCount / expected) * 100 : 0;
            return { count, rate: roundToDecimal(rate, 1) };
        };

        return {
            year,
            male: calcRate(genderGroups.M),
            female: calcRate(genderGroups.F),
            unknown: calcRate(genderGroups.unknown),
        };
    }

    /**
     * 날짜 범위 계산
     */
    private getDateRange(
        year: number,
        month?: number,
        week?: number
    ): { startDateStr: string; endDateStr: string; totalDays: number } {
        if (month && week) {
            const { startDate, endDate } = getWeekRangeInMonth(year, month, week);
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
                totalDays: countSundays(startDate, endDate),
            };
        }

        if (month) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = clampToToday(new Date(year, month, 0));
            return {
                startDateStr: formatDateCompact(startDate),
                endDateStr: formatDateCompact(endDate),
                totalDays: countSundays(startDate, endDate),
            };
        }

        const startDate = new Date(year, 0, 1);
        const endDate = clampToToday(new Date(year, 11, 31));
        return {
            startDateStr: formatDateCompact(startDate),
            endDateStr: formatDateCompact(endDate),
            totalDays: countSundays(startDate, endDate),
        };
    }
}
