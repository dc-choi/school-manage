/**
 * List Students UseCase
 *
 * 학생 목록 조회 (페이지네이션, 검색, 삭제 필터, 등록 필터)
 */
import { Prisma } from '@prisma/client';
import type { Gender, ListStudentsOutput, ListStudentsInput as ListStudentsSchemaInput } from '@school/shared';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type ListStudentsInput = ListStudentsSchemaInput & { organizationId: string };

export class ListStudentsUseCase {
    async execute(input: ListStudentsInput): Promise<ListStudentsOutput> {
        const page = input.page ?? 1;
        const size = 10;
        const skip = (page - 1) * size;
        const registrationYear = input.registrationYear ?? new Date().getFullYear();

        // 검색 조건 구성
        const searchFilter = this.buildSearchFilter(input.searchWord);

        // 삭제 필터 조건 구성
        const deletedFilter = this.buildDeletedFilter(input.includeDeleted, input.onlyDeleted);

        // 졸업 필터 조건 구성
        const graduatedFilter = this.buildGraduatedFilter(input.graduated);

        // 등록 필터 조건 구성
        const registeredFilter = this.buildRegisteredFilter(input.registered, registrationYear);

        const where: Prisma.StudentWhereInput = {
            organizationId: BigInt(input.organizationId),
            ...deletedFilter,
            ...graduatedFilter,
            ...searchFilter,
            ...registeredFilter,
        };

        // 등록 현황 요약용 졸업 필터
        const summaryGraduatedFilter = this.buildGraduatedFilter(input.graduated);

        // 학생 목록 조회 + 등록 현황 요약 (병렬)
        const [rows, count, registeredCount, totalActiveStudents] = await Promise.all([
            database.student.findMany({
                where,
                include: {
                    studentGroups: {
                        include: { group: { select: { id: true, name: true, type: true } } },
                    },
                    registrations: {
                        where: { year: registrationYear, deletedAt: null },
                        select: { id: true },
                        take: 1,
                    },
                },
                skip,
                take: size,
                orderBy: [{ age: 'asc' }, { societyName: 'asc' }],
            }),
            database.student.count({ where }),
            // 등록 현황: 재학생 중 해당 연도 등록된 수
            database.registration.count({
                where: {
                    year: registrationYear,
                    deletedAt: null,
                    student: {
                        organizationId: BigInt(input.organizationId),
                        deletedAt: null,
                        ...summaryGraduatedFilter,
                    },
                },
            }),
            // 전체 재학생 수 (등록 현황 요약용)
            database.student.count({
                where: {
                    organizationId: BigInt(input.organizationId),
                    deletedAt: null,
                    ...summaryGraduatedFilter,
                },
            }),
        ]);

        return {
            page,
            size,
            total: count,
            totalPage: Math.ceil(count / size),
            students: rows.map((row) => ({
                id: String(row.id),
                societyName: row.societyName,
                catholicName: row.catholicName ?? undefined,
                gender: (row.gender ?? undefined) as Gender | undefined,
                age: row.age != null ? Number(row.age) : undefined,
                contact: row.contact != null ? String(row.contact) : undefined,
                description: row.description ?? undefined,
                groups: row.studentGroups.map((sg) => ({
                    id: String(sg.group.id),
                    name: sg.group.name,
                    type: sg.group.type,
                })),
                baptizedAt: row.baptizedAt ?? undefined,
                graduatedAt: row.graduatedAt?.toISOString(),
                deletedAt: row.deletedAt?.toISOString(),
                isRegistered: row.registrations.length > 0,
            })),
            registrationSummary: {
                registeredCount,
                unregisteredCount: totalActiveStudents - registeredCount,
            },
        };
    }

    private buildSearchFilter(word?: string): Prisma.StudentWhereInput {
        if (!word || !word.trim()) return {};

        const trimmed = word.trim();
        return {
            OR: [
                { societyName: { startsWith: trimmed } },
                { catholicName: { startsWith: trimmed } },
                { baptizedAt: { startsWith: trimmed } },
            ],
        };
    }

    private buildDeletedFilter(includeDeleted?: boolean, onlyDeleted?: boolean): Prisma.StudentWhereInput {
        // onlyDeleted가 true면 삭제된 학생만
        if (onlyDeleted) {
            return { deletedAt: { not: null } };
        }
        // includeDeleted가 true면 전체 (조건 없음)
        if (includeDeleted) {
            return {};
        }
        // 기본: 재학생만 (삭제되지 않은 학생)
        return { deletedAt: null };
    }

    private buildGraduatedFilter(graduated?: boolean | null): Prisma.StudentWhereInput {
        // graduated가 null 또는 undefined면 전체 (조건 없음)
        if (graduated === null || graduated === undefined) {
            return {};
        }
        // graduated가 true면 졸업생만
        if (graduated === true) {
            return { graduatedAt: { not: null } };
        }
        // graduated가 false면 재학생만
        return { graduatedAt: null };
    }

    private buildRegisteredFilter(registered?: boolean, registrationYear?: number): Prisma.StudentWhereInput {
        if (registered === undefined) return {};

        if (registered === true) {
            return {
                registrations: {
                    some: { year: registrationYear, deletedAt: null },
                },
            };
        }

        return {
            registrations: {
                none: { year: registrationYear, deletedAt: null },
            },
        };
    }
}
