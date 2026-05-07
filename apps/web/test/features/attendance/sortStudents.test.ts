import type { StudentBase } from '@school/shared';
import { describe, expect, it } from 'vitest';
import { sortStudents } from '~/features/attendance/utils/sortStudents';

const makeStudent = (id: string, societyName: string): StudentBase => ({
    id,
    societyName,
    groups: [],
});

describe('sortStudents', () => {
    const students: StudentBase[] = [
        makeStudent('3', '박서연'),
        makeStudent('1', '김민준'),
        makeStudent('2', '이지우'),
    ];

    it('등록 순: id 오름차순', () => {
        const result = sortStudents(students, 'registration');
        expect(result.map((s) => s.id)).toEqual(['1', '2', '3']);
    });

    it('가나다: 한글 로케일 정렬', () => {
        const result = sortStudents(students, 'name');
        expect(result.map((s) => s.societyName)).toEqual(['김민준', '박서연', '이지우']);
    });

    it('가나다: 동명이인은 id 보조 정렬', () => {
        const dupes: StudentBase[] = [
            makeStudent('5', '김민준'),
            makeStudent('1', '김민준'),
            makeStudent('3', '박서연'),
        ];
        const result = sortStudents(dupes, 'name');
        expect(result.map((s) => s.id)).toEqual(['1', '5', '3']);
    });
});
