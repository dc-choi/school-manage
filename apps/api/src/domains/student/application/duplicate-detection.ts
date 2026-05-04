/**
 * 학생 중복 검출 헬퍼 (로드맵 2단계 — 학생 등록 중복 확인)
 *
 * 이름·세례명 정규화 키로 동일 학생을 검출한다.
 * - 비교 대상: 같은 organizationId + deletedAt: null (졸업 학생 포함, 삭제 학생 제외)
 * - 정규화 함수는 `@school/utils`의 `normalizeStudentKey`를 사용
 *
 * 성능: 후보 fetch는 id/society/catholic만 가벼운 select로 수행하고,
 *       매칭된 후보(소수)에 한해서만 그룹 조인을 별도 쿼리로 수행한다.
 */
import type { ExistingStudentBrief } from '@school/shared';
import { type StudentKey, studentKeyEquals } from '@school/utils';
import { database } from '~/infrastructure/database/database.js';

interface LightCandidate {
    id: bigint;
    societyName: string;
    catholicName: string | null;
}

const fetchLightCandidates = (organizationId: string): Promise<LightCandidate[]> => {
    return database.student.findMany({
        where: {
            organizationId: BigInt(organizationId),
            deletedAt: null,
        },
        select: {
            id: true,
            societyName: true,
            catholicName: true,
        },
    });
};

const matchKey = (s: LightCandidate, target: StudentKey): boolean => {
    return studentKeyEquals(
        {
            society: s.societyName.trim().replace(/\s+/g, ' '),
            catholic: s.catholicName?.trim() ? s.catholicName.trim().replace(/\s+/g, ' ') : null,
        },
        target
    );
};

interface DetailedStudent {
    id: bigint;
    societyName: string;
    catholicName: string | null;
    createdAt: Date | null;
    studentGroups: Array<{ group: { name: string } | null }>;
}

const detailToBrief = (s: DetailedStudent): ExistingStudentBrief => ({
    id: String(s.id),
    societyName: s.societyName,
    catholicName: s.catholicName ?? undefined,
    groupNames: s.studentGroups.map((sg) => sg.group?.name).filter((name): name is string => !!name),
    createdAt: (s.createdAt ?? new Date(0)).toISOString(),
});

/**
 * 매칭된 학생 id들의 brief를 한 번에 조회한다 (그룹 포함).
 * 매칭이 없으면 빈 Map.
 */
export const loadBriefsByIds = async (ids: bigint[]): Promise<Map<string, ExistingStudentBrief>> => {
    if (ids.length === 0) return new Map();
    const detailed = (await database.student.findMany({
        where: { id: { in: ids } },
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
    })) as DetailedStudent[];

    const map = new Map<string, ExistingStudentBrief>();
    detailed.forEach((s) => {
        map.set(String(s.id), detailToBrief(s));
    });
    return map;
};

/**
 * 단건 검색: 가벼운 후보 fetch → 매칭된 1건만 brief 조회.
 */
export const findDuplicateInOrganization = async (
    organizationId: string,
    key: StudentKey
): Promise<ExistingStudentBrief | null> => {
    const candidates = await fetchLightCandidates(organizationId);
    const match = candidates.find((s) => matchKey(s, key));
    if (!match) return null;
    const briefs = await loadBriefsByIds([match.id]);
    return briefs.get(String(match.id)) ?? null;
};

export const matchExistingByKey = (candidates: LightCandidate[], key: StudentKey): LightCandidate | undefined => {
    return candidates.find((s) => matchKey(s, key));
};

export { fetchLightCandidates as fetchCandidates, matchKey };
export type { LightCandidate as CandidateStudent };
