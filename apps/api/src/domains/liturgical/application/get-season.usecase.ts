/**
 * 전례 시기 조회 UseCase
 *
 * 현재 날짜 기준 전례 시기를 계산하고 다가오는 축일 목록을 반환한다.
 */
import { GetHolydaysUseCase } from './get-holydays.usecase.ts';
import type { GetSeasonInput, GetSeasonOutput } from '@school/trpc';
import { formatDateISO, getLiturgicalSeason, getNowKST } from '@school/utils';

export class GetSeasonUseCase {
    async execute(input: GetSeasonInput): Promise<GetSeasonOutput> {
        const today = getNowKST();
        const year = input.year ?? today.getFullYear();

        // 1. 전례 시기 계산
        const seasonInfo = getLiturgicalSeason(today, year);

        // 2. 다가오는 축일 계산 (올해 + 내년)
        const holydaysUseCase = new GetHolydaysUseCase();
        const currentYear = await holydaysUseCase.execute({ year });
        const nextYear = await holydaysUseCase.execute({ year: year + 1 });

        // 3. 오늘 이후 축일 필터 → 날짜순 정렬 → 3개 선택
        const todayISO = formatDateISO(today);
        const upcomingHolydays = [...currentYear.holydays, ...nextYear.holydays]
            .filter((h) => h.date > todayISO)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3);

        return {
            season: seasonInfo.season,
            color: seasonInfo.color,
            upcomingHolydays,
        };
    }
}
