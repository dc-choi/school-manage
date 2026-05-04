import { normalizeStudentKey, studentKeyEquals, studentKeyToString } from '../src/student-key.js';
import { describe, expect, it } from 'vitest';

describe('normalizeStudentKey', () => {
    it('이름과 세례명을 trim한다', () => {
        const key = normalizeStudentKey('  박민수  ', '  베드로  ');
        expect(key).toEqual({ society: '박민수', catholic: '베드로' });
    });

    it('다중 공백을 단일 공백으로 치환한다', () => {
        const key = normalizeStudentKey('박  민수', '베드로   요한');
        expect(key).toEqual({ society: '박 민수', catholic: '베드로 요한' });
    });

    it('세례명이 undefined이면 catholic은 null', () => {
        const key = normalizeStudentKey('박민수');
        expect(key).toEqual({ society: '박민수', catholic: null });
    });

    it('세례명이 빈 문자열/공백이면 catholic은 null', () => {
        expect(normalizeStudentKey('박민수', '')).toEqual({ society: '박민수', catholic: null });
        expect(normalizeStudentKey('박민수', '   ')).toEqual({ society: '박민수', catholic: null });
    });
});

describe('studentKeyEquals', () => {
    it('두 필드가 모두 같으면 true', () => {
        expect(
            studentKeyEquals({ society: '박민수', catholic: '베드로' }, { society: '박민수', catholic: '베드로' })
        ).toBe(true);
    });

    it('이름만 같고 세례명이 다르면 false', () => {
        expect(
            studentKeyEquals({ society: '박민수', catholic: '베드로' }, { society: '박민수', catholic: '요한' })
        ).toBe(false);
    });

    it('한쪽만 catholic이 null이면 false', () => {
        expect(studentKeyEquals({ society: '박민수', catholic: null }, { society: '박민수', catholic: '베드로' })).toBe(
            false
        );
    });

    it('둘 다 catholic이 null이면 true', () => {
        expect(studentKeyEquals({ society: '박민수', catholic: null }, { society: '박민수', catholic: null })).toBe(
            true
        );
    });
});

describe('studentKeyToString', () => {
    it('catholic이 null이어도 충돌 없는 문자열 키를 만든다', () => {
        const a = studentKeyToString({ society: '박민수', catholic: null });
        const b = studentKeyToString({ society: '박민수', catholic: '' });
        expect(a).toBe(b);
        expect(a).not.toBe(studentKeyToString({ society: '박민수', catholic: '베드로' }));
    });
});
