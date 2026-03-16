/**
 * 전례 시기 조회 UseCase
 *
 * 현재 날짜 기준 전례 시기를 계산하고 다가오는 축일 목록을 반환한다.
 */
import { GetHolydaysUseCase } from './get-holydays.usecase.ts';
import type { GetSeasonInput, GetSeasonOutput } from '@school/shared';
import { addDays, formatDateISO, getLiturgicalSeason, getNowKST } from '@school/utils';

/**
 * 토요일이면 일요일 날짜로 보정한다 (특전미사 반영).
 * 단, 성토요일(내일이 부활 대축일)이면 보정하지 않는다.
 */
export const adjustForSaturday = (today: Date, year: number): Date => {
    if (today.getDay() !== 6) return today;

    const tomorrow = addDays(today, 1);
    const tomorrowSeason = getLiturgicalSeason(tomorrow, year);

    // 성토요일: 내일이 부활 대축일이면 보정하지 않음
    if (tomorrowSeason.season === '부활 대축일') return today;

    return tomorrow;
};

export class GetSeasonUseCase {
    async execute(input: GetSeasonInput): Promise<GetSeasonOutput> {
        const today = getNowKST();
        const year = input.year ?? today.getFullYear();

        // 1. 토요일 보정 (특전미사: 토요일→일요일, 성토요일 제외)
        const displayDate = adjustForSaturday(today, year);

        // 2. 전례 시기 계산
        const seasonInfo = getLiturgicalSeason(displayDate, year);

        // 3. 다가오는 축일 계산 (올해 + 내년)
        const holydaysUseCase = new GetHolydaysUseCase();
        const currentYear = await holydaysUseCase.execute({ year });
        const nextYear = await holydaysUseCase.execute({ year: year + 1 });

        // 4. 보정된 날짜 기준 축일 필터 → 날짜순 정렬 → 3개 선택
        const displayDateISO = formatDateISO(displayDate);
        const upcomingHolydays = [...currentYear.holydays, ...nextYear.holydays]
            .filter((h) => h.date > displayDateISO)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3);

        return {
            season: seasonInfo.season,
            color: seasonInfo.color,
            upcomingHolydays,
        };
    }
}
