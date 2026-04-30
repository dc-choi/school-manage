/**
 * Check Duplicate UseCase (로드맵 2단계 — 학생 등록 중복 확인)
 *
 * 엑셀 Import 미리보기에서 호출하는 사전 검증 query.
 * - 입력 배열 내부 중복 → INTERNAL_DUP
 * - DB 기존 학생과 중복 → DB_DUP
 * 행이 양쪽 모두에 해당하면 INTERNAL_DUP 우선.
 */
import type { CheckDuplicateInput, DuplicateCheckOutput, DuplicateConflict } from '@school/shared';
import { normalizeStudentKey, studentKeyToString } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { fetchCandidates, matchExistingByKey, toBrief } from '~/domains/student/application/duplicate-detection.js';

export class CheckDuplicateUseCase {
    async execute(input: CheckDuplicateInput, organizationId: string): Promise<DuplicateCheckOutput> {
        try {
            const inputKeys = input.students.map((s) => normalizeStudentKey(s.societyName, s.catholicName));

            // 입력 내부 중복 그룹화
            const groups = new Map<string, number[]>();
            inputKeys.forEach((k, i) => {
                const ks = studentKeyToString(k);
                const arr = groups.get(ks) ?? [];
                arr.push(i);
                groups.set(ks, arr);
            });

            // DB 후보 fetch (organizationId + 재학생)
            const candidates = await fetchCandidates(organizationId);

            const conflicts: DuplicateConflict[] = [];
            input.students.forEach((_, i) => {
                const ks = studentKeyToString(inputKeys[i]);
                const groupIndices = groups.get(ks) ?? [i];
                const otherIndex = groupIndices.find((idx) => idx !== i);
                if (otherIndex !== undefined) {
                    conflicts.push({ index: i, reason: 'INTERNAL_DUP', otherIndex });
                    return;
                }
                const existing = matchExistingByKey(candidates, inputKeys[i]);
                if (existing) {
                    conflicts.push({ index: i, reason: 'DB_DUP', existing: toBrief(existing) });
                }
            });

            return { conflicts };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[CheckDuplicateUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '중복 검사에 실패했습니다.',
            });
        }
    }
}
