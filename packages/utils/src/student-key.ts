/**
 * 학생 식별 키 정규화
 *
 * 이름·세례명을 기반으로 동일 학생 여부를 판별할 때 사용한다.
 * - trim 후 다중 공백을 단일 공백으로 치환
 * - 세례명이 비어있으면 null 보존 (NULL은 NULL과만 일치)
 */
export interface StudentKey {
    society: string;
    catholic: string | null;
}

const collapseSpaces = (value: string): string => value.trim().replace(/\s+/g, ' ');

export const normalizeStudentKey = (societyName: string, catholicName?: string | null): StudentKey => {
    const society = collapseSpaces(societyName);
    const trimmedCatholic = catholicName?.trim();
    const catholic = trimmedCatholic ? collapseSpaces(trimmedCatholic) : null;
    return { society, catholic };
};

export const studentKeyEquals = (a: StudentKey, b: StudentKey): boolean => {
    return a.society === b.society && a.catholic === b.catholic;
};

export const studentKeyToString = (key: StudentKey): string => {
    return `${key.society}${key.catholic ?? ''}`;
};
