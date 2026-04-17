/**
 * Get By Gender UseCase
 *
 * 성별 분포 조회 (스냅샷 기반)
 */
import type { GenderDistributionOutput, StatisticsInput as StatisticsSchemaInput } from '@school/shared';
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
import { PRESENT_COUNT_SQL } from '~/domains/statistics/statistics.helper.js';
import { database } from '~/infrastructure/database/database.js';

type StatisticsInput = StatisticsSchemaInput & { organizationId: string };

export class GetByGenderUseCase {
    async execute(input: StatisticsInput): Promise<GenderDistributionOutput> {
        const year = input.year ?? getNowKST().getFullYear();
        const { month, week } = input;
        const organizationId = BigInt(input.organizationId);

        // 1. 날짜 범위 계산
        const { startDateStr, endDateStr, totalDays } = this.getDateRange(year, month, week);

        // 2. 계정 소속 그룹 ID 조회 (deletedAt 필터 없이 전체)
        const groups = await database.group.findMany({
            where: { organizationId },
            select: { id: true },
        });
        const groupIds = groups.map((g) => g.id);

        if (groupIds.length === 0) {
            return { year, male: { count: 0, rate: 0 }, female: { count: 0, rate: 0 }, unknown: { count: 0, rate: 0 } };
        }

        // 3. 조직에 속한 전체 학생 ID 조회 (조회 기간 시작일 기준 졸업 필터 적용)
        const graduationCutoff = getGraduationCutoff(year, month, week);
        const students = await database.student.findMany({
            where: {
                organizationId,
                deletedAt: null,
                OR: [{ graduatedAt: null }, { graduatedAt: { gte: graduationCutoff } }],
            },
            select: { id: true },
        });
        const uniqueStudentIds = students.map((s) => s.id);

        if (uniqueStudentIds.length === 0) {
            return { year, male: { count: 0, rate: 0 }, female: { count: 0, rate: 0 }, unknown: { count: 0, rate: 0 } };
        }

        // 4. 스냅샷에서 성별 정보 조회 (폴백: Student.gender)
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

        // 5. 성별별 학생 ID 분류 (스냅샷 우선, 폴백 적용)
        const genderGroups = { M: new Set<bigint>(), F: new Set<bigint>(), unknown: new Set<bigint>() };
        for (const studentId of uniqueStudentIds) {
            const gender = studentSnapshots.get(studentId)?.gender ?? fallbackGenders.get(studentId) ?? null;
            if (gender === 'M') genderGroups.M.add(studentId);
            else if (gender === 'F') genderGroups.F.add(studentId);
            else genderGroups.unknown.add(studentId);
        }

        // 6. 성별별 출석률 계산 — 성별별 SUM(CASE) 1회씩, 병렬 실행
        const groupIdsAsNumber = groupIds.map((id) => Number(id));
        const calcRate = async (studentIds: Set<bigint>): Promise<{ count: number; rate: number }> => {
            const count = studentIds.size;
            if (count === 0 || totalDays === 0) return { count, rate: 0 };

            const presentRow = await database.$kysely
                .selectFrom('attendance as a')
                .select(PRESENT_COUNT_SQL.as('presentCount'))
                .where('a.deleteAt', 'is', null)
                .where('a.groupId', 'in', groupIdsAsNumber)
                .where(
                    'a.studentId',
                    'in',
                    [...studentIds].map((id) => Number(id))
                )
                .where('a.date', '>=', startDateStr)
                .where('a.date', '<=', endDateStr)
                .executeTakeFirstOrThrow();

            const presentCount = Number(presentRow.presentCount ?? 0);
            const expected = count * totalDays;
            const rate = expected > 0 ? (presentCount / expected) * 100 : 0;
            return { count, rate: roundToDecimal(rate, 1) };
        };

        const [male, female, unknown] = await Promise.all([
            calcRate(genderGroups.M),
            calcRate(genderGroups.F),
            calcRate(genderGroups.unknown),
        ]);

        return { year, male, female, unknown };
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
