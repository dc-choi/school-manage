/**
 * Group 통합 테스트 (실제 DB)
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

describe('group 통합 테스트', () => {
    describe('group.list', () => {
        it('인증된 사용자의 그룹 목록 반환', async () => {
            const now = getNowKST();
            const g1 = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const g2 = await database.group.create({
                data: { name: '2학년', organizationId: seed.org.id, createdAt: now },
            });

            // 학생 추가 (studentCount 검증용)
            const s1 = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '김철수', organizationId: seed.org.id, createdAt: now },
            });
            const s3 = await database.student.create({
                data: { societyName: '이영희', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: s1.id, groupId: g1.id, createdAt: now },
                    { studentId: s2.id, groupId: g1.id, createdAt: now },
                    { studentId: s3.id, groupId: g2.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.group.list({});

            expect(result).toHaveProperty('groups');
            expect(Array.isArray(result.groups)).toBe(true);
            expect(result.groups.length).toBe(2);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.list({})).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('group.create', () => {
        it('새 그룹 생성 성공', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.group.create({ name: '테스트그룹' });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result.name).toBe('테스트그룹');

            // DB에 실제 생성되었는지 확인
            const dbGroup = await database.group.findFirst({ where: { name: '테스트그룹' } });
            expect(dbGroup).not.toBeNull();
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.create({ name: '테스트그룹' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('이름 없이 생성 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(caller.group.create({ name: '' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('group.get', () => {
        it('그룹 상세 조회 성공 (학생 목록 포함)', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
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
            const result = await caller.group.get({ id: String(group.id) });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name');
            expect(result).toHaveProperty('students');
            expect(Array.isArray(result.students)).toBe(true);
            expect(result.students.length).toBe(2);
        });

        it('학생이 없는 그룹 조회 성공', async () => {
            const group = await database.group.create({
                data: { name: '빈그룹', organizationId: seed.org.id, createdAt: getNowKST() },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.group.get({ id: String(group.id) });

            expect(result).toHaveProperty('students');
            expect(result.students.length).toBe(0);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.get({ id: '1' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(caller.group.get({ id: 'invalid-id' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('group.update', () => {
        it('그룹 수정 성공', async () => {
            const group = await database.group.create({
                data: { name: '원래이름', organizationId: seed.org.id, createdAt: getNowKST() },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.group.update({ id: String(group.id), name: '수정된그룹' });

            expect(result).toHaveProperty('id');
            expect(result.name).toBe('수정된그룹');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.update({ id: '1', name: '수정그룹' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(caller.group.update({ id: 'invalid-id', name: '수정그룹' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('group.delete', () => {
        it('그룹 삭제 성공', async () => {
            const group = await database.group.create({
                data: { name: '삭제대상', organizationId: seed.org.id, createdAt: getNowKST() },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.group.delete({ id: String(group.id) });

            expect(result).toHaveProperty('id');

            // soft delete 확인
            const deleted = await database.group.findFirst({ where: { id: group.id } });
            expect(deleted?.deletedAt).not.toBeNull();
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.delete({ id: '1' })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('잘못된 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(caller.group.delete({ id: 'invalid-id' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('group.bulkDelete', () => {
        it('여러 그룹 일괄 삭제 성공', async () => {
            const now = getNowKST();
            const g1 = await database.group.create({
                data: { name: '삭제1', organizationId: seed.org.id, createdAt: now },
            });
            const g2 = await database.group.create({
                data: { name: '삭제2', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.group.bulkDelete({ ids: [String(g1.id), String(g2.id)] });

            expect(result).toHaveProperty('deletedCount');
            expect(result.deletedCount).toBe(2);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.group.bulkDelete({ ids: ['1', '2'] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('빈 배열 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(caller.group.bulkDelete({ ids: [] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('잘못된 ID 형식 포함 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await expect(caller.group.bulkDelete({ ids: ['1', 'invalid-id'] })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });
});
