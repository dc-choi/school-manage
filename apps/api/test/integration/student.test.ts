/**
 * Student 통합 테스트 (실제 DB)
 *
 * 실제 DB를 사용하여 학생 CRUD 프로시저 테스트
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createPublicCaller, createScopedCaller } from '../helpers/trpc-caller.ts';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
});

afterAll(async () => {
    await truncateAll();
});

describe('student 통합 테스트', () => {
    describe('student.list', () => {
        it('학생 목록 조회 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const s1 = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '김철수', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: s1.id, groupId: group.id, createdAt: now },
                    { studentId: s2.id, groupId: group.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.list({});

            expect(result).toHaveProperty('students');
            expect(Array.isArray(result.students)).toBe(true);
            expect(result.students.length).toBe(2);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.list({})).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('student.create', () => {
        it('학생 생성 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.create({
                societyName: '홍길동',
                groupIds: [String(group.id)],
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('societyName');
            expect(result.societyName).toBe('홍길동');

            // DB에 실제 생성되었는지 확인
            const dbStudent = await database.student.findFirst({ where: { societyName: '홍길동' } });
            expect(dbStudent).not.toBeNull();

            // StudentGroup junction 레코드 생성 확인
            const dbSg = await database.studentGroup.findFirst({
                where: { studentId: BigInt(result.id), groupId: group.id },
            });
            expect(dbSg).not.toBeNull();
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createPublicCaller();

            await expect(
                caller.student.create({ societyName: '홍길동', groupIds: [String(group.id)] })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('필수 필드 누락 시 BAD_REQUEST 에러', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.create({ societyName: '', groupIds: [String(group.id)] })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.get', () => {
        it('학생 상세 조회 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.get({ id: String(student.id) });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('societyName');
            expect(result.societyName).toBe('홍길동');
            expect(result.groups.length).toBe(1);
            expect(result.groups[0].name).toBe('테스트그룹');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.get({ id: '1' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.get({ id: 'invalid-id' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('삭제된 그룹 제외 확인', async () => {
            const now = getNowKST();
            const activeGroup = await database.group.create({
                data: { name: '활성그룹', organizationId: seed.org.id, createdAt: now },
            });
            const deletedGroup = await database.group.create({
                data: { name: '삭제그룹', organizationId: seed.org.id, createdAt: now, deletedAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: student.id, groupId: activeGroup.id, createdAt: now },
                    { studentId: student.id, groupId: deletedGroup.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.get({ id: String(student.id) });

            // 삭제된 그룹은 제외되어야 함
            expect(result.groups.length).toBe(1);
            expect(result.groups[0].name).toBe('활성그룹');
        });
    });

    describe('student.update', () => {
        it('학생 수정 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.update({
                id: String(student.id),
                societyName: '수정된이름',
                groupIds: [String(group.id)],
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('societyName');
            expect(result.societyName).toBe('수정된이름');

            // DB에서 실제 수정 확인
            const dbStudent = await database.student.findFirst({ where: { id: student.id } });
            expect(dbStudent?.societyName).toBe('수정된이름');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.student.update({ id: '1', societyName: '수정', groupIds: ['1'] })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.update({ id: 'invalid-id', societyName: '수정', groupIds: ['1'] })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.delete', () => {
        it('학생 삭제 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.delete({ id: String(student.id) });

            expect(result).toHaveProperty('id');

            // soft delete 확인
            const deleted = await database.student.findFirst({ where: { id: student.id } });
            expect(deleted?.deletedAt).not.toBeNull();
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.delete({ id: '1' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.delete({ id: 'invalid-id' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.bulkDelete', () => {
        it('학생 일괄 삭제 성공', async () => {
            const now = getNowKST();
            const s1 = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '학생2', organizationId: seed.org.id, createdAt: now },
            });
            const s3 = await database.student.create({
                data: { societyName: '학생3', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkDelete({
                ids: [String(s1.id), String(s2.id), String(s3.id)],
            });

            expect(result).toHaveProperty('deletedCount');
            expect(result.deletedCount).toBe(3);

            // DB에서 soft delete 확인
            const deleted = await database.student.findMany({
                where: { id: { in: [s1.id, s2.id, s3.id] }, deletedAt: { not: null } },
            });
            expect(deleted.length).toBe(3);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.bulkDelete({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.bulkDelete({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.bulkDelete({ ids: ['invalid-id'] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.restore', () => {
        it('학생 복구 성공', async () => {
            const now = getNowKST();
            const s1 = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now, deletedAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '학생2', organizationId: seed.org.id, createdAt: now, deletedAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.restore({ ids: [String(s1.id), String(s2.id)] });

            expect(result).toHaveProperty('restoredCount');
            expect(result.restoredCount).toBe(2);

            // DB에서 복구 확인
            const restored = await database.student.findMany({
                where: { id: { in: [s1.id, s2.id] }, deletedAt: null },
            });
            expect(restored.length).toBe(2);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.restore({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.restore({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.restore({ ids: ['invalid-id'] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.graduate', () => {
        it('중고등부 나이 >= 20 졸업 처리 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '고3', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', age: BigInt(20), organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.graduate({ ids: [String(student.id)] });

            expect(result.success).toBe(true);
            expect(result.graduatedCount).toBe(1);
            expect(result.students[0]?.graduatedAt).toBeDefined();
            expect(result.skipped).toHaveLength(0);
        });

        it('초등부 나이 >= 14 졸업 처리 성공', async () => {
            const now = getNowKST();
            // 초등부 조직 생성
            const elemOrg = await database.organization.create({
                data: { name: '초등부', type: 'ELEMENTARY', churchId: seed.church.id, createdAt: now },
            });
            const elemAccount = await database.account.create({
                data: {
                    name: '초등부계정',
                    displayName: '초등부계정',
                    password: 'hash',
                    organizationId: elemOrg.id,
                    role: 'ADMIN',
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });
            const group = await database.group.create({
                data: { name: '6학년', organizationId: elemOrg.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '김초등', age: BigInt(14), organizationId: elemOrg.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(
                String(elemAccount.id),
                elemAccount.name,
                String(elemOrg.id),
                elemOrg.name
            );
            const result = await caller.student.graduate({ ids: [String(student.id)] });

            expect(result.success).toBe(true);
            expect(result.graduatedCount).toBe(1);
        });

        it('청년부 전원 졸업 가능', async () => {
            const now = getNowKST();
            // 청년부 조직 생성
            const yaOrg = await database.organization.create({
                data: { name: '청년부', type: 'YOUNG_ADULT', churchId: seed.church.id, createdAt: now },
            });
            const yaAccount = await database.account.create({
                data: {
                    name: '청년부계정',
                    displayName: '청년부계정',
                    password: 'hash',
                    organizationId: yaOrg.id,
                    role: 'ADMIN',
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });
            const group = await database.group.create({
                data: { name: '1학년', organizationId: yaOrg.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '이청년', age: BigInt(18), organizationId: yaOrg.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(String(yaAccount.id), yaAccount.name, String(yaOrg.id), yaOrg.name);
            const result = await caller.student.graduate({ ids: [String(student.id)] });

            expect(result.success).toBe(true);
            expect(result.graduatedCount).toBe(1);
        });

        it('나이 null인 학생도 졸업 가능', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '고3', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '나이없음', age: null, organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.graduate({ ids: [String(student.id)] });

            expect(result.success).toBe(true);
            expect(result.graduatedCount).toBe(1);
        });

        it('미달 나이 학생 제외', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '중1', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '어린학생', age: BigInt(15), organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.graduate({ ids: [String(student.id)] });

            expect(result.success).toBe(true);
            expect(result.graduatedCount).toBe(0);
            expect(result.students).toHaveLength(0);
            expect(result.skipped).toHaveLength(1);
            expect(result.skipped[0]?.societyName).toBeDefined();
            expect(result.skipped[0]?.reason).toContain('15살');
        });

        it('혼합 나이 학생 중 대상자만 졸업', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const young = await database.student.create({
                data: { societyName: '어린학생', age: BigInt(15), organizationId: seed.org.id, createdAt: now },
            });
            const eligible = await database.student.create({
                data: { societyName: '졸업대상', age: BigInt(20), organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: young.id, groupId: group.id, createdAt: now },
                    { studentId: eligible.id, groupId: group.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.graduate({
                ids: [String(young.id), String(eligible.id)],
            });

            expect(result.success).toBe(true);
            expect(result.graduatedCount).toBe(1);
            expect(result.students[0]?.id).toBe(String(eligible.id));
            expect(result.skipped).toHaveLength(1);
            expect(result.skipped[0]?.reason).toContain('15살');
        });

        it('graduatedAt이 전년도 12/31로 정규화됨', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '고3', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '졸업생', age: BigInt(20), organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await caller.student.graduate({ ids: [String(student.id)] });

            // DB에서 직접 확인
            const dbStudent = await database.student.findFirst({ where: { id: student.id } });
            const graduatedAt = dbStudent?.graduatedAt as Date;
            const currentYear = new Date().getUTCFullYear();
            // 나이는 1/1에 올라가므로 졸업일은 전년도 12/31
            expect(graduatedAt.getUTCFullYear()).toBe(currentYear - 1);
            expect(graduatedAt.getUTCMonth()).toBe(11); // December (0-indexed)
            expect(graduatedAt.getUTCDate()).toBe(31);
            expect(graduatedAt.getUTCHours()).toBe(0);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.graduate({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.graduate({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('100개 초과 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const manyIds = Array.from({ length: 101 }, (_, i) => String(i + 1));

            await expect(caller.student.graduate({ ids: manyIds })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.cancelGraduation', () => {
        it('학생 졸업 취소 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '고3', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: {
                    societyName: '홍길동',
                    organizationId: seed.org.id,
                    graduatedAt: now,
                    createdAt: now,
                },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.cancelGraduation({ ids: [String(student.id)] });

            expect(result).toHaveProperty('success');
            expect(result.success).toBe(true);
            expect(result).toHaveProperty('cancelledCount');
            expect(result.cancelledCount).toBe(1);
            expect(result).toHaveProperty('students');
            expect(result.students[0].graduatedAt).toBe(null);

            // DB에서 졸업 취소 확인
            const dbStudent = await database.student.findFirst({ where: { id: student.id } });
            expect(dbStudent?.graduatedAt).toBeNull();
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.cancelGraduation({ ids: ['1'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.cancelGraduation({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.promote', () => {
        it('학생 학년 진급 성공 (중고등부)', async () => {
            const now = getNowKST();
            // 중고등부 진급에 필요한 그룹 생성
            const adultGroup = await database.group.create({
                data: { name: '성인', organizationId: seed.org.id, createdAt: now },
            });
            const high3Group = await database.group.create({
                data: { name: '고3', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, '중고등부');
            const result = await caller.student.promote();

            expect(result).toHaveProperty('row');
            expect(result.row).toBe(0);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.promote()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('student.bulkCreate', () => {
        it('엑셀 업로드 학생 일괄 생성 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const groupId = String(group.id);

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkCreate({
                students: [
                    { societyName: '김철수', groupIds: [groupId] },
                    { societyName: '이영희', groupIds: [groupId], gender: 'F' },
                ],
            });

            expect(result.successCount).toBe(2);
            expect(result.totalCount).toBe(2);

            // DB에서 실제 생성 확인
            const students = await database.student.findMany({
                where: { organizationId: seed.org.id, societyName: { in: ['김철수', '이영희'] } },
            });
            expect(students.length).toBe(2);

            // 스냅샷 생성 확인
            const snapshots = await database.studentSnapshot.findMany({
                where: { studentId: { in: students.map((s) => s.id) } },
            });
            expect(snapshots.length).toBe(2);
        });

        it('등록 여부 포함 시 Registration 레코드 생성', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const groupId = String(group.id);

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await caller.student.bulkCreate({
                students: [
                    { societyName: '김철수', groupIds: [groupId], registered: true },
                    { societyName: '이영희', groupIds: [groupId], registered: false },
                ],
            });

            // registered: true인 학생만 registration 생성
            const registrations = await database.registration.findMany({
                where: { student: { organizationId: seed.org.id } },
            });
            expect(registrations.length).toBe(1);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.student.bulkCreate({
                    students: [{ societyName: '김철수', groupIds: ['1'] }],
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.bulkCreate({ students: [] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    describe('student.bulkCreate - 서버측 재검증 (로드맵 2단계)', () => {
        const buildItem = (groupId: string, override: Record<string, unknown> = {}) => ({
            societyName: '정상이름',
            groupIds: [groupId],
            ...override,
        });

        it('TC-E5: societyName 51자 → BAD_REQUEST', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.bulkCreate({ students: [buildItem(String(group.id), { societyName: 'A'.repeat(51) })] })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-E6: contact 비숫자 → BAD_REQUEST', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.bulkCreate({ students: [buildItem(String(group.id), { contact: '010-1234' })] })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-E7a: groupIds 빈 배열 → BAD_REQUEST', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.bulkCreate({ students: [{ societyName: '정상이름', groupIds: [] }] })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-E7b: groupIds 11개 → BAD_REQUEST', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            const elevenGroupIds = Array<string>(11).fill(String(group.id));
            await expect(
                caller.student.bulkCreate({
                    students: [{ societyName: '정상이름', groupIds: elevenGroupIds }],
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-E8a: age 0 → BAD_REQUEST', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.bulkCreate({ students: [buildItem(String(group.id), { age: 0 })] })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-E8b: age 121 → BAD_REQUEST', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.bulkCreate({ students: [buildItem(String(group.id), { age: 121 })] })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-E9: description 501자 → BAD_REQUEST', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.bulkCreate({
                    students: [buildItem(String(group.id), { description: 'x'.repeat(501) })],
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-E10: catholicName 51자 → BAD_REQUEST', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.student.bulkCreate({
                    students: [buildItem(String(group.id), { catholicName: 'A'.repeat(51) })],
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    describe('student.bulkRegister', () => {
        it('학생 일괄 등록 성공 (신규 등록)', async () => {
            const now = getNowKST();
            const s1 = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '학생2', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkRegister({ ids: [String(s1.id), String(s2.id)] });

            expect(result).toHaveProperty('registeredCount');
            expect(result.registeredCount).toBe(2);

            // DB에서 등록 레코드 확인
            const registrations = await database.registration.findMany({
                where: { studentId: { in: [s1.id, s2.id] } },
            });
            expect(registrations.length).toBe(2);
        });

        it('이미 등록된 학생은 건너뜀', async () => {
            const now = getNowKST();
            const currentYear = new Date().getFullYear();
            const student = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            // 이미 등록
            await database.registration.create({
                data: {
                    studentId: student.id,
                    year: currentYear,
                    registeredAt: now,
                    createdAt: now,
                    updatedAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkRegister({ ids: [String(student.id)] });

            expect(result.registeredCount).toBe(0);
        });

        it('소프트 삭제된 등록 레코드 복구', async () => {
            const now = getNowKST();
            const currentYear = new Date().getFullYear();
            const student = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            // 소프트 삭제된 등록 레코드
            await database.registration.create({
                data: {
                    studentId: student.id,
                    year: currentYear,
                    registeredAt: now,
                    createdAt: now,
                    updatedAt: now,
                    deletedAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkRegister({ ids: [String(student.id)] });

            expect(result.registeredCount).toBe(1);

            // 복구 확인
            const reg = await database.registration.findFirst({
                where: { studentId: student.id, year: currentYear },
            });
            expect(reg?.deletedAt).toBeNull();
        });

        it('연도 지정 등록 (year 파라미터)', async () => {
            const now = getNowKST();
            const student = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkRegister({ ids: [String(student.id)], year: 2027 });

            expect(result.registeredCount).toBe(1);

            // DB에서 연도 확인
            const reg = await database.registration.findFirst({
                where: { studentId: student.id, year: 2027 },
            });
            expect(reg).not.toBeNull();
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.bulkRegister({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.bulkRegister({ ids: [] })).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    describe('student.bulkCancelRegistration', () => {
        it('학생 일괄 등록 취소 성공', async () => {
            const now = getNowKST();
            const currentYear = new Date().getFullYear();
            const s1 = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '학생2', organizationId: seed.org.id, createdAt: now },
            });
            await database.registration.createMany({
                data: [
                    { studentId: s1.id, year: currentYear, registeredAt: now, createdAt: now, updatedAt: now },
                    { studentId: s2.id, year: currentYear, registeredAt: now, createdAt: now, updatedAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkCancelRegistration({
                ids: [String(s1.id), String(s2.id)],
            });

            expect(result).toHaveProperty('cancelledCount');
            expect(result.cancelledCount).toBe(2);

            // DB에서 소프트 삭제 확인
            const cancelled = await database.registration.findMany({
                where: { studentId: { in: [s1.id, s2.id] }, deletedAt: { not: null } },
            });
            expect(cancelled.length).toBe(2);
        });

        it('연도 지정 등록 취소 (year 파라미터)', async () => {
            const now = getNowKST();
            const student = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            await database.registration.create({
                data: { studentId: student.id, year: 2026, registeredAt: now, createdAt: now, updatedAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.bulkCancelRegistration({
                ids: [String(student.id)],
                year: 2026,
            });

            expect(result.cancelledCount).toBe(1);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(caller.student.bulkCancelRegistration({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 전달 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.student.bulkCancelRegistration({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('student.list (graduated 필터)', () => {
        it('재학생만 조회 (graduated: false)', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const activeStudent = await database.student.create({
                data: { societyName: '재학생', organizationId: seed.org.id, createdAt: now },
            });
            const graduatedStudent = await database.student.create({
                data: { societyName: '졸업생', organizationId: seed.org.id, graduatedAt: now, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: activeStudent.id, groupId: group.id, createdAt: now },
                    { studentId: graduatedStudent.id, groupId: group.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.list({ graduated: false });

            expect(result.students.length).toBe(1);
            expect(result.students[0].graduatedAt).toBeUndefined();
        });

        it('졸업생만 조회 (graduated: true)', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const activeStudent = await database.student.create({
                data: { societyName: '재학생', organizationId: seed.org.id, createdAt: now },
            });
            const graduatedStudent = await database.student.create({
                data: { societyName: '졸업생', organizationId: seed.org.id, graduatedAt: now, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: activeStudent.id, groupId: group.id, createdAt: now },
                    { studentId: graduatedStudent.id, groupId: group.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.list({ graduated: true });

            expect(result.students.length).toBe(1);
            expect(result.students[0].graduatedAt).toBeDefined();
        });

        it('전체 조회 (graduated: null)', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '테스트그룹', organizationId: seed.org.id, createdAt: now },
            });
            const activeStudent = await database.student.create({
                data: { societyName: '재학생', organizationId: seed.org.id, createdAt: now },
            });
            const graduatedStudent = await database.student.create({
                data: { societyName: '졸업생', organizationId: seed.org.id, graduatedAt: now, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: activeStudent.id, groupId: group.id, createdAt: now },
                    { studentId: graduatedStudent.id, groupId: group.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.student.list({ graduated: null });

            expect(result.students.length).toBe(2);
        });
    });
});
