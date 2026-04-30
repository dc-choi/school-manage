/**
 * 학생 중복 검출 헬퍼 (로드맵 2단계 — 학생 등록 중복 확인)
 *
 * 이름·세례명 정규화 키로 동일 학생을 검출한다.
 * - 비교 대상: 같은 organizationId + deletedAt: null (졸업 학생 포함, 삭제 학생 제외)
 * - 정규화 함수는 `@school/utils`의 `normalizeStudentKey`를 사용
 */
import type { ExistingStudentBrief } from '@school/shared';
import { type StudentKey, studentKeyEquals } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

interface CandidateStudent {
    id: bigint;
    societyName: string;
    catholicName: string | null;
    createdAt: Date | null;
    studentGroups: Array<{ group: { name: string } | null }>;
}

const fetchCandidates = (organizationId: string): Promise<CandidateStudent[]> => {
    return database.student.findMany({
        where: {
            organizationId: BigInt(organizationId),
            deletedAt: null,
        },
        select: {
            id: true,
            societyName: true,
            catholicName: true,
            createdAt: true,
            studentGroups: {
                where: { group: { deletedAt: null } },
                select: { group: { select: { name: true } } },
            },
        },
    });
};

const toBrief = (s: CandidateStudent): ExistingStudentBrief => ({
    id: String(s.id),
    societyName: s.societyName,
    catholicName: s.catholicName ?? undefined,
    groupNames: s.studentGroups.map((sg) => sg.group?.name).filter((name): name is string => !!name),
    createdAt: (s.createdAt ?? new Date(0)).toISOString(),
});

const matchKey = (s: CandidateStudent, target: StudentKey): boolean => {
    return studentKeyEquals(
        {
            society: s.societyName.trim().replace(/\s+/g, ' '),
            catholic: s.catholicName?.trim() ? s.catholicName.trim().replace(/\s+/g, ' ') : null,
        },
        target
    );
};

export const findDuplicateInOrganization = async (
    organizationId: string,
    key: StudentKey
): Promise<ExistingStudentBrief | null> => {
    const candidates = await fetchCandidates(organizationId);
    const match = candidates.find((s) => matchKey(s, key));
    return match ? toBrief(match) : null;
};

export const matchExistingByKey = (candidates: CandidateStudent[], key: StudentKey): CandidateStudent | undefined => {
    return candidates.find((s) => matchKey(s, key));
};

export { fetchCandidates, toBrief, matchKey };
export type { CandidateStudent };
