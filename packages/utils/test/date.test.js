"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 날짜/시간 유틸리티 테스트
 */
var vitest_1 = require("vitest");
var date_js_1 = require("../src/date.js");
(0, vitest_1.describe)('date 유틸리티', function () {
    (0, vitest_1.describe)('getNowKST', function () {
        (0, vitest_1.beforeEach)(function () {
            vitest_1.vi.useFakeTimers();
        });
        (0, vitest_1.afterEach)(function () {
            vitest_1.vi.useRealTimers();
        });
        (0, vitest_1.it)('UTC 기준 시간에 9시간을 더한 KST 시간을 반환한다', function () {
            // UTC 2024-01-15 00:00:00 설정
            vitest_1.vi.setSystemTime(new Date('2024-01-15T00:00:00.000Z'));
            var result = (0, date_js_1.getNowKST)();
            // KST는 UTC + 9시간이므로 09:00:00 이어야 함
            (0, vitest_1.expect)(result.getUTCHours()).toBe(9);
            (0, vitest_1.expect)(result.getUTCDate()).toBe(15);
        });
        (0, vitest_1.it)('UTC 자정을 넘기면 KST 날짜도 변경된다', function () {
            // UTC 2024-01-15 15:00:00 설정 (KST로는 다음날 00:00)
            vitest_1.vi.setSystemTime(new Date('2024-01-15T15:00:00.000Z'));
            var result = (0, date_js_1.getNowKST)();
            // KST는 UTC + 9시간이므로 다음날 00:00
            (0, vitest_1.expect)(result.getUTCDate()).toBe(16);
            (0, vitest_1.expect)(result.getUTCHours()).toBe(0);
        });
    });
    (0, vitest_1.describe)('addDays', function () {
        (0, vitest_1.it)('양수 일수를 더한다', function () {
            var date = new Date(2024, 0, 15); // 2024-01-15
            var result = (0, date_js_1.addDays)(date, 5);
            (0, vitest_1.expect)(result.getDate()).toBe(20);
            (0, vitest_1.expect)(result.getMonth()).toBe(0);
        });
        (0, vitest_1.it)('음수 일수를 더하면 날짜가 감소한다', function () {
            var date = new Date(2024, 0, 15); // 2024-01-15
            var result = (0, date_js_1.addDays)(date, -5);
            (0, vitest_1.expect)(result.getDate()).toBe(10);
        });
        (0, vitest_1.it)('월 경계를 넘는 경우 월이 변경된다', function () {
            var date = new Date(2024, 0, 30); // 2024-01-30
            var result = (0, date_js_1.addDays)(date, 5);
            (0, vitest_1.expect)(result.getMonth()).toBe(1); // February
            (0, vitest_1.expect)(result.getDate()).toBe(4);
        });
        (0, vitest_1.it)('연 경계를 넘는 경우 연도가 변경된다', function () {
            var date = new Date(2024, 11, 30); // 2024-12-30
            var result = (0, date_js_1.addDays)(date, 5);
            (0, vitest_1.expect)(result.getFullYear()).toBe(2025);
            (0, vitest_1.expect)(result.getMonth()).toBe(0); // January
            (0, vitest_1.expect)(result.getDate()).toBe(4);
        });
        (0, vitest_1.it)('원본 날짜를 변경하지 않는다', function () {
            var date = new Date(2024, 0, 15);
            var originalDate = date.getDate();
            (0, date_js_1.addDays)(date, 5);
            (0, vitest_1.expect)(date.getDate()).toBe(originalDate);
        });
    });
    (0, vitest_1.describe)('getThisWeekSunday', function () {
        (0, vitest_1.it)('일요일을 입력하면 그 날을 반환한다', function () {
            var sunday = new Date(2024, 0, 14); // 2024-01-14 (일요일)
            var result = (0, date_js_1.getThisWeekSunday)(sunday);
            (0, vitest_1.expect)(result.getDay()).toBe(0); // 일요일
            (0, vitest_1.expect)(result.getDate()).toBe(14);
        });
        (0, vitest_1.it)('월요일을 입력하면 이전 일요일을 반환한다', function () {
            var monday = new Date(2024, 0, 15); // 2024-01-15 (월요일)
            var result = (0, date_js_1.getThisWeekSunday)(monday);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(14); // 이전 일요일
        });
        (0, vitest_1.it)('토요일을 입력하면 그 주의 일요일을 반환한다', function () {
            var saturday = new Date(2024, 0, 20); // 2024-01-20 (토요일)
            var result = (0, date_js_1.getThisWeekSunday)(saturday);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(14); // 그 주의 일요일
        });
        (0, vitest_1.it)('시간을 00:00:00으로 설정한다', function () {
            var date = new Date(2024, 0, 15, 15, 30, 45);
            var result = (0, date_js_1.getThisWeekSunday)(date);
            (0, vitest_1.expect)(result.getHours()).toBe(0);
            (0, vitest_1.expect)(result.getMinutes()).toBe(0);
            (0, vitest_1.expect)(result.getSeconds()).toBe(0);
        });
        (0, vitest_1.it)('월 경계를 넘어가는 경우도 정확히 계산한다', function () {
            var date = new Date(2024, 1, 1); // 2024-02-01 (목요일)
            var result = (0, date_js_1.getThisWeekSunday)(date);
            (0, vitest_1.expect)(result.getMonth()).toBe(0); // January
            (0, vitest_1.expect)(result.getDate()).toBe(28); // 2024-01-28
        });
    });
    (0, vitest_1.describe)('getThisWeekSaturday', function () {
        (0, vitest_1.it)('토요일을 입력하면 그 날을 반환한다', function () {
            var saturday = new Date(2024, 0, 20); // 2024-01-20 (토요일)
            var result = (0, date_js_1.getThisWeekSaturday)(saturday);
            (0, vitest_1.expect)(result.getDay()).toBe(6); // 토요일
            (0, vitest_1.expect)(result.getDate()).toBe(20);
        });
        (0, vitest_1.it)('일요일을 입력하면 그 주의 토요일을 반환한다', function () {
            var sunday = new Date(2024, 0, 14); // 2024-01-14 (일요일)
            var result = (0, date_js_1.getThisWeekSaturday)(sunday);
            (0, vitest_1.expect)(result.getDay()).toBe(6);
            (0, vitest_1.expect)(result.getDate()).toBe(20);
        });
        (0, vitest_1.it)('월요일을 입력하면 그 주의 토요일을 반환한다', function () {
            var monday = new Date(2024, 0, 15); // 2024-01-15 (월요일)
            var result = (0, date_js_1.getThisWeekSaturday)(monday);
            (0, vitest_1.expect)(result.getDay()).toBe(6);
            (0, vitest_1.expect)(result.getDate()).toBe(20);
        });
    });
    (0, vitest_1.describe)('countSundays', function () {
        (0, vitest_1.it)('단일 일요일을 포함하는 기간에서 1을 반환한다', function () {
            var start = new Date(2024, 0, 14); // 일요일
            var end = new Date(2024, 0, 14);
            var result = (0, date_js_1.countSundays)(start, end);
            (0, vitest_1.expect)(result).toBe(1);
        });
        (0, vitest_1.it)('일요일이 없는 기간에서 0을 반환한다', function () {
            var start = new Date(2024, 0, 15); // 월요일
            var end = new Date(2024, 0, 17); // 수요일
            var result = (0, date_js_1.countSundays)(start, end);
            (0, vitest_1.expect)(result).toBe(0);
        });
        (0, vitest_1.it)('2주 기간에서 2를 반환한다', function () {
            var start = new Date(2024, 0, 14); // 일요일
            var end = new Date(2024, 0, 21); // 다음 일요일
            var result = (0, date_js_1.countSundays)(start, end);
            (0, vitest_1.expect)(result).toBe(2);
        });
        (0, vitest_1.it)('한 달 기간에서 정확한 일요일 수를 반환한다', function () {
            var start = new Date(2024, 0, 1); // 2024-01-01
            var end = new Date(2024, 0, 31); // 2024-01-31
            var result = (0, date_js_1.countSundays)(start, end);
            // 2024년 1월: 7, 14, 21, 28일이 일요일 = 4개
            (0, vitest_1.expect)(result).toBe(4);
        });
    });
    (0, vitest_1.describe)('countSundaysInYear', function () {
        (0, vitest_1.it)('2024년의 일요일 수를 정확히 계산한다', function () {
            var result = (0, date_js_1.countSundaysInYear)(2024);
            // 2024년은 윤년이고 52주 + 2일 = 52 또는 53개의 일요일
            (0, vitest_1.expect)(result).toBe(52);
        });
        (0, vitest_1.it)('2023년의 일요일 수를 정확히 계산한다', function () {
            var result = (0, date_js_1.countSundaysInYear)(2023);
            (0, vitest_1.expect)(result).toBe(53); // 2023년은 53개의 일요일
        });
        (0, vitest_1.it)('일반적으로 52~53개의 일요일을 반환한다', function () {
            for (var year = 2020; year <= 2030; year++) {
                var result = (0, date_js_1.countSundaysInYear)(year);
                (0, vitest_1.expect)(result).toBeGreaterThanOrEqual(52);
                (0, vitest_1.expect)(result).toBeLessThanOrEqual(53);
            }
        });
    });
    (0, vitest_1.describe)('getNthSundayOf', function () {
        (0, vitest_1.it)('2024년 1월의 첫 번째 주일을 반환한다', function () {
            var result = (0, date_js_1.getNthSundayOf)(2024, 1, 1);
            (0, vitest_1.expect)(result.getDay()).toBe(0); // 일요일
            (0, vitest_1.expect)(result.getDate()).toBe(7); // 2024-01-07
        });
        (0, vitest_1.it)('2024년 1월의 두 번째 주일을 반환한다', function () {
            var result = (0, date_js_1.getNthSundayOf)(2024, 1, 2);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(14); // 2024-01-14
        });
        (0, vitest_1.it)('2024년 1월의 세 번째 주일을 반환한다', function () {
            var result = (0, date_js_1.getNthSundayOf)(2024, 1, 3);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(21);
        });
        (0, vitest_1.it)('2024년 1월의 네 번째 주일을 반환한다', function () {
            var result = (0, date_js_1.getNthSundayOf)(2024, 1, 4);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(28);
        });
        (0, vitest_1.it)('월의 첫째 날이 일요일인 경우를 처리한다', function () {
            // 2024년 9월 1일은 일요일
            var result = (0, date_js_1.getNthSundayOf)(2024, 9, 1);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(1);
        });
        (0, vitest_1.it)('월의 첫째 날이 토요일인 경우를 처리한다', function () {
            // 2024년 6월 1일은 토요일
            var result = (0, date_js_1.getNthSundayOf)(2024, 6, 1);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(2); // 첫 일요일은 2일
        });
    });
    (0, vitest_1.describe)('getNthSaturdayOf', function () {
        (0, vitest_1.it)('2024년 1월의 첫 번째 토요일을 반환한다', function () {
            var result = (0, date_js_1.getNthSaturdayOf)(2024, 1, 1);
            (0, vitest_1.expect)(result.getDay()).toBe(6); // 토요일
            (0, vitest_1.expect)(result.getDate()).toBe(6); // 2024-01-06
        });
        (0, vitest_1.it)('2024년 1월의 두 번째 토요일을 반환한다', function () {
            var result = (0, date_js_1.getNthSaturdayOf)(2024, 1, 2);
            (0, vitest_1.expect)(result.getDay()).toBe(6);
            (0, vitest_1.expect)(result.getDate()).toBe(13);
        });
        (0, vitest_1.it)('월의 첫째 날이 토요일인 경우를 처리한다', function () {
            // 2024년 6월 1일은 토요일
            var result = (0, date_js_1.getNthSaturdayOf)(2024, 6, 1);
            (0, vitest_1.expect)(result.getDay()).toBe(6);
            (0, vitest_1.expect)(result.getDate()).toBe(1);
        });
        (0, vitest_1.it)('월의 첫째 날이 일요일인 경우를 처리한다', function () {
            // 2024년 9월 1일은 일요일
            var result = (0, date_js_1.getNthSaturdayOf)(2024, 9, 1);
            (0, vitest_1.expect)(result.getDay()).toBe(6);
            (0, vitest_1.expect)(result.getDate()).toBe(7); // 첫 토요일은 7일
        });
    });
    (0, vitest_1.describe)('getLastSundayOf', function () {
        (0, vitest_1.it)('2024년 1월의 마지막 주일을 반환한다', function () {
            var result = (0, date_js_1.getLastSundayOf)(2024, 1);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(28); // 2024-01-28
        });
        (0, vitest_1.it)('2024년 2월의 마지막 주일을 반환한다 (윤년)', function () {
            var result = (0, date_js_1.getLastSundayOf)(2024, 2);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(25); // 2024-02-25
        });
        (0, vitest_1.it)('2024년 3월의 마지막 주일을 반환한다', function () {
            var result = (0, date_js_1.getLastSundayOf)(2024, 3);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(31); // 2024-03-31 (부활절)
        });
        (0, vitest_1.it)('2023년 2월의 마지막 주일을 반환한다 (평년)', function () {
            var result = (0, date_js_1.getLastSundayOf)(2023, 2);
            (0, vitest_1.expect)(result.getDay()).toBe(0);
            (0, vitest_1.expect)(result.getDate()).toBe(26); // 2023-02-26
        });
    });
    (0, vitest_1.describe)('calculateEaster', function () {
        (0, vitest_1.it)('2024년 부활 대축일을 정확히 계산한다', function () {
            var result = (0, date_js_1.calculateEaster)(2024);
            // 2024년 부활 대축일: 3월 31일
            (0, vitest_1.expect)(result.getMonth()).toBe(2); // March (0-indexed)
            (0, vitest_1.expect)(result.getDate()).toBe(31);
        });
        (0, vitest_1.it)('2023년 부활 대축일을 정확히 계산한다', function () {
            var result = (0, date_js_1.calculateEaster)(2023);
            // 2023년 부활 대축일: 4월 9일
            (0, vitest_1.expect)(result.getMonth()).toBe(3); // April
            (0, vitest_1.expect)(result.getDate()).toBe(9);
        });
        (0, vitest_1.it)('2025년 부활 대축일을 정확히 계산한다', function () {
            var result = (0, date_js_1.calculateEaster)(2025);
            // 2025년 부활 대축일: 4월 20일
            (0, vitest_1.expect)(result.getMonth()).toBe(3); // April
            (0, vitest_1.expect)(result.getDate()).toBe(20);
        });
        (0, vitest_1.it)('2026년 부활 대축일을 정확히 계산한다', function () {
            var result = (0, date_js_1.calculateEaster)(2026);
            // 2026년 부활 대축일: 4월 5일
            (0, vitest_1.expect)(result.getMonth()).toBe(3); // April
            (0, vitest_1.expect)(result.getDate()).toBe(5);
        });
        (0, vitest_1.it)('부활 대축일은 항상 일요일이다', function () {
            for (var year = 2020; year <= 2030; year++) {
                var result = (0, date_js_1.calculateEaster)(year);
                (0, vitest_1.expect)(result.getDay()).toBe(0); // 일요일
            }
        });
        (0, vitest_1.it)('부활 대축일은 3월 22일 ~ 4월 25일 사이에 있다', function () {
            for (var year = 2000; year <= 2050; year++) {
                var result = (0, date_js_1.calculateEaster)(year);
                var month = result.getMonth();
                var day = result.getDate();
                if (month === 2) {
                    // March
                    (0, vitest_1.expect)(day).toBeGreaterThanOrEqual(22);
                }
                else if (month === 3) {
                    // April
                    (0, vitest_1.expect)(day).toBeLessThanOrEqual(25);
                }
                else {
                    throw new Error("\uBD80\uD65C \uB300\uCD95\uC77C\uC774 3~4\uC6D4\uC774 \uC544\uB2D9\uB2C8\uB2E4: ".concat(year, "\uB144 ").concat(month + 1, "\uC6D4 ").concat(day, "\uC77C"));
                }
            }
        });
    });
    (0, vitest_1.describe)('getWeeksInMonth', function () {
        (0, vitest_1.it)('2024년 1월의 주일 수를 반환한다 (4개)', function () {
            var result = (0, date_js_1.getWeeksInMonth)(2024, 1);
            // 2024-01: 7, 14, 21, 28일이 일요일
            (0, vitest_1.expect)(result).toBe(4);
        });
        (0, vitest_1.it)('2024년 9월의 주일 수를 반환한다 (5개)', function () {
            var result = (0, date_js_1.getWeeksInMonth)(2024, 9);
            // 2024-09: 1, 8, 15, 22, 29일이 일요일
            (0, vitest_1.expect)(result).toBe(5);
        });
        (0, vitest_1.it)('2024년 3월의 주일 수를 반환한다 (5개)', function () {
            var result = (0, date_js_1.getWeeksInMonth)(2024, 3);
            // 2024-03: 3, 10, 17, 24, 31일이 일요일
            (0, vitest_1.expect)(result).toBe(5);
        });
        (0, vitest_1.it)('2024년 6월의 주일 수를 반환한다 (5개)', function () {
            var result = (0, date_js_1.getWeeksInMonth)(2024, 6);
            // 2024-06: 2, 9, 16, 23, 30일이 일요일
            (0, vitest_1.expect)(result).toBe(5);
        });
        (0, vitest_1.it)('2024년 2월의 주일 수를 반환한다 (4개)', function () {
            var result = (0, date_js_1.getWeeksInMonth)(2024, 2);
            // 2024-02: 4, 11, 18, 25일이 일요일
            (0, vitest_1.expect)(result).toBe(4);
        });
        (0, vitest_1.it)('모든 월은 4개 또는 5개의 주일을 가진다', function () {
            for (var month = 1; month <= 12; month++) {
                var result = (0, date_js_1.getWeeksInMonth)(2024, month);
                (0, vitest_1.expect)(result).toBeGreaterThanOrEqual(4);
                (0, vitest_1.expect)(result).toBeLessThanOrEqual(5);
            }
        });
    });
    (0, vitest_1.describe)('getWeekRangeInMonth', function () {
        (0, vitest_1.it)('2024년 1월 1주차 범위를 반환한다', function () {
            var result = (0, date_js_1.getWeekRangeInMonth)(2024, 1, 1);
            // 2024-01-07 (일요일) ~ 2024-01-13 (토요일)
            (0, vitest_1.expect)(result.startDate.getDay()).toBe(0); // 일요일
            (0, vitest_1.expect)(result.startDate.getDate()).toBe(7);
            (0, vitest_1.expect)(result.endDate.getDay()).toBe(6); // 토요일
            (0, vitest_1.expect)(result.endDate.getDate()).toBe(13);
        });
        (0, vitest_1.it)('2024년 1월 2주차 범위를 반환한다', function () {
            var result = (0, date_js_1.getWeekRangeInMonth)(2024, 1, 2);
            // 2024-01-14 (일요일) ~ 2024-01-20 (토요일)
            (0, vitest_1.expect)(result.startDate.getDate()).toBe(14);
            (0, vitest_1.expect)(result.endDate.getDate()).toBe(20);
        });
        (0, vitest_1.it)('2024년 9월 1주차 범위를 반환한다 (1일이 일요일)', function () {
            var result = (0, date_js_1.getWeekRangeInMonth)(2024, 9, 1);
            // 2024-09-01 (일요일) ~ 2024-09-07 (토요일)
            (0, vitest_1.expect)(result.startDate.getDate()).toBe(1);
            (0, vitest_1.expect)(result.endDate.getDate()).toBe(7);
        });
        (0, vitest_1.it)('2024년 9월 5주차 범위를 반환한다', function () {
            var result = (0, date_js_1.getWeekRangeInMonth)(2024, 9, 5);
            // 2024-09-29 (일요일) ~ 2024-10-05 (토요일)
            (0, vitest_1.expect)(result.startDate.getDate()).toBe(29);
            (0, vitest_1.expect)(result.startDate.getMonth()).toBe(8); // September
            (0, vitest_1.expect)(result.endDate.getDate()).toBe(5);
            (0, vitest_1.expect)(result.endDate.getMonth()).toBe(9); // October
        });
        (0, vitest_1.it)('시작일은 항상 일요일이다', function () {
            for (var week = 1; week <= 4; week++) {
                var result = (0, date_js_1.getWeekRangeInMonth)(2024, 1, week);
                (0, vitest_1.expect)(result.startDate.getDay()).toBe(0);
            }
        });
        (0, vitest_1.it)('종료일은 항상 토요일이다', function () {
            for (var week = 1; week <= 4; week++) {
                var result = (0, date_js_1.getWeekRangeInMonth)(2024, 1, week);
                (0, vitest_1.expect)(result.endDate.getDay()).toBe(6);
            }
        });
        (0, vitest_1.it)('시작일과 종료일 간격은 6일이다', function () {
            var result = (0, date_js_1.getWeekRangeInMonth)(2024, 1, 1);
            var diffTime = result.endDate.getTime() - result.startDate.getTime();
            var diffDays = diffTime / (24 * 60 * 60 * 1000);
            (0, vitest_1.expect)(diffDays).toBe(6);
        });
    });
});
