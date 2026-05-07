import type { AttendanceItem, StudentBase } from '@school/shared';

export type SortKey = 'registration' | 'name' | 'top_attendance';

const collator = new Intl.Collator('ko');

const compareName = (a: StudentBase, b: StudentBase): number => {
    const byName = collator.compare(a.societyName, b.societyName);
    if (byName !== 0) return byName;
    return BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0;
};

const compareRegistration = (a: StudentBase, b: StudentBase): number => {
    const ai = BigInt(a.id);
    const bi = BigInt(b.id);
    return ai < bi ? -1 : ai > bi ? 1 : 0;
};

const SCORE_BY_MARK: Record<string, number> = {
    '◎': 2,
    '○': 1,
    '△': 1,
};

const buildScoreMap = (attendances: AttendanceItem[]): Map<string, number> => {
    const scoreByStudent = new Map<string, number>();
    for (const a of attendances) {
        const score = SCORE_BY_MARK[a.content] ?? 0;
        if (score === 0) continue;
        scoreByStudent.set(a.studentId, (scoreByStudent.get(a.studentId) ?? 0) + score);
    }
    return scoreByStudent;
};

/**
 * 학생 목록을 정렬 키에 따라 정렬한다.
 *
 * - registration: 학생 id 오름차순 (등록 순)
 * - name: 한글 가나다 (`Intl.Collator('ko')`), 동명이인은 id 보조
 * - top_attendance: 누적 점수 내림차순 (◎=2, ○=1, △=1, 그 외=0). 동점은 가나다, 그 다음 id 보조
 */
export const sortStudents = (students: StudentBase[], attendances: AttendanceItem[], key: SortKey): StudentBase[] => {
    if (key === 'registration') return [...students].sort(compareRegistration);
    if (key === 'name') return [...students].sort(compareName);

    const scoreByStudent = buildScoreMap(attendances);
    return [...students].sort((a, b) => {
        const sa = scoreByStudent.get(a.id) ?? 0;
        const sb = scoreByStudent.get(b.id) ?? 0;
        if (sa !== sb) return sb - sa;
        return compareName(a, b);
    });
};
