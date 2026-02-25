/**
 * 현재 시간을 KST(한국 표준시)로 반환한다.
 *
 * Prisma의 @default(now())는 UTC만 지원하므로,
 * 비즈니스 로직에서 직접 KST 시간을 입력해야 한다.
 *
 * @returns KST 기준 현재 시간
 */
export const getNowKST = (): Date => {
    const now = new Date();
    // UTC + 9시간 = KST
    const kstOffset = 9 * 60 * 60 * 1000;
    return new Date(now.getTime() + kstOffset);
};

/**
 * 날짜에 일수를 더한다.
 */
export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * 주어진 날짜가 속한 주의 일요일을 반환한다.
 */
export const getThisWeekSunday = (date: Date): Date => {
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0 = Sunday
    d.setDate(d.getDate() - dayOfWeek);
    d.setHours(0, 0, 0, 0);
    return d;
};

/**
 * 주어진 날짜가 속한 주의 토요일을 반환한다.
 */
export const getThisWeekSaturday = (date: Date): Date => {
    const sunday = getThisWeekSunday(date);
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);
    return saturday;
};

/**
 * 기간 내 일요일 수를 계산한다.
 */
export const countSundays = (startDate: Date, endDate: Date): number => {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        if (current.getDay() === 0) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
};

/**
 * 연간 일요일 수를 계산한다.
 */
export const countSundaysInYear = (year: number): number => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    return countSundays(startDate, endDate);
};

/**
 * 해당 월의 N번째 주일을 계산한다.
 */
export const getNthSundayOf = (year: number, month: number, n: number): Date => {
    const firstDay = new Date(year, month - 1, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = 일요일

    let firstSunday: number;
    if (dayOfWeek === 0) {
        firstSunday = 1;
    } else {
        firstSunday = 8 - dayOfWeek;
    }

    const nthSunday = firstSunday + (n - 1) * 7;
    return new Date(year, month - 1, nthSunday);
};

/**
 * 해당 월의 N번째 토요일을 계산한다.
 */
export const getNthSaturdayOf = (year: number, month: number, n: number): Date => {
    const firstDay = new Date(year, month - 1, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = 일요일, 6 = 토요일

    let firstSaturday: number;
    if (dayOfWeek === 6) {
        firstSaturday = 1;
    } else if (dayOfWeek === 0) {
        firstSaturday = 7; // 일요일이면 다음 토요일은 7일
    } else {
        firstSaturday = 7 - dayOfWeek; // 토요일까지 남은 일수
    }

    const nthSaturday = firstSaturday + (n - 1) * 7;
    return new Date(year, month - 1, nthSaturday);
};

/**
 * 해당 월의 마지막 주일을 계산한다.
 */
export const getLastSundayOf = (year: number, month: number): Date => {
    const lastDay = new Date(year, month, 0); // 해당 월의 마지막 날
    const dayOfWeek = lastDay.getDay();
    const lastSunday = lastDay.getDate() - dayOfWeek;
    return new Date(year, month - 1, lastSunday);
};

/**
 * 해당 월의 주일(일요일) 수를 계산한다.
 *
 * @param year 연도
 * @param month 월 (1-12)
 * @returns 주일 수 (4 또는 5)
 */
export const getWeeksInMonth = (year: number, month: number): number => {
    const firstSunday = getNthSundayOf(year, month, 1);
    const lastSunday = getLastSundayOf(year, month);

    // 첫 주일부터 마지막 주일까지의 주 수 계산
    const diffTime = lastSunday.getTime() - firstSunday.getTime();
    const diffWeeks = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));

    return diffWeeks + 1;
};

/**
 * 특정 월의 N번째 주일~토요일 범위를 반환한다.
 *
 * @param year 연도
 * @param month 월 (1-12)
 * @param weekNum 주차 (1-5)
 * @returns { startDate: Date, endDate: Date } 일요일~토요일 범위
 */
export const getWeekRangeInMonth = (
    year: number,
    month: number,
    weekNum: number
): { startDate: Date; endDate: Date } => {
    const sunday = getNthSundayOf(year, month, weekNum);
    const saturday = new Date(sunday);
    saturday.setDate(saturday.getDate() + 6);

    return { startDate: sunday, endDate: saturday };
};

/**
 * 졸업 필터 기준일을 계산한다.
 *
 * 주/월/연 단위에 따라 조회 기간 시작일을 반환.
 * 통계 유스케이스에서 졸업생 필터링에 사용된다.
 */
export const getGraduationCutoff = (year: number, month?: number, week?: number): Date => {
    if (month && week) return getWeekRangeInMonth(year, month, week).startDate;
    if (month) return new Date(year, month - 1, 1);
    return new Date(year, 0, 1);
};

/**
 * 부활 대축일을 계산한다. (Anonymous Gregorian Algorithm)
 *
 * 부활 대축일 정의: 춘분(3월 21일) 이후 첫 보름달 다음 일요일
 * 결과 범위: 3월 22일 ~ 4월 25일
 *
 * 알고리즘 출처: "Computus" - 1876년 Nature 저널에 발표된 익명의 그레고리력 알고리즘
 * (Meeus/Jones/Butcher algorithm으로도 알려짐)
 */
export const calculateEaster = (year: number): Date => {
    // 1. 메톤 주기: 달 위상이 19년마다 반복
    const metonicCycle = year % 19;

    // 2. 세기 분리
    const century = Math.floor(year / 100);
    const yearInCentury = year % 100;

    // 3. 윤년 보정
    const leapCenturyCorrection = Math.floor(century / 4);
    const leapCenturyRemainder = century % 4;

    // 4. 그레고리력 보정 (100년마다 윤년 건너뜀, 400년 배수 제외)
    const prolelepticCorrection = Math.floor((century + 8) / 25);
    const gregorianCorrection = Math.floor((century - prolelepticCorrection + 1) / 3);

    // 5. 파스칼 보름달: 춘분 후 보름달까지의 일수
    const daysToFullMoon = (19 * metonicCycle + century - leapCenturyCorrection - gregorianCorrection + 15) % 30;

    // 6. 요일 계산 준비
    const leapYearsInCentury = Math.floor(yearInCentury / 4);
    const yearRemainder = yearInCentury % 4;

    // 7. 보름달 이후 일요일까지의 일수
    const daysToSunday = (32 + 2 * leapCenturyRemainder + 2 * leapYearsInCentury - daysToFullMoon - yearRemainder) % 7;

    // 8. 예외 보정: 부활절이 4월 26일 이후가 되는 것 방지
    const aprilException = Math.floor((metonicCycle + 11 * daysToFullMoon + 22 * daysToSunday) / 451);

    // 9. 최종 날짜 계산
    const dateSum = daysToFullMoon + daysToSunday - 7 * aprilException + 114;
    const month = Math.floor(dateSum / 31);
    const day = (dateSum % 31) + 1;

    return new Date(year, month - 1, day);
};
