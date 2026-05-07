/**
 * StatisticsPage URL 쿼리 파싱 로직 검증 (mobile-ux-revamp + daily-stats-dashboard)
 */
import { describe, expect, it } from 'vitest';
import { parseDayParam, parseIntParam } from '~/pages/statistics/StatisticsPage';

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

describe('parseDayParam', () => {
    it('null/빈 문자열 → undefined', () => {
        expect(parseDayParam(null)).toBeUndefined();
        expect(parseDayParam('')).toBeUndefined();
    });

    it('YYYY-MM-DD 형식 → 그대로 반환', () => {
        expect(parseDayParam('2026-05-07')).toBe('2026-05-07');
        expect(parseDayParam('2024-01-01')).toBe('2024-01-01');
    });

    it('잘못된 형식 → undefined', () => {
        expect(parseDayParam('2026/05/07')).toBeUndefined();
        expect(parseDayParam('2026-5-7')).toBeUndefined();
        expect(parseDayParam('20260507')).toBeUndefined();
        expect(parseDayParam('not-a-date')).toBeUndefined();
    });
});
