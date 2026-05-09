import { hasJongseong, josa } from '../src/josa';
import { describe, expect, it } from 'vitest';

describe('hasJongseong', () => {
    it('받침 있는 한글 → true', () => {
        expect(hasJongseong('학생')).toBe(true); // ㅇ
        expect(hasJongseong('학년')).toBe(true); // ㄴ
        expect(hasJongseong('그룹')).toBe(true); // ㅂ
        expect(hasJongseong('출석')).toBe(true); // ㄱ
    });

    it('받침 없는 한글 → false', () => {
        expect(hasJongseong('멤버')).toBe(false);
        expect(hasJongseong('단원')).toBe(true); // ㄴ
        expect(hasJongseong('회원')).toBe(true); // ㄴ
        expect(hasJongseong('레지오')).toBe(false);
    });

    it('빈 문자열은 false', () => {
        expect(hasJongseong('')).toBe(false);
    });

    it('영문/숫자는 보수적으로 false', () => {
        expect(hasJongseong('user')).toBe(false);
        expect(hasJongseong('123')).toBe(false);
    });
});

describe('josa', () => {
    it('받침 있는 단어에 받침 조사 붙임', () => {
        expect(josa('학생', '을/를')).toBe('학생을');
        expect(josa('학년', '이/가')).toBe('학년이');
        expect(josa('그룹', '은/는')).toBe('그룹은');
    });

    it('받침 없는 단어에 받침 없는 조사 붙임', () => {
        expect(josa('멤버', '을/를')).toBe('멤버를');
        expect(josa('레지오', '이/가')).toBe('레지오가');
        expect(josa('멤버', '은/는')).toBe('멤버는');
    });

    it('"와/과" 페어 — 한국어 어순이 반대(받침 있으면 "과")', () => {
        expect(josa('학생', '와/과')).toBe('학생과');
        expect(josa('멤버', '와/과')).toBe('멤버와');
    });
});
