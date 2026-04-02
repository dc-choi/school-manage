/**
 * 관리자 양도 + 계정 삭제 분기 통합 테스트 (실제 DB)
 *
 * - transferAdmin: ADMIN -> TEACHER 역할 교환
 * - deleteAccount: ADMIN 유일 멤버 시 조직 소프트 삭제
 */
import { type SeedBase, TEST_PASSWORD, TEST_PASSWORD_HASH, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createScopedCaller } from '../helpers/trpc-caller.ts';
import { ROLE } from '@school/shared';
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

describe('관리자 양도 통합 테스트', () => {
    // ================================================================
    // organization.transferAdmin
    // ================================================================
    describe('organization.transferAdmin', () => {
        it('ADMIN이 TEACHER에게 양도 -> success', async () => {
            const now = getNowKST();
            const teacher = await database.account.create({
                data: {
                    name: '선생님',
                    displayName: '선생님',
                    password: TEST_PASSWORD_HASH,
                    organizationId: seed.org.id,
                    role: ROLE.TEACHER,
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
                role: ROLE.ADMIN,
            });

            const result = await caller.organization.transferAdmin({
                targetAccountId: String(teacher.id),
            });

            expect(result).toEqual({ success: true });

            // DB 확인: 기존 ADMIN -> TEACHER, 대상 TEACHER -> ADMIN
            const updatedAdmin = await database.account.findFirst({
                where: { id: seed.account.id },
            });
            const updatedTeacher = await database.account.findFirst({
                where: { id: teacher.id },
            });
            expect(updatedAdmin?.role).toBe(ROLE.TEACHER);
            expect(updatedTeacher?.role).toBe(ROLE.ADMIN);
        });

        it('자기 자신에게 양도 -> BAD_REQUEST', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
                role: ROLE.ADMIN,
            });

            await expect(
                caller.organization.transferAdmin({
                    targetAccountId: seed.ids.accountId,
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('대상이 같은 조직에 없음 -> NOT_FOUND', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
                role: ROLE.ADMIN,
            });

            await expect(
                caller.organization.transferAdmin({
                    targetAccountId: '999999',
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('대상이 ADMIN -> BAD_REQUEST', async () => {
            const now = getNowKST();
            const anotherAdmin = await database.account.create({
                data: {
                    name: '다른관리자',
                    displayName: '다른관리자',
                    password: TEST_PASSWORD_HASH,
                    organizationId: seed.org.id,
                    role: ROLE.ADMIN,
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name, {
                role: ROLE.ADMIN,
            });

            await expect(
                caller.organization.transferAdmin({
                    targetAccountId: String(anotherAdmin.id),
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('TEACHER가 양도 시도 -> FORBIDDEN', async () => {
            const now = getNowKST();
            const teacher = await database.account.create({
                data: {
                    name: '선생님',
                    displayName: '선생님',
                    password: TEST_PASSWORD_HASH,
                    organizationId: seed.org.id,
                    role: ROLE.TEACHER,
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });

            const caller = createScopedCaller(String(teacher.id), teacher.name, seed.ids.orgId, seed.org.name, {
                role: ROLE.TEACHER,
            });

            await expect(
                caller.organization.transferAdmin({
                    targetAccountId: seed.ids.accountId,
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });
    });

    // ================================================================
    // account.deleteAccount (ADMIN 분기)
    // ================================================================
    describe('account.deleteAccount (ADMIN 분기)', () => {
        it('ADMIN + 다른 멤버 존재 -> FORBIDDEN', async () => {
            const now = getNowKST();
            // 다른 멤버 추가
            await database.account.create({
                data: {
                    name: '선생님',
                    displayName: '선생님',
                    password: TEST_PASSWORD_HASH,
                    organizationId: seed.org.id,
                    role: ROLE.TEACHER,
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });

            const { DeleteAccountUseCase } = await import('~/domains/account/application/delete-account.usecase.js');
            const usecase = new DeleteAccountUseCase();

            await expect(
                usecase.execute({ password: TEST_PASSWORD }, seed.ids.accountId, ROLE.ADMIN, seed.ids.orgId)
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('ADMIN 유일 멤버 -> 조직 소프트 삭제 + 계정 삭제', async () => {
            // seedBase는 계정 1개만 생성 -> 유일 멤버
            const now = getNowKST();
            // 학생/그룹 생성하여 cascade 소프트 삭제 검증
            const group = await database.group.create({
                data: { name: '삭제대상그룹', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '삭제대상학생', organizationId: seed.org.id, createdAt: now },
            });

            const { DeleteAccountUseCase } = await import('~/domains/account/application/delete-account.usecase.js');
            const usecase = new DeleteAccountUseCase();
            const result = await usecase.execute(
                { password: TEST_PASSWORD },
                seed.ids.accountId,
                ROLE.ADMIN,
                seed.ids.orgId
            );

            expect(result).toEqual({ success: true });

            // 조직이 소프트 삭제되었는지 확인
            const org = await database.organization.findFirst({
                where: { id: seed.org.id },
            });
            expect(org?.deletedAt).not.toBeNull();

            // 학생이 소프트 삭제되었는지 확인
            const deletedStudent = await database.student.findFirst({
                where: { id: student.id },
            });
            expect(deletedStudent?.deletedAt).not.toBeNull();

            // 그룹이 소프트 삭제되었는지 확인
            const deletedGroup = await database.group.findFirst({
                where: { id: group.id },
            });
            expect(deletedGroup?.deletedAt).not.toBeNull();

            // 계정이 소프트 삭제 + 조직 연결 해제되었는지 확인
            const deletedAccount = await database.account.findFirst({
                where: { id: seed.account.id },
            });
            expect(deletedAccount?.deletedAt).not.toBeNull();
            expect(deletedAccount?.organizationId).toBeNull();
        });

        it('TEACHER 삭제 -> 기존 로직 유지 (조직 삭제 없음)', async () => {
            const now = getNowKST();
            const teacher = await database.account.create({
                data: {
                    name: '선생님계정',
                    displayName: '선생님계정',
                    password: TEST_PASSWORD_HASH,
                    organizationId: seed.org.id,
                    role: ROLE.TEACHER,
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });

            const { DeleteAccountUseCase } = await import('~/domains/account/application/delete-account.usecase.js');
            const usecase = new DeleteAccountUseCase();
            const result = await usecase.execute({ password: TEST_PASSWORD }, String(teacher.id), ROLE.TEACHER);

            expect(result).toEqual({ success: true });

            // 계정이 소프트 삭제되었는지 확인
            const deletedTeacher = await database.account.findFirst({
                where: { id: teacher.id },
            });
            expect(deletedTeacher?.deletedAt).not.toBeNull();
            expect(deletedTeacher?.organizationId).toBeNull();

            // 조직은 삭제되지 않았어야 함
            const org = await database.organization.findFirst({
                where: { id: seed.org.id },
            });
            expect(org?.deletedAt).toBeNull();
        });
    });
});
