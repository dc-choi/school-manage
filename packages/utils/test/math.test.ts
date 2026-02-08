/**
 * 수학/계산 유틸리티 테스트
 */
import { calculateRate, roundToDecimal } from '../src/math.js';
import { describe, expect, it } from 'vitest';

describe('math 유틸리티', () => {
    describe('roundToDecimal', () => {
        it('기본값(1자리)으로 반올림한다', () => {
            const result = roundToDecimal(85.567);

            expect(result).toBe(85.6);
        });

        it('소수점 2자리로 반올림한다', () => {
            const result = roundToDecimal(85.5678, 2);

            expect(result).toBe(85.57);
        });

        it('소수점 0자리(정수)로 반올림한다', () => {
            const result = roundToDecimal(85.567, 0);

            expect(result).toBe(86);
        });

        it('소수점 3자리로 반올림한다', () => {
            const result = roundToDecimal(85.56789, 3);

            expect(result).toBe(85.568);
        });

        it('이미 정확한 자릿수인 경우 그대로 반환한다', () => {
            const result = roundToDecimal(85.5, 1);

            expect(result).toBe(85.5);
        });

        it('0을 반올림하면 0을 반환한다', () => {
            const result = roundToDecimal(0, 2);

            expect(result).toBe(0);
        });

        it('음수를 올바르게 반올림한다', () => {
            const result = roundToDecimal(-85.567, 1);

            expect(result).toBe(-85.6);
        });

        it('0.5를 반올림한다 (round half up)', () => {
            const result = roundToDecimal(85.55, 1);

            expect(result).toBe(85.6);
        });

        it('0.4를 내림한다', () => {
            const result = roundToDecimal(85.54, 1);

            expect(result).toBe(85.5);
        });

        it('매우 작은 수를 처리한다', () => {
            const result = roundToDecimal(0.00123, 4);

            expect(result).toBe(0.0012);
        });
    });

    describe('calculateRate', () => {
        it('비율을 정확히 계산한다 (80%)', () => {
            const result = calculateRate(80, 100);

            expect(result).toBe(80);
        });

        it('비율을 정확히 계산한다 (소수점 포함)', () => {
            const result = calculateRate(85, 100);

            expect(result).toBe(85);
        });

        it('100% 초과 비율을 계산한다', () => {
            const result = calculateRate(120, 100);

            expect(result).toBe(120);
        });

        it('0%를 계산한다', () => {
            const result = calculateRate(0, 100);

            expect(result).toBe(0);
        });

        it('expected가 0일 때 0을 반환한다 (division by zero 방지)', () => {
            const result = calculateRate(100, 0);

            expect(result).toBe(0);
        });

        it('소수점 2자리로 비율을 계산한다', () => {
            const result = calculateRate(85, 99, 2);

            expect(result).toBe(85.86);
        });

        it('기본 소수점 1자리로 반올림한다', () => {
            const result = calculateRate(85, 99);

            expect(result).toBe(85.9);
        });

        it('작은 수에서 비율을 계산한다', () => {
            const result = calculateRate(3, 10);

            expect(result).toBe(30);
        });

        it('actual과 expected가 같으면 100을 반환한다', () => {
            const result = calculateRate(50, 50);

            expect(result).toBe(100);
        });

        it('소수점 0자리로 비율을 계산한다', () => {
            const result = calculateRate(85, 99, 0);

            expect(result).toBe(86);
        });
    });
});
