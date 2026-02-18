/**
 * 전례 시기 계산 유틸리티 테스트
 *
 * 2026년 주요 전례 날짜:
 * - 주님 공현 대축일: 1/4 (일) → 주님 세례 축일: 1/11 (일)
 * - 연중 시기 전반부: 1/12 ~ 2/17
 * - 재의 수요일: 2/18
 * - 사순 시기: 2/18 ~ 4/4
 * - 부활 대축일: 4/5
 * - 부활 시기: 4/5 ~ 5/24
 * - 성령 강림 대축일: 5/24
 * - 연중 시기 후반부: 5/25 ~ 11/28
 * - 대림 제1주일: 11/29
 * - 성탄 대축일: 12/25
 */
import { getLiturgicalSeason } from '../src/liturgical.js';
import { describe, expect, it } from 'vitest';

describe('getLiturgicalSeason', () => {
    // 헬퍼: 로컬 날짜 생성
    const d = (month: number, day: number, year = 2026) => new Date(year, month - 1, day);

    describe('성탄 시기', () => {
        it('성탄 대축일(12/25)은 "성탄 대축일"이다', () => {
            const result = getLiturgicalSeason(d(12, 25));

            expect(result.season).toBe('성탄 대축일');
            expect(result.color).toBe('white');
        });

        it('12/26은 성탄 시기이다', () => {
            const result = getLiturgicalSeason(d(12, 26));

            expect(result.season).toBe('성탄 시기');
            expect(result.color).toBe('white');
        });

        it('12/31은 성탄 시기이다', () => {
            const result = getLiturgicalSeason(d(12, 31));

            expect(result.season).toBe('성탄 시기');
            expect(result.color).toBe('white');
        });

        it('1/1은 성탄 시기이다', () => {
            const result = getLiturgicalSeason(d(1, 1));

            expect(result.season).toBe('성탄 시기');
            expect(result.color).toBe('white');
        });

        it('주님 세례 축일(1/11)은 성탄 시기이다', () => {
            const result = getLiturgicalSeason(d(1, 11));

            expect(result.season).toBe('성탄 시기');
            expect(result.color).toBe('white');
        });
    });

    describe('연중 시기 전반부', () => {
        it('주님 세례 축일 다음 날(1/12)은 연중 제1주일이다', () => {
            const result = getLiturgicalSeason(d(1, 12));

            expect(result.season).toBe('연중 제1주일');
            expect(result.color).toBe('green');
        });

        it('재의 수요일 전날(2/17)은 연중 시기이다', () => {
            const result = getLiturgicalSeason(d(2, 17));

            expect(result.color).toBe('green');
        });
    });

    describe('사순 시기', () => {
        it('재의 수요일(2/18)은 "재의 수요일"이다', () => {
            const result = getLiturgicalSeason(d(2, 18));

            expect(result.season).toBe('재의 수요일');
            expect(result.color).toBe('purple');
        });

        it('재의 수요일 다음 날(2/19)은 사순 제1주일이다', () => {
            const result = getLiturgicalSeason(d(2, 19));

            expect(result.season).toBe('사순 제1주일');
            expect(result.color).toBe('purple');
        });

        it('성금요일(4/3)은 사순 시기이다', () => {
            const result = getLiturgicalSeason(d(4, 3));

            expect(result.color).toBe('purple');
        });

        it('성토요일(4/4)은 사순 시기이다', () => {
            const result = getLiturgicalSeason(d(4, 4));

            expect(result.color).toBe('purple');
        });
    });

    describe('부활 시기', () => {
        it('부활 대축일(4/5)은 "부활 대축일"이다', () => {
            const result = getLiturgicalSeason(d(4, 5));

            expect(result.season).toBe('부활 대축일');
            expect(result.color).toBe('white');
        });

        it('부활 다음 날(4/6)은 부활 제1주일이다', () => {
            const result = getLiturgicalSeason(d(4, 6));

            expect(result.season).toBe('부활 제1주일');
            expect(result.color).toBe('white');
        });

        it('성령 강림 대축일(5/24)은 빨강 전례색이다', () => {
            const result = getLiturgicalSeason(d(5, 24));

            expect(result.season).toBe('성령 강림 대축일');
            expect(result.color).toBe('red');
        });
    });

    describe('연중 시기 후반부', () => {
        it('성령 강림 다음 날(5/25)은 연중 시기이다', () => {
            const result = getLiturgicalSeason(d(5, 25));

            expect(result.color).toBe('green');
        });

        it('대림 전 주(11/28)은 연중 시기이다', () => {
            const result = getLiturgicalSeason(d(11, 28));

            expect(result.color).toBe('green');
        });
    });

    describe('대림 시기', () => {
        it('대림 제1주일(11/29)은 대림 시기이다', () => {
            const result = getLiturgicalSeason(d(11, 29));

            expect(result.season).toBe('대림 제1주일');
            expect(result.color).toBe('purple');
        });

        it('대림 제4주일 기간(12/24)은 대림 시기이다', () => {
            const result = getLiturgicalSeason(d(12, 24));

            expect(result.color).toBe('purple');
        });
    });

    describe('연도별 경계 조건', () => {
        it('2025년 부활 대축일(4/20)을 올바르게 판별한다', () => {
            const result = getLiturgicalSeason(d(4, 20, 2025));

            expect(result.season).toBe('부활 대축일');
            expect(result.color).toBe('white');
        });

        it('2027년 부활 대축일(3/28)을 올바르게 판별한다', () => {
            const result = getLiturgicalSeason(d(3, 28, 2027));

            expect(result.season).toBe('부활 대축일');
            expect(result.color).toBe('white');
        });
    });

    describe('한국 전례력 특수 규칙', () => {
        it('공현 대축일이 1/7인 경우 세례 축일은 다음 날(1/8 월)이다', () => {
            // 2024년: 1/7 = 일요일 (공현), 세례 = 1/8 (월)
            // 1/8은 성탄 시기여야 함
            const result = getLiturgicalSeason(d(1, 8, 2024));

            expect(result.season).toBe('성탄 시기');
            expect(result.color).toBe('white');
        });

        it('공현 대축일이 1/7인 경우 1/9부터 연중 시기이다', () => {
            // 2024년: 세례 = 1/8, 1/9부터 연중
            const result = getLiturgicalSeason(d(1, 9, 2024));

            expect(result.color).toBe('green');
        });
    });
});
