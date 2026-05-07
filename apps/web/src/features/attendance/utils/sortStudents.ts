export type SortKey = 'registration' | 'name';

export interface SortableStudent {
    id: string;
    societyName: string;
}

const collator = new Intl.Collator('ko');

const compareName = (a: SortableStudent, b: SortableStudent): number => {
    const byName = collator.compare(a.societyName, b.societyName);
    if (byName !== 0) return byName;
    return BigInt(a.id) < BigInt(b.id) ? -1 : BigInt(a.id) > BigInt(b.id) ? 1 : 0;
};

const compareRegistration = (a: SortableStudent, b: SortableStudent): number => {
    const ai = BigInt(a.id);
    const bi = BigInt(b.id);
    return ai < bi ? -1 : ai > bi ? 1 : 0;
};

/**
 * 학생 목록을 정렬 키에 따라 정렬한다.
 *
 * - registration: 학생 id 오름차순 (등록 순)
 * - name: 한글 가나다 (`Intl.Collator('ko')`), 동명이인은 id 보조
 */
export const sortStudents = <T extends SortableStudent>(students: T[], key: SortKey): T[] => {
    if (key === 'registration') return [...students].sort(compareRegistration);
    return [...students].sort(compareName);
};
