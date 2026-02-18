/**
 * 전례 시기 계산 유틸리티
 *
 * 가톨릭 전례력의 5개 시기(대림/성탄/사순/부활/연중)를 판별하는 순수 함수.
 * 기존 calculateEaster, addDays, getNthSundayOf 등을 활용한다.
 */
import { addDays, calculateEaster, getNthSundayOf } from './date.js';
import { formatDateISO } from './format.js';

export interface LiturgicalSeasonInfo {
    season: string; // "대림 제1주일", "연중 제7주일" 등
    color: string; // "purple" | "white" | "green" | "red"
}

/**
 * 주어진 날짜의 전례 시기를 판별한다.
 *
 * @param date 판별할 날짜
 * @param year 전례력 연도 (기본: date의 연도)
 * @returns 전례 시기명과 전례색
 */
export const getLiturgicalSeason = (date: Date, year?: number): LiturgicalSeasonInfo => {
    const y = year ?? date.getFullYear();
    const dateISO = formatDateISO(date);

    // 주요 날짜 계산
    const easter = calculateEaster(y);
    const ashWednesday = addDays(easter, -46);
    const pentecost = addDays(easter, 49);
    const advent1 = getAdvent1(y);
    const baptismOfLord = getBaptismOfLord(y);
    const christmas = new Date(y, 11, 25); // 12/25

    // 전년도 성탄 시기 경계 (1월 초)
    const prevBaptism = getBaptismOfLord(y);

    // 전례 시기 판별 (순서 중요)

    // 1. 성탄 시기 (12/25~12/31)
    if (dateISO >= formatDateISO(christmas)) {
        if (dateISO === formatDateISO(christmas)) {
            return { season: '성탄 대축일', color: 'white' };
        }
        return { season: '성탄 시기', color: 'white' };
    }

    // 2. 성탄 시기 (1/1 ~ 주님 세례 축일)
    if (dateISO <= formatDateISO(prevBaptism)) {
        return { season: '성탄 시기', color: 'white' };
    }

    // 3. 대림 시기
    if (dateISO >= formatDateISO(advent1)) {
        const weekNum = getWeekNumber(advent1, date);
        return { season: `대림 제${weekNum}주일`, color: 'purple' };
    }

    // 4. 연중 시기 전반부 (주님 세례 축일 다음 날 ~ 재의 수요일 전날)
    const ordinaryStart = addDays(prevBaptism, 1);
    if (dateISO >= formatDateISO(ordinaryStart) && dateISO < formatDateISO(ashWednesday)) {
        const weekNum = getOrdinaryWeekBefore(prevBaptism, date);
        return { season: `연중 제${weekNum}주일`, color: 'green' };
    }

    // 5. 사순 시기 (재의 수요일 ~ 부활 전날)
    if (dateISO >= formatDateISO(ashWednesday) && dateISO < formatDateISO(easter)) {
        if (dateISO === formatDateISO(ashWednesday)) {
            return { season: '재의 수요일', color: 'purple' };
        }
        const weekNum = getWeekNumber(ashWednesday, date);
        return { season: `사순 제${weekNum}주일`, color: 'purple' };
    }

    // 6. 부활 시기 (부활 대축일 ~ 성령 강림)
    if (dateISO >= formatDateISO(easter) && dateISO <= formatDateISO(pentecost)) {
        if (dateISO === formatDateISO(easter)) {
            return { season: '부활 대축일', color: 'white' };
        }
        // 성령 강림 당일: 빨강 전례색
        if (dateISO === formatDateISO(pentecost)) {
            return { season: '성령 강림 대축일', color: 'red' };
        }
        const weekNum = getWeekNumber(easter, date);
        return { season: `부활 제${weekNum}주일`, color: 'white' };
    }

    // 7. 연중 시기 후반부 (성령 강림 다음 날 ~ 대림 전날)
    const weekNum = getOrdinaryWeekAfter(pentecost, advent1, date);
    return { season: `연중 제${weekNum}주일`, color: 'green' };
};

/**
 * 대림 제1주일 계산: 12/25 기준 직전 4번째 주일
 * 결과 범위: 11/27 ~ 12/3
 */
const getAdvent1 = (year: number): Date => {
    const christmas = new Date(year, 11, 25);
    const christmasDow = christmas.getDay(); // 0=일

    // 12/25로부터 가장 가까운 이전 주일까지의 일수
    const daysToLastSunday = christmasDow === 0 ? 7 : christmasDow;
    // 4번째 이전 주일
    const advent1 = addDays(christmas, -(daysToLastSunday + 21));
    return advent1;
};

/**
 * 주님 세례 축일 계산 (한국 전례력)
 *
 * 한국: 주님 공현 대축일(1/2~1/8 사이 주일) 다음 주일
 * 단, 공현이 1/7~8이면 다음 날(월요일)
 */
const getBaptismOfLord = (year: number): Date => {
    const epiphany = getEpiphany(year);
    const epiphanyDate = epiphany.getDate();

    if (epiphanyDate === 7 || epiphanyDate === 8) {
        // 공현이 1/7 또는 1/8이면 다음 날(월요일)
        return addDays(epiphany, 1);
    }
    // 그 외: 공현 다음 주일
    return addDays(epiphany, 7);
};

/**
 * 주님 공현 대축일 계산 (한국 전례력)
 * 1/2 ~ 1/8 사이의 주일
 */
const getEpiphany = (year: number): Date => {
    const firstSunday = getNthSundayOf(year, 1, 1);
    if (firstSunday.getDate() >= 2) {
        return firstSunday;
    }
    // 1월 첫 주일이 1/1이면 두 번째 주일
    return getNthSundayOf(year, 1, 2);
};

/**
 * 기준일로부터 몇 주차인지 계산 (1-based)
 */
const getWeekNumber = (start: Date, current: Date): number => {
    const diffMs = current.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return Math.floor(diffDays / 7) + 1;
};

/**
 * 연중 시기 전반부 주차 계산
 * 주님 세례 축일 다음 날(월)부터 시작
 */
const getOrdinaryWeekBefore = (baptismOfLord: Date, date: Date): number => {
    const start = addDays(baptismOfLord, 1);
    const diffMs = date.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    return Math.floor(diffDays / 7) + 1;
};

/**
 * 연중 시기 후반부 주차 계산
 * 34주(그리스도왕 대축일)부터 역산
 */
const getOrdinaryWeekAfter = (pentecost: Date, advent1: Date, date: Date): number => {
    // 대림 직전 주일이 그리스도왕 대축일 = 연중 제34주일
    const christTheKing = addDays(advent1, -7);
    const diffMs = christTheKing.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
    const weeksFromEnd = Math.floor(diffDays / 7);
    return 34 - weeksFromEnd;
};
