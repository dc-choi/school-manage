import { describe, expect, it } from 'vitest';

describe('Vitest 환경 검증', () => {
    it('NODE_ENV가 test인지 확인', () => {
        expect(process.env.NODE_ENV).toBe('test');
    });

    it('jsdom 환경인지 확인', () => {
        expect(typeof window).toBe('object');
        expect(typeof document).toBe('object');
    });
});
