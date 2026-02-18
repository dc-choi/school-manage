"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 포맷팅 유틸리티 테스트
 */
var format_js_1 = require("../src/format.js");
var vitest_1 = require("vitest");
(0, vitest_1.describe)('format 유틸리티', function () {
    (0, vitest_1.describe)('formatContact', function () {
        (0, vitest_1.it)('11자리 숫자를 010-XXXX-XXXX 형식으로 포맷한다', function () {
            var result = (0, format_js_1.formatContact)(1012345678);
            // 앞에 0이 붙어서 01012345678이 됨
            (0, vitest_1.expect)(result).toBe('010-1234-5678');
        });
        (0, vitest_1.it)('이미 11자리인 숫자를 올바르게 포맷한다', function () {
            // 실제로는 BigInt 범위이지만, 일반 숫자로 처리 가능한 범위
            var result = (0, format_js_1.formatContact)(1098765432);
            (0, vitest_1.expect)(result).toBe('010-9876-5432');
        });
        (0, vitest_1.it)('null을 입력하면 "-"를 반환한다', function () {
            var result = (0, format_js_1.formatContact)(null);
            (0, vitest_1.expect)(result).toBe('-');
        });
        (0, vitest_1.it)('undefined를 입력하면 "-"를 반환한다', function () {
            var result = (0, format_js_1.formatContact)(undefined);
            (0, vitest_1.expect)(result).toBe('-');
        });
        (0, vitest_1.it)('0을 입력하면 "-"를 반환한다', function () {
            var result = (0, format_js_1.formatContact)(0);
            (0, vitest_1.expect)(result).toBe('-');
        });
        (0, vitest_1.it)('10자리 숫자를 11자리로 패딩하여 포맷한다', function () {
            // 10자리: 1012341234 → 01012341234
            var result = (0, format_js_1.formatContact)(1012341234);
            (0, vitest_1.expect)(result).toBe('010-1234-1234');
        });
    });
    (0, vitest_1.describe)('formatDateCompact', function () {
        (0, vitest_1.it)('날짜를 YYYYMMDD 형식으로 변환한다', function () {
            var date = new Date(2024, 0, 15); // 2024-01-15
            var result = (0, format_js_1.formatDateCompact)(date);
            (0, vitest_1.expect)(result).toBe('20240115');
        });
        (0, vitest_1.it)('한 자리 월을 두 자리로 패딩한다', function () {
            var date = new Date(2024, 0, 5); // 2024-01-05
            var result = (0, format_js_1.formatDateCompact)(date);
            (0, vitest_1.expect)(result).toBe('20240105');
        });
        (0, vitest_1.it)('한 자리 일을 두 자리로 패딩한다', function () {
            var date = new Date(2024, 8, 5); // 2024-09-05
            var result = (0, format_js_1.formatDateCompact)(date);
            (0, vitest_1.expect)(result).toBe('20240905');
        });
        (0, vitest_1.it)('12월을 올바르게 처리한다', function () {
            var date = new Date(2024, 11, 31); // 2024-12-31
            var result = (0, format_js_1.formatDateCompact)(date);
            (0, vitest_1.expect)(result).toBe('20241231');
        });
        (0, vitest_1.it)('연도가 다른 경우도 정확히 처리한다', function () {
            var date = new Date(2025, 5, 20); // 2025-06-20
            var result = (0, format_js_1.formatDateCompact)(date);
            (0, vitest_1.expect)(result).toBe('20250620');
        });
    });
    (0, vitest_1.describe)('formatDateISO', function () {
        (0, vitest_1.it)('날짜를 YYYY-MM-DD 형식으로 변환한다', function () {
            var date = new Date(2024, 0, 15); // 2024-01-15
            var result = (0, format_js_1.formatDateISO)(date);
            (0, vitest_1.expect)(result).toBe('2024-01-15');
        });
        (0, vitest_1.it)('한 자리 월을 두 자리로 패딩한다', function () {
            var date = new Date(2024, 0, 5); // 2024-01-05
            var result = (0, format_js_1.formatDateISO)(date);
            (0, vitest_1.expect)(result).toBe('2024-01-05');
        });
        (0, vitest_1.it)('한 자리 일을 두 자리로 패딩한다', function () {
            var date = new Date(2024, 8, 5); // 2024-09-05
            var result = (0, format_js_1.formatDateISO)(date);
            (0, vitest_1.expect)(result).toBe('2024-09-05');
        });
        (0, vitest_1.it)('12월을 올바르게 처리한다', function () {
            var date = new Date(2024, 11, 31); // 2024-12-31
            var result = (0, format_js_1.formatDateISO)(date);
            (0, vitest_1.expect)(result).toBe('2024-12-31');
        });
        (0, vitest_1.it)('연도가 다른 경우도 정확히 처리한다', function () {
            var date = new Date(2025, 5, 20); // 2025-06-20
            var result = (0, format_js_1.formatDateISO)(date);
            (0, vitest_1.expect)(result).toBe('2025-06-20');
        });
        (0, vitest_1.it)('윤년 2월 29일을 정확히 처리한다', function () {
            var date = new Date(2024, 1, 29); // 2024-02-29 (윤년)
            var result = (0, format_js_1.formatDateISO)(date);
            (0, vitest_1.expect)(result).toBe('2024-02-29');
        });
    });
    (0, vitest_1.describe)('formatDateShortKR', function () {
        (0, vitest_1.it)('날짜를 "M/D (요일)" 형식으로 변환한다', function () {
            // 2026-04-05 = 일요일
            var result = (0, format_js_1.formatDateShortKR)('2026-04-05');
            (0, vitest_1.expect)(result).toBe('4/5 (일)');
        });
        (0, vitest_1.it)('한 자리 월/일을 앞자리 0 없이 표시한다', function () {
            // 2026-01-04 = 일요일
            var result = (0, format_js_1.formatDateShortKR)('2026-01-04');
            (0, vitest_1.expect)(result).toBe('1/4 (일)');
        });
        (0, vitest_1.it)('두 자리 월/일을 올바르게 표시한다', function () {
            // 2026-12-25 = 금요일
            var result = (0, format_js_1.formatDateShortKR)('2026-12-25');
            (0, vitest_1.expect)(result).toBe('12/25 (금)');
        });
        (0, vitest_1.it)('각 요일을 올바르게 표시한다', function () {
            // 2026-02-16 = 월요일
            (0, vitest_1.expect)((0, format_js_1.formatDateShortKR)('2026-02-16')).toBe('2/16 (월)');
            // 2026-02-17 = 화요일
            (0, vitest_1.expect)((0, format_js_1.formatDateShortKR)('2026-02-17')).toBe('2/17 (화)');
            // 2026-02-18 = 수요일
            (0, vitest_1.expect)((0, format_js_1.formatDateShortKR)('2026-02-18')).toBe('2/18 (수)');
            // 2026-02-19 = 목요일
            (0, vitest_1.expect)((0, format_js_1.formatDateShortKR)('2026-02-19')).toBe('2/19 (목)');
            // 2026-02-20 = 금요일
            (0, vitest_1.expect)((0, format_js_1.formatDateShortKR)('2026-02-20')).toBe('2/20 (금)');
            // 2026-02-21 = 토요일
            (0, vitest_1.expect)((0, format_js_1.formatDateShortKR)('2026-02-21')).toBe('2/21 (토)');
            // 2026-02-22 = 일요일
            (0, vitest_1.expect)((0, format_js_1.formatDateShortKR)('2026-02-22')).toBe('2/22 (일)');
        });
    });
});
