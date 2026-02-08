/**
 * 객체 유틸리티 테스트
 */
import { prune } from '../src/object.js';
import { describe, expect, it } from 'vitest';

describe('object 유틸리티', () => {
    describe('prune', () => {
        it('null 값을 가진 속성을 제거한다', () => {
            const obj = { a: 1, b: null, c: 3 };
            const result = prune(obj);

            expect(result).toEqual({ a: 1, c: 3 });
            expect('b' in result).toBe(false);
        });

        it('undefined 값을 가진 속성을 제거한다', () => {
            const obj = { a: 1, b: undefined, c: 3 };
            const result = prune(obj);

            expect(result).toEqual({ a: 1, c: 3 });
            expect('b' in result).toBe(false);
        });

        it('null과 undefined를 모두 제거한다', () => {
            const obj = { a: 1, b: null, c: undefined, d: 4 };
            const result = prune(obj);

            expect(result).toEqual({ a: 1, d: 4 });
            expect('b' in result).toBe(false);
            expect('c' in result).toBe(false);
        });

        it('falsy 값 중 0은 유지한다', () => {
            const obj = { a: 0, b: null, c: 3 };
            const result = prune(obj);

            expect(result).toEqual({ a: 0, c: 3 });
            expect('a' in result).toBe(true);
        });

        it('falsy 값 중 빈 문자열은 유지한다', () => {
            const obj = { a: '', b: null, c: 3 };
            const result = prune(obj);

            expect(result).toEqual({ a: '', c: 3 });
            expect('a' in result).toBe(true);
        });

        it('falsy 값 중 false는 유지한다', () => {
            const obj = { a: false, b: null, c: 3 };
            const result = prune(obj);

            expect(result).toEqual({ a: false, c: 3 });
            expect('a' in result).toBe(true);
        });

        it('빈 객체를 입력하면 빈 객체를 반환한다', () => {
            const obj = {};
            const result = prune(obj);

            expect(result).toEqual({});
        });

        it('모든 속성이 null/undefined면 빈 객체를 반환한다', () => {
            const obj = { a: null, b: undefined };
            const result = prune(obj);

            expect(result).toEqual({});
        });

        it('null/undefined가 없으면 동일한 객체를 반환한다', () => {
            const obj = { a: 1, b: 'hello', c: true };
            const result = prune(obj);

            expect(result).toEqual({ a: 1, b: 'hello', c: true });
        });

        it('원본 객체를 변경하지 않는다', () => {
            const obj = { a: 1, b: null, c: 3 };
            const original = { ...obj };

            prune(obj);

            expect(obj).toEqual(original);
        });

        it('중첩 객체의 null/undefined는 제거하지 않는다 (shallow)', () => {
            const obj = { a: 1, b: { c: null }, d: 3 };
            const result = prune(obj);

            expect(result).toEqual({ a: 1, b: { c: null }, d: 3 });
            expect((result as any).b.c).toBeNull();
        });

        it('배열 값은 유지한다', () => {
            const obj = { a: [1, 2, 3], b: null };
            const result = prune(obj);

            expect(result).toEqual({ a: [1, 2, 3] });
        });

        it('Date 값은 유지한다', () => {
            const date = new Date();
            const obj = { a: date, b: null };
            const result = prune(obj);

            expect(result).toEqual({ a: date });
        });
    });
});
