import { normalizeChurchName } from '../src/church-name.js';
import { describe, expect, it } from 'vitest';

describe('normalizeChurchName', () => {
    it('앞뒤 공백을 제거한다', () => {
        expect(normalizeChurchName('  반포동성당  ')).toBe('반포동성당');
    });

    it('내부 공백을 모두 제거한다', () => {
        expect(normalizeChurchName('반포동 성당')).toBe('반포동성당');
        expect(normalizeChurchName('반포동  성당')).toBe('반포동성당');
    });

    it('탭/개행 등 모든 공백 문자를 제거한다', () => {
        expect(normalizeChurchName('반포동\t성당\n')).toBe('반포동성당');
    });

    it('공백 위치/개수만 다른 입력은 동일한 정규화 결과를 낸다', () => {
        expect(normalizeChurchName('반포동성당')).toBe(normalizeChurchName(' 반포동 성당 '));
    });

    it('글자가 다르면 정규화 결과도 다르다 (유사명 병합 안 함)', () => {
        expect(normalizeChurchName('반포동성당')).not.toBe(normalizeChurchName('반포4동성당'));
    });

    it('공백만 있는 입력은 빈 문자열이 된다', () => {
        expect(normalizeChurchName('   ')).toBe('');
    });
});
