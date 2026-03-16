/**
 * 토요일 날짜 보정 테스트 (특전미사 반영)
 *
 * 2026년 기준:
 * - 부활 대축일: 4/5 (일)
 * - 성토요일: 4/4 (토)
 * - 일반 토요일 예시: 3/14 (토)
 */
import { describe, expect, it } from 'vitest';
import { adjustForSaturday } from '~/domains/liturgical/application/get-season.usecase.js';

describe('adjustForSaturday', () => {
    const d = (month: number, day: number, year = 2026) => new Date(year, month - 1, day);

    it('일반 토요일(3/14)은 일요일(3/15)로 보정된다', () => {
        const result = adjustForSaturday(d(3, 14), 2026);

        expect(result.getDate()).toBe(15);
        expect(result.getMonth()).toBe(2); // 3월
    });

    it('성토요일(4/4)은 보정되지 않는다', () => {
        const result = adjustForSaturday(d(4, 4), 2026);

        expect(result.getDate()).toBe(4);
        expect(result.getMonth()).toBe(3); // 4월
    });

    it('일요일(3/15)은 보정되지 않는다', () => {
        const result = adjustForSaturday(d(3, 15), 2026);

        expect(result.getDate()).toBe(15);
    });

    it('평일(3/11 수요일)은 보정되지 않는다', () => {
        const result = adjustForSaturday(d(3, 11), 2026);

        expect(result.getDate()).toBe(11);
    });
});
