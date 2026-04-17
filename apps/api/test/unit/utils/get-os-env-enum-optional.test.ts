import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getOsEnvEnumOptional } from '~/global/utils/utils.js';

const KEY = '__TEST_ENUM_ENV__';
const ALLOWED = ['off', 'slow', 'all'] as const;

describe('getOsEnvEnumOptional', () => {
    beforeEach(() => {
        delete process.env[KEY];
    });

    afterEach(() => {
        delete process.env[KEY];
    });

    it('미설정 시 default 반환', () => {
        expect(getOsEnvEnumOptional(KEY, ALLOWED, 'slow')).toBe('slow');
    });

    it('빈 문자열도 default 반환', () => {
        process.env[KEY] = '';
        expect(getOsEnvEnumOptional(KEY, ALLOWED, 'slow')).toBe('slow');
    });

    it('허용된 값은 그대로 반환', () => {
        process.env[KEY] = 'off';
        expect(getOsEnvEnumOptional(KEY, ALLOWED, 'slow')).toBe('off');
        process.env[KEY] = 'all';
        expect(getOsEnvEnumOptional(KEY, ALLOWED, 'slow')).toBe('all');
    });

    it('허용되지 않은 값은 throw', () => {
        process.env[KEY] = 'verbose';
        expect(() => getOsEnvEnumOptional(KEY, ALLOWED, 'slow')).toThrow(/must be one of \[off, slow, all\]/);
    });

    it('대소문자 구분하여 엄격 매칭', () => {
        process.env[KEY] = 'OFF';
        expect(() => getOsEnvEnumOptional(KEY, ALLOWED, 'slow')).toThrow(/must be one of/);
    });
});
