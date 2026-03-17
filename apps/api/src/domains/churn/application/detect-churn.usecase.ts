/**
 * 이탈 감지 UseCase
 *
 * 14일 이상 미활동 단체를 감지하고, 전례력 예외/중복 필터링을 수행합니다.
 */
import { addDays, calculateEaster, formatDateCompact, getNowKST } from '@school/utils';
import type { ChurnAlert, DetectChurnResult, InactiveOrgRow } from '~/domains/churn/churn.types.js';
import { DEDUP_DAYS, INACTIVE_THRESHOLD_DAYS } from '~/domains/churn/churn.types.js';
import { database } from '~/infrastructure/database/database.js';

export class DetectChurnUseCase {
    async execute(): Promise<DetectChurnResult> {
        const now = getNowKST();
        const year = now.getFullYear();

        // 1. 전례력 예외: 성주간(주님 수난 성지주일 ~ 성토요일)
        if (this.isHolyWeek(now, year)) {
            return { skipped: true, skipReason: '성주간', alerts: [] };
        }

        // 2. 미활동 단체 조회
        const thresholdDate = formatDateCompact(addDays(now, -INACTIVE_THRESHOLD_DAYS));
        const inactiveOrgs = await this.findInactiveOrganizations(thresholdDate);

        if (inactiveOrgs.length === 0) {
            return { skipped: false, alerts: [] };
        }

        // 3. 중복 필터링 (7일 내 기알림 단체 제외)
        const dedupDate = addDays(now, -DEDUP_DAYS);
        const recentAlerts = await database.churnAlertLog.findMany({
            where: {
                organizationId: { in: inactiveOrgs.map((o) => o.organizationId) },
                sentAt: { gte: dedupDate },
            },
            select: { organizationId: true },
        });
        const recentlyAlertedIds = new Set(recentAlerts.map((a) => a.organizationId));
        const filtered = inactiveOrgs.filter((o) => !recentlyAlertedIds.has(o.organizationId));

        if (filtered.length === 0) {
            return { skipped: false, alerts: [] };
        }

        // 4. 단체 상세 조회
        const orgIds = filtered.map((o) => o.organizationId);
        const organizations = await database.organization.findMany({
            where: { id: { in: orgIds }, deletedAt: null },
            include: {
                church: { select: { name: true } },
                _count: { select: { students: { where: { deletedAt: null } } } },
            },
        });
        const orgMap = new Map(organizations.map((o) => [o.id, o]));

        // 5. 결과 조합
        const alerts: ChurnAlert[] = [];
        for (const row of filtered) {
            const org = orgMap.get(row.organizationId);
            if (!org) continue;

            const lastDate = `${row.lastDate.slice(0, 4)}-${row.lastDate.slice(4, 6)}-${row.lastDate.slice(6, 8)}`;
            const lastActivityDate = new Date(lastDate);
            const diffMs = now.getTime() - lastActivityDate.getTime();
            const inactiveDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            alerts.push({
                organizationId: row.organizationId,
                churchName: org.church.name,
                organizationName: org.name,
                studentCount: org._count.students,
                inactiveDays,
                lastActivityDate: lastDate,
            });
        }

        // 미활동 일수 내림차순 정렬
        alerts.sort((a, b) => b.inactiveDays - a.inactiveDays);

        return { skipped: false, alerts };
    }

    /**
     * 성주간 여부 판별 (주님 수난 성지주일 ~ 성토요일)
     */
    isHolyWeek(date: Date, year: number): boolean {
        const easter = calculateEaster(year);
        const palmSunday = addDays(easter, -7);
        const holySaturday = addDays(easter, -1);

        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const palmOnly = new Date(palmSunday.getFullYear(), palmSunday.getMonth(), palmSunday.getDate());
        const holyOnly = new Date(holySaturday.getFullYear(), holySaturday.getMonth(), holySaturday.getDate());

        return dateOnly >= palmOnly && dateOnly <= holyOnly;
    }

    /**
     * 미활동 단체 조회 (출석 기록 1건 이상 + 마지막 출석 < 기준일)
     */
    private async findInactiveOrganizations(thresholdDate: string): Promise<InactiveOrgRow[]> {
        return database.$kysely
            .selectFrom('attendance as a')
            .innerJoin('student as s', 's.id', 'a.studentId')
            .select(['s.organizationId'])
            .select((eb) => eb.fn.max('a.date').as('lastDate'))
            .where('a.deleteAt', 'is', null)
            .where('s.deleteAt', 'is', null)
            .where('s.organizationId', 'is not', null)
            .groupBy('s.organizationId')
            .having((eb) => eb.fn.max('a.date'), '<', thresholdDate)
            .having((eb) => eb.fn.count('a.id'), '>=', 1)
            .$castTo<InactiveOrgRow>()
            .execute();
    }
}
