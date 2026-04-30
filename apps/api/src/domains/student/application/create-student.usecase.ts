/**
 * Create Student UseCase
 *
 * 새 학생 생성
 */
import type { CreateStudentInput, CreateStudentOutput, Gender } from '@school/shared';
import { getNowKST, normalizeStudentKey } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { createStudentSnapshot } from '~/domains/snapshot/snapshot.helper.js';
import { findDuplicateInOrganization } from '~/domains/student/application/duplicate-detection.js';
import { assertGroupIdsOwnership } from '~/global/utils/ownership.js';
import { database } from '~/infrastructure/database/database.js';

export class CreateStudentUseCase {
    async execute(input: CreateStudentInput, organizationId: string): Promise<CreateStudentOutput> {
        try {
            // 중복 검증 (force=true이면 생략) — 로드맵 2단계 학생 등록 중복 확인
            if (input.force !== true) {
                const inputKey = normalizeStudentKey(input.societyName, input.catholicName);
                const existing = await findDuplicateInOrganization(organizationId, inputKey);
                if (existing) {
                    throw new TRPCError({
                        code: 'CONFLICT',
                        message: '이미 등록된 학생입니다.',
                        cause: { duplicate: { existing } },
                    });
                }
            }

            // 측정 인프라: 조직의 첫 학생인지 확인
            const existingStudentCount = await database.student.count({
                where: {
                    organizationId: BigInt(organizationId),
                    deletedAt: null,
                },
            });
            const isFirstStudent = existingStudentCount === 0;

            // 측정 인프라: 조직 생성 후 경과일 계산
            let daysSinceCreation: number | undefined;
            if (isFirstStudent) {
                const org = await database.organization.findUnique({
                    where: { id: BigInt(organizationId) },
                    select: { createdAt: true },
                });
                if (org?.createdAt) {
                    const now = getNowKST();
                    const diffMs = now.getTime() - org.createdAt.getTime();
                    daysSinceCreation = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }
            }

            // 권한 검증: groupIds가 해당 조직 소속인지 확인
            await assertGroupIdsOwnership(input.groupIds, organizationId);

            const { student, studentGroups } = await database.$transaction(async (tx) => {
                const created = await tx.student.create({
                    data: {
                        societyName: input.societyName,
                        catholicName: input.catholicName,
                        gender: input.gender,
                        age: input.age ? BigInt(input.age) : null,
                        contact: input.contact ? BigInt(input.contact) : null,
                        parentContact: input.parentContact?.trim() ? input.parentContact.trim() : null,
                        description: input.description,
                        organizationId: BigInt(organizationId),
                        baptizedAt: input.baptizedAt,
                        createdAt: getNowKST(),
                    },
                });

                // StudentGroup junction records 생성
                for (const gId of input.groupIds) {
                    await tx.studentGroup.create({
                        data: {
                            studentId: created.id,
                            groupId: BigInt(gId),
                            createdAt: getNowKST(),
                        },
                    });
                }

                // 생성된 StudentGroup + Group 이름/타입 조회
                const sgs = await tx.studentGroup.findMany({
                    where: { studentId: created.id },
                    include: { group: { select: { id: true, name: true, type: true } } },
                });

                const gradeGroup = sgs.find((sg) => sg.group.type === 'GRADE');

                await createStudentSnapshot(tx, {
                    studentId: created.id,
                    societyName: created.societyName,
                    catholicName: created.catholicName,
                    gender: created.gender,
                    contact: created.contact,
                    parentContact: created.parentContact,
                    description: created.description,
                    baptizedAt: created.baptizedAt,
                    groupId: gradeGroup?.group.id ?? null,
                });

                return { student: created, studentGroups: sgs };
            });

            return {
                id: String(student.id),
                societyName: student.societyName,
                catholicName: student.catholicName ?? undefined,
                gender: (student.gender ?? undefined) as Gender | undefined,
                age: student.age != null ? Number(student.age) : undefined,
                contact: student.contact != null ? String(student.contact) : undefined,
                parentContact: student.parentContact ?? undefined,
                description: student.description ?? undefined,
                groups: studentGroups.map((sg) => ({
                    id: String(sg.group.id),
                    name: sg.group.name,
                    type: sg.group.type,
                })),
                baptizedAt: student.baptizedAt ?? undefined,
                // 측정 인프라용 필드
                isFirstStudent,
                daysSinceCreation,
            };
        } catch (e) {
            if (e instanceof TRPCError) throw e;
            console.error('[CreateStudentUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '학생 등록에 실패했습니다.',
            });
        }
    }
}
