/**
 * StatisticsPage URL 쿼리 파싱 로직 검증 (mobile-ux-revamp)
 */
import { describe, expect, it } from 'vitest';
import { parseIntParam } from '~/pages/statistics/StatisticsPage';

describe('parseIntParam', () => {
    it('null/빈 문자열 → undefined', () => {
        expect(parseIntParam(null)).toBeUndefined();
        expect(parseIntParam('')).toBeUndefined();
    });

    it('정수 문자열 → 숫자', () => {
        expect(parseIntParam('5')).toBe(5);
        expect(parseIntParam('2026')).toBe(2026);
        expect(parseIntParam('0')).toBe(0);
    });

    it('소수 문자열 → 정수 부분만 (parseInt 표준 동작)', () => {
        expect(parseIntParam('5.7')).toBe(5);
    });

    it('비숫자 문자열 → undefined (Number.isFinite=false)', () => {
        expect(parseIntParam('abc')).toBeUndefined();
        expect(parseIntParam('NaN')).toBeUndefined();
    });

    it('숫자가 섞인 문자열 → 앞쪽 정수만 (parseInt 동작)', () => {
        expect(parseIntParam('5abc')).toBe(5);
    });
});
