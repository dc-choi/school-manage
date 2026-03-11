/**
 * List Students UseCase
 *
 * 학생 목록 조회 (페이지네이션, 검색, 삭제 필터, 등록 필터)
 */
import { Prisma } from '@prisma/client';
import type { ListStudentsOutput, ListStudentsInput as ListStudentsSchemaInput } from '@school/trpc';
import { database } from '~/infrastructure/database/database.js';

// 스키마 타입 + context 필드
type ListStudentsInput = ListStudentsSchemaInput & { accountId: string };

export class ListStudentsUseCase {
    async execute(input: ListStudentsInput): Promise<ListStudentsOutput> {
        const page = input.page ?? 1;
        const size = 10;
        const skip = (page - 1) * size;
        const registrationYear = input.registrationYear ?? new Date().getFullYear();

        // 계정에 속한 그룹 IDs 조회
        const groups = await database.group.findMany({
            where: {
                accountId: BigInt(input.accountId),
                deletedAt: null,
            },
        });
        const groupIds = groups.map((g) => g.id);

        // 검색 조건 구성
        const searchFilter = this.buildSearchFilter(input.searchOption, input.searchWord);

        // 삭제 필터 조건 구성
        const deletedFilter = this.buildDeletedFilter(input.includeDeleted, input.onlyDeleted);

        // 졸업 필터 조건 구성
        const graduatedFilter = this.buildGraduatedFilter(input.graduated);

        // 등록 필터 조건 구성
        const registeredFilter = this.buildRegisteredFilter(input.registered, registrationYear);

        const where: Prisma.StudentWhereInput = {
            groupId: { in: groupIds },
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
                    group: {
                        select: { name: true },
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
                        groupId: { in: groupIds },
                        deletedAt: null,
                        ...summaryGraduatedFilter,
                    },
                },
            }),
            // 전체 재학생 수 (등록 현황 요약용)
            database.student.count({
                where: {
                    groupId: { in: groupIds },
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
                gender: row.gender ?? undefined,
                age: row.age != null ? Number(row.age) : undefined,
                contact: row.contact != null ? Number(row.contact) : undefined,
                description: row.description ?? undefined,
                groupId: String(row.groupId),
                groupName: row.group?.name ?? '',
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

    private buildSearchFilter(option?: string, word?: string): Prisma.StudentWhereInput {
        if (!word) return {};

        switch (option) {
            case 'societyName':
                return { societyName: { contains: word } };
            case 'catholicName':
                return { catholicName: { contains: word } };
            case 'baptizedAt':
                return { baptizedAt: { contains: word } };
            default:
                return {};
        }
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
