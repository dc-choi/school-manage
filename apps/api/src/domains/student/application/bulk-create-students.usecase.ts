/**
 * Bulk Create Students UseCase
 *
 * 엑셀 Import를 통한 학생 일괄 등록 (로드맵 2단계)
 * + 학생 등록 중복 확인 (로드맵 2단계 — 입력 내부/DB 중복 검증)
 */
import type { BulkCreateSkipped, BulkCreateStudentsInput, BulkCreateStudentsOutput } from '@school/shared';
import { getNowKST, normalizeStudentKey, studentKeyToString } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { fetchCandidates, matchExistingByKey } from '~/domains/student/application/duplicate-detection.js';
import { assertGroupIdsOwnership } from '~/global/utils/ownership.js';
import { database } from '~/infrastructure/database/database.js';

export class BulkCreateStudentsUseCase {
    async execute(input: BulkCreateStudentsInput, organizationId: string): Promise<BulkCreateStudentsOutput> {
        try {
            const totalCount = input.students.length;

            // 1) 입력 정규화 키 계산
            const inputKeys = input.students.map((s) => normalizeStudentKey(s.societyName, s.catholicName));

            // 2) 입력 내부 중복 그룹 (정규화 문자열 → 인덱스 배열)
            const groups = new Map<string, number[]>();
            inputKeys.forEach((k, i) => {
                const ks = studentKeyToString(k);
                const arr = groups.get(ks) ?? [];
                arr.push(i);
                groups.set(ks, arr);
            });

            // 3) DB 후보 fetch (force=false 행이 한 건이라도 있을 때만)
            const hasNonForce = input.students.some((s) => s.force !== true);
            const candidates = hasNonForce ? await fetchCandidates(organizationId) : [];

            // 4) 행 분류 — 등록 / skipped(INTERNAL_DUP) / skipped(DB_DUP)
            const skipped: BulkCreateSkipped[] = [];
            const registerIndices: number[] = [];

            input.students.forEach((s, i) => {
                if (s.force === true) {
                    registerIndices.push(i);
                    return;
                }
                const ks = studentKeyToString(inputKeys[i]);
                const groupIndices = groups.get(ks) ?? [i];
                const otherIndex = groupIndices.find((idx) => idx !== i);
                if (otherIndex !== undefined) {
                    skipped.push({ index: i, reason: 'INTERNAL_DUP', matchWith: { index: otherIndex } });
                    return;
                }
                const existing = matchExistingByKey(candidates, inputKeys[i]);
                if (existing) {
                    skipped.push({ index: i, reason: 'DB_DUP', matchWith: { id: String(existing.id) } });
                    return;
                }
                registerIndices.push(i);
            });

            const now = getNowKST();
            const currentYear = new Date().getFullYear();

            // 5) 권한 검증 — 등록할 행의 그룹만
            const allGroupIds = [...new Set(registerIndices.flatMap((i) => input.students[i].groupIds))];
            if (allGroupIds.length > 0) {
                await assertGroupIdsOwnership(allGroupIds, organizationId);
            }

            // 6) 등록 트랜잭션 (등록 대상만)
            await database.$transaction(async (tx) => {
                for (const i of registerIndices) {
                    const student = input.students[i];
                    const created = await tx.student.create({
                        data: {
                            societyName: student.societyName,
                            catholicName: student.catholicName,
                            gender: student.gender,
                            age: student.age ? BigInt(student.age) : null,
                            contact: student.contact ? BigInt(student.contact) : null,
                            parentContact: student.parentContact?.trim() ? student.parentContact.trim() : null,
                            description: student.description,
                            organizationId: BigInt(organizationId),
                            baptizedAt: student.baptizedAt,
                            createdAt: now,
                        },
                    });

                    // StudentGroup junction records 생성
                    for (const gId of student.groupIds) {
                        await tx.studentGroup.create({
                            data: {
                                studentId: created.id,
                                groupId: BigInt(gId),
                                createdAt: now,
                            },
                        });
                    }

                    await createStudentSnapshot(tx, {
                        studentId: created.id,
                        societyName: created.societyName,
                        catholicName: created.catholicName,
                        gender: created.gender,
                        contact: created.contact,
                        parentContact: created.parentContact,
                        description: created.description,
                        baptizedAt: created.baptizedAt,
                        // 스키마 `groupIds.min(1)` 보장으로 항상 첫 그룹 존재. 방어 분기는 스키마 완화 대비.
                        groupId: student.groupIds.length > 0 ? BigInt(student.groupIds[0]) : null,
                    });

                    if (student.registered === true) {
                        await tx.registration.create({
                            data: {
                                studentId: created.id,
                                year: currentYear,
                                registeredAt: now,
                                createdAt: now,
                                updatedAt: now,
                            },
                        });
                    }
                }
            });

            return {
                successCount: registerIndices.length,
                totalCount,
                skipped,
            };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[BulkCreateStudentsUseCase] failed', {
                organizationId,
                inputCount: input.students.length,
                error: e,
            });
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 일괄 등록에 실패했습니다.',
                cause: e,
            });
        }
    }
}
