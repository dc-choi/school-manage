/**
 * 의무축일 조회 UseCase
 *
 * 천주교 전례력에 따른 의무축일(고정 + 이동)을 계산하여 반환합니다.
 */
import { addDays, calculateEaster, formatDateISO, getLastSundayOf } from '@school/utils';
import type { GetHolydaysInput, GetHolydaysOutput, Holyday } from '@school/trpc';

export class GetHolydaysUseCase {
    async execute(input: GetHolydaysInput): Promise<GetHolydaysOutput> {
        const { year } = input;

        const fixedHolydays = this.getFixedHolydays(year);
        const movableHolydays = this.getMovableHolydays(year);

        const holydays = [...fixedHolydays, ...movableHolydays].sort((a, b) => a.date.localeCompare(b.date));

        return {
            year,
            holydays,
        };
    }

    /**
     * 고정 축일 계산 (매년 동일한 날짜)
     */
    private getFixedHolydays(year: number): Holyday[] {
        const holydays: Holyday[] = [
            { date: `${year}-01-01`, name: '천주의 성모 마리아 대축일' },
            { date: `${year}-05-05`, name: '어린이날' },
            { date: `${year}-08-15`, name: '성모 승천 대축일' },
            { date: `${year}-11-01`, name: '모든 성인 대축일' },
            { date: `${year}-12-25`, name: '성탄 대축일' },
        ];

        // 청소년 주일 (5월 마지막 주일)
        const lastSundayOfMay = getLastSundayOf(year, 5);
        holydays.push({
            date: formatDateISO(lastSundayOfMay),
            name: '청소년 주일',
        });

        return holydays;
    }

    /**
     * 이동 축일 계산 (부활 대축일 기준)
     */
    private getMovableHolydays(year: number): Holyday[] {
        const holydays: Holyday[] = [];

        try {
            const easter = calculateEaster(year);

            // 부활 대축일
            holydays.push({
                date: formatDateISO(easter),
                name: '부활 대축일',
            });

            // 주님 승천 대축일 (부활 후 42일 = 부활 후 6주차 주일, 한국은 주일로 이동)
            const ascension = addDays(easter, 42);
            holydays.push({
                date: formatDateISO(ascension),
                name: '주님 승천 대축일',
            });

            // 성령 강림 대축일 (부활 후 49일)
            const pentecost = addDays(easter, 49);
            holydays.push({
                date: formatDateISO(pentecost),
                name: '성령 강림 대축일',
            });

            // 지극히 거룩하신 삼위일체 대축일 (성령 강림 후 첫 주일)
            const trinity = addDays(pentecost, 7);
            holydays.push({
                date: formatDateISO(trinity),
                name: '지극히 거룩하신 삼위일체 대축일',
            });

            // 지극히 거룩하신 그리스도의 성체 성혈 대축일 (삼위일체 후 목요일, 한국은 주일)
            const corpusChristi = addDays(trinity, 7);
            holydays.push({
                date: formatDateISO(corpusChristi),
                name: '지극히 거룩하신 그리스도의 성체 성혈 대축일',
            });
        } catch (error) {
            // 이동 축일 계산 오류 시 빈 배열 반환 (고정 축일만 표시)
            console.error('이동 축일 계산 오류:', error);
        }

        return holydays;
    }
}