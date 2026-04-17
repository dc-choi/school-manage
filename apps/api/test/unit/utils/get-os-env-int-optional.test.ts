import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getOsEnvIntOptional } from '~/global/utils/utils.js';

const KEY = '__TEST_INT_ENV__';

describe('getOsEnvIntOptional', () => {
    beforeEach(() => {
        delete process.env[KEY];
    });

    afterEach(() => {
        delete process.env[KEY];
    });

    it('미설정 시 default 반환', () => {
        expect(getOsEnvIntOptional(KEY, 10, 1, 100)).toBe(10);
    });

    it('빈 문자열도 default 반환', () => {
        process.env[KEY] = '';
        expect(getOsEnvIntOptional(KEY, 10, 1, 100)).toBe(10);
    });

    it('정상 정수 문자열은 그대로 반환', () => {
        process.env[KEY] = '30';
        expect(getOsEnvIntOptional(KEY, 10, 1, 100)).toBe(30);
    });

    it('범위 경계값 (min/max) 허용', () => {
        process.env[KEY] = '1';
        expect(getOsEnvIntOptional(KEY, 10, 1, 100)).toBe(1);
        process.env[KEY] = '100';
        expect(getOsEnvIntOptional(KEY, 10, 1, 100)).toBe(100);
    });

    it('비정수 문자열은 throw', () => {
        process.env[KEY] = 'abc';
        expect(() => getOsEnvIntOptional(KEY, 10, 1, 100)).toThrow(/must be an integer/);
    });

    it('범위 미만은 throw', () => {
        process.env[KEY] = '0';
        expect(() => getOsEnvIntOptional(KEY, 10, 1, 100)).toThrow(/must be an integer in \[1, 100\]/);
    });

    it('범위 초과는 throw', () => {
        process.env[KEY] = '200';
        expect(() => getOsEnvIntOptional(KEY, 10, 1, 100)).toThrow(/must be an integer in \[1, 100\]/);
    });

    it('음수는 throw', () => {
        process.env[KEY] = '-5';
        expect(() => getOsEnvIntOptional(KEY, 10, 1, 100)).toThrow(/must be an integer/);
    });
});
