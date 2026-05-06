/**
 * 포맷팅 유틸리티 테스트
 */
import { formatContact, formatDateCompact, formatDateISO, formatDateShortKR } from '../src/format.js';
import { describe, expect, it } from 'vitest';

describe('format 유틸리티', () => {
    describe('formatContact', () => {
        it('11자리 휴대폰 문자열을 010-XXXX-XXXX 형식으로 포맷한다', () => {
            const result = formatContact('01012345678');

            expect(result).toBe('010-1234-5678');
        });

        it('11자리 다른 prefix(011/016/017/018/019)도 정상 포맷한다', () => {
            expect(formatContact('01112345678')).toBe('011-1234-5678');
            expect(formatContact('01612345678')).toBe('016-1234-5678');
        });

        it('10자리 일반전화는 3-3-4 형식으로 포맷한다 (서울 외 지역번호)', () => {
            // 0212345678 (서울 02 + 8자리)
            expect(formatContact('0212345678')).toBe('021-234-5678');
            // 0311234567 (경기 031 + 7자리)
            expect(formatContact('0311234567')).toBe('031-123-4567');
        });

        it('null을 입력하면 "-"를 반환한다', () => {
            const result = formatContact(null);

            expect(result).toBe('-');
        });

        it('undefined를 입력하면 "-"를 반환한다', () => {
            const result = formatContact(undefined);

            expect(result).toBe('-');
        });

        it('빈 문자열을 입력하면 "-"를 반환한다', () => {
            const result = formatContact('');

            expect(result).toBe('-');
        });

        it('11자리 하이픈 포함 문자열은 디지트 추출 후 포맷한다', () => {
            const result = formatContact('010-1234-5678');

            expect(result).toBe('010-1234-5678');
        });

        it('11자리 공백 포함 문자열은 디지트 추출 후 포맷한다', () => {
            const result = formatContact('010 1234 5678');

            expect(result).toBe('010-1234-5678');
        });

        it('비표준 길이는 디지트 그대로 반환한다 (해외번호 등)', () => {
            // 12~15자리는 디지트 그대로 (분리 분기 없음)
            expect(formatContact('821012345678')).toBe('821012345678');
            // 8~9자리도 그대로
            expect(formatContact('12345678')).toBe('12345678');
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

    describe('formatKSTDateISO', () => {
        it('YYYY-MM-DD 형식의 KST 날짜를 반환한다', async () => {
            const { formatKSTDateISO } = await import('../src/format.js');
            const result = formatKSTDateISO();

            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        });

        it('getNowKST()와 달리 이중 오프셋이 발생하지 않는다', async () => {
            const { formatKSTDateISO } = await import('../src/format.js');
            // 고정 시간 테스트: 2026-03-22 21:00 KST = 2026-03-22 12:00 UTC
            const date = new Date(Date.UTC(2026, 2, 22, 12, 0, 0));
            const result = formatKSTDateISO(date);

            expect(result).toBe('2026-03-22');
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
