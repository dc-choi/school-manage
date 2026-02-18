/**
 * 포맷팅 유틸리티 테스트
 */
import { formatContact, formatDateCompact, formatDateISO, formatDateShortKR } from '../src/format.js';
import { describe, expect, it } from 'vitest';

describe('format 유틸리티', () => {
    describe('formatContact', () => {
        it('11자리 숫자를 010-XXXX-XXXX 형식으로 포맷한다', () => {
            const result = formatContact(1012345678);

            // 앞에 0이 붙어서 01012345678이 됨
            expect(result).toBe('010-1234-5678');
        });

        it('이미 11자리인 숫자를 올바르게 포맷한다', () => {
            // 실제로는 BigInt 범위이지만, 일반 숫자로 처리 가능한 범위
            const result = formatContact(1098765432);

            expect(result).toBe('010-9876-5432');
        });

        it('null을 입력하면 "-"를 반환한다', () => {
            const result = formatContact(null);

            expect(result).toBe('-');
        });

        it('undefined를 입력하면 "-"를 반환한다', () => {
            const result = formatContact(undefined);

            expect(result).toBe('-');
        });

        it('0을 입력하면 "-"를 반환한다', () => {
            const result = formatContact(0);

            expect(result).toBe('-');
        });

        it('10자리 숫자를 11자리로 패딩하여 포맷한다', () => {
            // 10자리: 1012341234 → 01012341234
            const result = formatContact(1012341234);

            expect(result).toBe('010-1234-1234');
        });
    });

    describe('formatDateCompact', () => {
        it('날짜를 YYYYMMDD 형식으로 변환한다', () => {
            const date = new Date(2024, 0, 15); // 2024-01-15
            const result = formatDateCompact(date);

            expect(result).toBe('20240115');
        });

        it('한 자리 월을 두 자리로 패딩한다', () => {
            const date = new Date(2024, 0, 5); // 2024-01-05
            const result = formatDateCompact(date);

            expect(result).toBe('20240105');
        });

        it('한 자리 일을 두 자리로 패딩한다', () => {
            const date = new Date(2024, 8, 5); // 2024-09-05
            const result = formatDateCompact(date);

            expect(result).toBe('20240905');
        });

        it('12월을 올바르게 처리한다', () => {
            const date = new Date(2024, 11, 31); // 2024-12-31
            const result = formatDateCompact(date);

            expect(result).toBe('20241231');
        });

        it('연도가 다른 경우도 정확히 처리한다', () => {
            const date = new Date(2025, 5, 20); // 2025-06-20
            const result = formatDateCompact(date);

            expect(result).toBe('20250620');
        });
    });

    describe('formatDateISO', () => {
        it('날짜를 YYYY-MM-DD 형식으로 변환한다', () => {
            const date = new Date(2024, 0, 15); // 2024-01-15
            const result = formatDateISO(date);

            expect(result).toBe('2024-01-15');
        });

        it('한 자리 월을 두 자리로 패딩한다', () => {
            const date = new Date(2024, 0, 5); // 2024-01-05
            const result = formatDateISO(date);

            expect(result).toBe('2024-01-05');
        });

        it('한 자리 일을 두 자리로 패딩한다', () => {
            const date = new Date(2024, 8, 5); // 2024-09-05
            const result = formatDateISO(date);

            expect(result).toBe('2024-09-05');
        });

        it('12월을 올바르게 처리한다', () => {
            const date = new Date(2024, 11, 31); // 2024-12-31
            const result = formatDateISO(date);

            expect(result).toBe('2024-12-31');
        });

        it('연도가 다른 경우도 정확히 처리한다', () => {
            const date = new Date(2025, 5, 20); // 2025-06-20
            const result = formatDateISO(date);

            expect(result).toBe('2025-06-20');
        });

        it('윤년 2월 29일을 정확히 처리한다', () => {
            const date = new Date(2024, 1, 29); // 2024-02-29 (윤년)
            const result = formatDateISO(date);

            expect(result).toBe('2024-02-29');
        });
    });

    describe('formatDateShortKR', () => {
        it('날짜를 "M/D (요일)" 형식으로 변환한다', () => {
            // 2026-04-05 = 일요일
            const result = formatDateShortKR('2026-04-05');

            expect(result).toBe('4/5 (일)');
        });

        it('한 자리 월/일을 앞자리 0 없이 표시한다', () => {
            // 2026-01-04 = 일요일
            const result = formatDateShortKR('2026-01-04');

            expect(result).toBe('1/4 (일)');
        });

        it('두 자리 월/일을 올바르게 표시한다', () => {
            // 2026-12-25 = 금요일
            const result = formatDateShortKR('2026-12-25');

            expect(result).toBe('12/25 (금)');
        });

        it('각 요일을 올바르게 표시한다', () => {
            // 2026-02-16 = 월요일
            expect(formatDateShortKR('2026-02-16')).toBe('2/16 (월)');
            // 2026-02-17 = 화요일
            expect(formatDateShortKR('2026-02-17')).toBe('2/17 (화)');
            // 2026-02-18 = 수요일
            expect(formatDateShortKR('2026-02-18')).toBe('2/18 (수)');
            // 2026-02-19 = 목요일
            expect(formatDateShortKR('2026-02-19')).toBe('2/19 (목)');
            // 2026-02-20 = 금요일
            expect(formatDateShortKR('2026-02-20')).toBe('2/20 (금)');
            // 2026-02-21 = 토요일
            expect(formatDateShortKR('2026-02-21')).toBe('2/21 (토)');
            // 2026-02-22 = 일요일
            expect(formatDateShortKR('2026-02-22')).toBe('2/22 (일)');
        });
    });
});
