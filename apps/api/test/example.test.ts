import { describe, expect, it } from 'vitest';

describe('Vitest 환경 검증', () => {
    it('NODE_ENV가 test인지 확인', () => {
        expect(process.env.NODE_ENV).toBe('test');
    });

    it('테스트가 정상 실행되는지 확인', () => {
        expect(1 + 1).toBe(2);
    });
});
