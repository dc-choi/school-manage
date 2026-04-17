import { describe, expect, it } from 'vitest';
import { interpolateQuery } from '~/infrastructure/database/database.js';

describe('interpolateQuery (PII 마스킹)', () => {
    it('문자열 파라미터는 *** 로 마스킹', () => {
        const result = interpolateQuery(
            'SELECT * FROM account WHERE email = ? AND name = ?',
            JSON.stringify(['user@example.com', '홍길동'])
        );
        expect(result).toBe("SELECT * FROM account WHERE email = '***' AND name = '***'");
    });

    it('숫자 및 bigint 파라미터는 원값 유지', () => {
        const result = interpolateQuery(
            'SELECT * FROM student WHERE id = ? AND organization_id = ?',
            JSON.stringify([42, 100])
        );
        expect(result).toBe('SELECT * FROM student WHERE id = 42 AND organization_id = 100');
    });

    it('null 파라미터는 NULL 키워드로 치환', () => {
        const result = interpolateQuery('SELECT * FROM student WHERE deleted_at = ?', JSON.stringify([null]));
        expect(result).toBe('SELECT * FROM student WHERE deleted_at = NULL');
    });

    it('Date(ISO 문자열)는 *** 로 마스킹 (생일 등 PII 보호)', () => {
        // JSON.stringify는 Date를 ISO 문자열로 직렬화 → 문자열 규칙 적용
        const result = interpolateQuery(
            'SELECT * FROM student WHERE birth_date = ?',
            JSON.stringify([new Date('2010-05-15T00:00:00.000Z')])
        );
        expect(result).toBe("SELECT * FROM student WHERE birth_date = '***'");
    });

    it('숫자와 문자열 혼합 - 숫자만 노출', () => {
        const result = interpolateQuery(
            'UPDATE account SET password = ? WHERE id = ?',
            JSON.stringify(['hashed_secret_xyz', 7])
        );
        expect(result).toBe("UPDATE account SET password = '***' WHERE id = 7");
    });

    it('객체/배열은 *** 로 마스킹', () => {
        const result = interpolateQuery('INSERT INTO log (payload) VALUES (?)', JSON.stringify([{ foo: 'bar' }]));
        expect(result).toBe("INSERT INTO log (payload) VALUES ('***')");
    });

    it('빈 파라미터 배열 - 원본 쿼리 그대로', () => {
        const result = interpolateQuery('SELECT 1', JSON.stringify([]));
        expect(result).toBe('SELECT 1');
    });

    it('JSON 파싱 실패 시 원본 params 미노출', () => {
        const result = interpolateQuery('SELECT * FROM account WHERE email = ?', 'not-valid-json');
        expect(result).toBe('SELECT * FROM account WHERE email = ? -- params: <masked>');
        expect(result).not.toContain('not-valid-json');
    });
});
