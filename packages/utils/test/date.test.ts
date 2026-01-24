/**
 * 날짜/시간 유틸리티 테스트
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
    getNowKST,
    addDays,
    getThisWeekSunday,
    getThisWeekSaturday,
    countSundays,
    countSundaysInYear,
    getNthSundayOf,
    getNthSaturdayOf,
    getLastSundayOf,
    calculateEaster,
} from '../src/date.js';

describe('date 유틸리티', () => {
    describe('getNowKST', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('UTC 기준 시간에 9시간을 더한 KST 시간을 반환한다', () => {
            // UTC 2024-01-15 00:00:00 설정
            vi.setSystemTime(new Date('2024-01-15T00:00:00.000Z'));

            const result = getNowKST();

            // KST는 UTC + 9시간이므로 09:00:00 이어야 함
            expect(result.getUTCHours()).toBe(9);
            expect(result.getUTCDate()).toBe(15);
        });

        it('UTC 자정을 넘기면 KST 날짜도 변경된다', () => {
            // UTC 2024-01-15 15:00:00 설정 (KST로는 다음날 00:00)
            vi.setSystemTime(new Date('2024-01-15T15:00:00.000Z'));

            const result = getNowKST();

            // KST는 UTC + 9시간이므로 다음날 00:00
            expect(result.getUTCDate()).toBe(16);
            expect(result.getUTCHours()).toBe(0);
        });
    });

    describe('addDays', () => {
        it('양수 일수를 더한다', () => {
            const date = new Date(2024, 0, 15); // 2024-01-15
            const result = addDays(date, 5);

            expect(result.getDate()).toBe(20);
            expect(result.getMonth()).toBe(0);
        });

        it('음수 일수를 더하면 날짜가 감소한다', () => {
            const date = new Date(2024, 0, 15); // 2024-01-15
            const result = addDays(date, -5);

            expect(result.getDate()).toBe(10);
        });

        it('월 경계를 넘는 경우 월이 변경된다', () => {
            const date = new Date(2024, 0, 30); // 2024-01-30
            const result = addDays(date, 5);

            expect(result.getMonth()).toBe(1); // February
            expect(result.getDate()).toBe(4);
        });

        it('연 경계를 넘는 경우 연도가 변경된다', () => {
            const date = new Date(2024, 11, 30); // 2024-12-30
            const result = addDays(date, 5);

            expect(result.getFullYear()).toBe(2025);
            expect(result.getMonth()).toBe(0); // January
            expect(result.getDate()).toBe(4);
        });

        it('원본 날짜를 변경하지 않는다', () => {
            const date = new Date(2024, 0, 15);
            const originalDate = date.getDate();

            addDays(date, 5);

            expect(date.getDate()).toBe(originalDate);
        });
    });

    describe('getThisWeekSunday', () => {
        it('일요일을 입력하면 그 날을 반환한다', () => {
            const sunday = new Date(2024, 0, 14); // 2024-01-14 (일요일)
            const result = getThisWeekSunday(sunday);

            expect(result.getDay()).toBe(0); // 일요일
            expect(result.getDate()).toBe(14);
        });

        it('월요일을 입력하면 이전 일요일을 반환한다', () => {
            const monday = new Date(2024, 0, 15); // 2024-01-15 (월요일)
            const result = getThisWeekSunday(monday);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(14); // 이전 일요일
        });

        it('토요일을 입력하면 그 주의 일요일을 반환한다', () => {
            const saturday = new Date(2024, 0, 20); // 2024-01-20 (토요일)
            const result = getThisWeekSunday(saturday);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(14); // 그 주의 일요일
        });

        it('시간을 00:00:00으로 설정한다', () => {
            const date = new Date(2024, 0, 15, 15, 30, 45);
            const result = getThisWeekSunday(date);

            expect(result.getHours()).toBe(0);
            expect(result.getMinutes()).toBe(0);
            expect(result.getSeconds()).toBe(0);
        });

        it('월 경계를 넘어가는 경우도 정확히 계산한다', () => {
            const date = new Date(2024, 1, 1); // 2024-02-01 (목요일)
            const result = getThisWeekSunday(date);

            expect(result.getMonth()).toBe(0); // January
            expect(result.getDate()).toBe(28); // 2024-01-28
        });
    });

    describe('getThisWeekSaturday', () => {
        it('토요일을 입력하면 그 날을 반환한다', () => {
            const saturday = new Date(2024, 0, 20); // 2024-01-20 (토요일)
            const result = getThisWeekSaturday(saturday);

            expect(result.getDay()).toBe(6); // 토요일
            expect(result.getDate()).toBe(20);
        });

        it('일요일을 입력하면 그 주의 토요일을 반환한다', () => {
            const sunday = new Date(2024, 0, 14); // 2024-01-14 (일요일)
            const result = getThisWeekSaturday(sunday);

            expect(result.getDay()).toBe(6);
            expect(result.getDate()).toBe(20);
        });

        it('월요일을 입력하면 그 주의 토요일을 반환한다', () => {
            const monday = new Date(2024, 0, 15); // 2024-01-15 (월요일)
            const result = getThisWeekSaturday(monday);

            expect(result.getDay()).toBe(6);
            expect(result.getDate()).toBe(20);
        });
    });

    describe('countSundays', () => {
        it('단일 일요일을 포함하는 기간에서 1을 반환한다', () => {
            const start = new Date(2024, 0, 14); // 일요일
            const end = new Date(2024, 0, 14);
            const result = countSundays(start, end);

            expect(result).toBe(1);
        });

        it('일요일이 없는 기간에서 0을 반환한다', () => {
            const start = new Date(2024, 0, 15); // 월요일
            const end = new Date(2024, 0, 17); // 수요일
            const result = countSundays(start, end);

            expect(result).toBe(0);
        });

        it('2주 기간에서 2를 반환한다', () => {
            const start = new Date(2024, 0, 14); // 일요일
            const end = new Date(2024, 0, 21); // 다음 일요일
            const result = countSundays(start, end);

            expect(result).toBe(2);
        });

        it('한 달 기간에서 정확한 일요일 수를 반환한다', () => {
            const start = new Date(2024, 0, 1); // 2024-01-01
            const end = new Date(2024, 0, 31); // 2024-01-31
            const result = countSundays(start, end);

            // 2024년 1월: 7, 14, 21, 28일이 일요일 = 4개
            expect(result).toBe(4);
        });
    });

    describe('countSundaysInYear', () => {
        it('2024년의 일요일 수를 정확히 계산한다', () => {
            const result = countSundaysInYear(2024);

            // 2024년은 윤년이고 52주 + 2일 = 52 또는 53개의 일요일
            expect(result).toBe(52);
        });

        it('2023년의 일요일 수를 정확히 계산한다', () => {
            const result = countSundaysInYear(2023);

            expect(result).toBe(53); // 2023년은 53개의 일요일
        });

        it('일반적으로 52~53개의 일요일을 반환한다', () => {
            for (let year = 2020; year <= 2030; year++) {
                const result = countSundaysInYear(year);
                expect(result).toBeGreaterThanOrEqual(52);
                expect(result).toBeLessThanOrEqual(53);
            }
        });
    });

    describe('getNthSundayOf', () => {
        it('2024년 1월의 첫 번째 주일을 반환한다', () => {
            const result = getNthSundayOf(2024, 1, 1);

            expect(result.getDay()).toBe(0); // 일요일
            expect(result.getDate()).toBe(7); // 2024-01-07
        });

        it('2024년 1월의 두 번째 주일을 반환한다', () => {
            const result = getNthSundayOf(2024, 1, 2);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(14); // 2024-01-14
        });

        it('2024년 1월의 세 번째 주일을 반환한다', () => {
            const result = getNthSundayOf(2024, 1, 3);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(21);
        });

        it('2024년 1월의 네 번째 주일을 반환한다', () => {
            const result = getNthSundayOf(2024, 1, 4);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(28);
        });

        it('월의 첫째 날이 일요일인 경우를 처리한다', () => {
            // 2024년 9월 1일은 일요일
            const result = getNthSundayOf(2024, 9, 1);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(1);
        });

        it('월의 첫째 날이 토요일인 경우를 처리한다', () => {
            // 2024년 6월 1일은 토요일
            const result = getNthSundayOf(2024, 6, 1);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(2); // 첫 일요일은 2일
        });
    });

    describe('getNthSaturdayOf', () => {
        it('2024년 1월의 첫 번째 토요일을 반환한다', () => {
            const result = getNthSaturdayOf(2024, 1, 1);

            expect(result.getDay()).toBe(6); // 토요일
            expect(result.getDate()).toBe(6); // 2024-01-06
        });

        it('2024년 1월의 두 번째 토요일을 반환한다', () => {
            const result = getNthSaturdayOf(2024, 1, 2);

            expect(result.getDay()).toBe(6);
            expect(result.getDate()).toBe(13);
        });

        it('월의 첫째 날이 토요일인 경우를 처리한다', () => {
            // 2024년 6월 1일은 토요일
            const result = getNthSaturdayOf(2024, 6, 1);

            expect(result.getDay()).toBe(6);
            expect(result.getDate()).toBe(1);
        });

        it('월의 첫째 날이 일요일인 경우를 처리한다', () => {
            // 2024년 9월 1일은 일요일
            const result = getNthSaturdayOf(2024, 9, 1);

            expect(result.getDay()).toBe(6);
            expect(result.getDate()).toBe(7); // 첫 토요일은 7일
        });
    });

    describe('getLastSundayOf', () => {
        it('2024년 1월의 마지막 주일을 반환한다', () => {
            const result = getLastSundayOf(2024, 1);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(28); // 2024-01-28
        });

        it('2024년 2월의 마지막 주일을 반환한다 (윤년)', () => {
            const result = getLastSundayOf(2024, 2);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(25); // 2024-02-25
        });

        it('2024년 3월의 마지막 주일을 반환한다', () => {
            const result = getLastSundayOf(2024, 3);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(31); // 2024-03-31 (부활절)
        });

        it('2023년 2월의 마지막 주일을 반환한다 (평년)', () => {
            const result = getLastSundayOf(2023, 2);

            expect(result.getDay()).toBe(0);
            expect(result.getDate()).toBe(26); // 2023-02-26
        });
    });

    describe('calculateEaster', () => {
        it('2024년 부활 대축일을 정확히 계산한다', () => {
            const result = calculateEaster(2024);

            // 2024년 부활 대축일: 3월 31일
            expect(result.getMonth()).toBe(2); // March (0-indexed)
            expect(result.getDate()).toBe(31);
        });

        it('2023년 부활 대축일을 정확히 계산한다', () => {
            const result = calculateEaster(2023);

            // 2023년 부활 대축일: 4월 9일
            expect(result.getMonth()).toBe(3); // April
            expect(result.getDate()).toBe(9);
        });

        it('2025년 부활 대축일을 정확히 계산한다', () => {
            const result = calculateEaster(2025);

            // 2025년 부활 대축일: 4월 20일
            expect(result.getMonth()).toBe(3); // April
            expect(result.getDate()).toBe(20);
        });

        it('2026년 부활 대축일을 정확히 계산한다', () => {
            const result = calculateEaster(2026);

            // 2026년 부활 대축일: 4월 5일
            expect(result.getMonth()).toBe(3); // April
            expect(result.getDate()).toBe(5);
        });

        it('부활 대축일은 항상 일요일이다', () => {
            for (let year = 2020; year <= 2030; year++) {
                const result = calculateEaster(year);
                expect(result.getDay()).toBe(0); // 일요일
            }
        });

        it('부활 대축일은 3월 22일 ~ 4월 25일 사이에 있다', () => {
            for (let year = 2000; year <= 2050; year++) {
                const result = calculateEaster(year);
                const month = result.getMonth();
                const day = result.getDate();

                if (month === 2) {
                    // March
                    expect(day).toBeGreaterThanOrEqual(22);
                } else if (month === 3) {
                    // April
                    expect(day).toBeLessThanOrEqual(25);
                } else {
                    throw new Error(`부활 대축일이 3~4월이 아닙니다: ${year}년 ${month + 1}월 ${day}일`);
                }
            }
        });
    });
});