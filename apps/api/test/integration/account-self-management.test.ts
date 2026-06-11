/**
 * 계정 자기 관리 통합 테스트 (실제 DB)
 *
 * TC-SM1 ~ TC-SM10, TC-SME1: 비밀번호 재설정/변경, 프로필 수정, 계정 삭제/복원
 */
import { type SeedBase, TEST_PASSWORD, TEST_PASSWORD_HASH, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { getMockMailService } from '../helpers/test-stubs.ts';
import { createAuthenticatedCaller, createPublicCaller, createScopedCaller } from '../helpers/trpc-caller.ts';
import { JOIN_REQUEST_STATUS, ROLE } from '@school/shared';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

const mockMailService = getMockMailService();

let seed: SeedBase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();

    mockMailService.isEnabled.mockReturnValue(true);
    mockMailService.sendTemporaryPassword.mockReset().mockResolvedValue(true);
});

afterAll(async () => {
    await truncateAll();
});

describe('계정 자기 관리 통합 테스트', () => {
    // ================================================================
    // auth.resetPassword
    // ================================================================
    describe('auth.resetPassword', () => {
        it('TC-SM1: 존재하는 계정 → success, 메일 발송', async () => {
            const caller = createPublicCaller();
            const result = await caller.auth.resetPassword({
                name: seed.account.name,
                email: 'test@example.com',
            });

            expect(result).toEqual({ success: true });
            expect(mockMailService.sendTemporaryPassword).toHaveBeenCalledOnce();
            expect(mockMailService.sendTemporaryPassword).toHaveBeenCalledWith('test@example.com', expect.any(String));
        });

        it('TC-SM2: 미존재 계정 → success, 메일 미발송', async () => {
            const caller = createPublicCaller();
            const result = await caller.auth.resetPassword({
                name: 'nonexistent',
                email: 'test@example.com',
            });

            expect(result).toEqual({ success: true });
            expect(mockMailService.sendTemporaryPassword).not.toHaveBeenCalled();
        });

        it('TC-SME1: 메일 발송 실패 → emailFailed, DB 미업데이트', async () => {
            mockMailService.sendTemporaryPassword.mockResolvedValueOnce(false);

            const before = await database.account.findFirst({
                where: { id: seed.account.id },
                select: { password: true },
            });

            const caller = createPublicCaller();
            const result = await caller.auth.resetPassword({
                name: seed.account.name,
                email: 'test@example.com',
            });

            expect(result).toEqual({ success: false, emailFailed: true });

            const after = await database.account.findFirst({
                where: { id: seed.account.id },
                select: { password: true },
            });
            expect(after!.password).toBe(before!.password);
        });
    });

    // ================================================================
    // account.changePassword
    // ================================================================
    describe('account.changePassword', () => {
        it('TC-SM3: 정상 비밀번호 변경 → success', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.account.changePassword({
                currentPassword: TEST_PASSWORD,
                newPassword: 'newpassword123',
            });

            expect(result).toEqual({ success: true });

            const publicCaller = createPublicCaller();
            const loginResult = await publicCaller.auth.login({
                name: seed.account.name,
                password: 'newpassword123',
            });
            expect(loginResult).toHaveProperty('accessToken');
        });

        it('TC-SM4: 현재 비밀번호 불일치 → UNAUTHORIZED', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);

            await expect(
                caller.account.changePassword({
                    currentPassword: 'wrongpassword',
                    newPassword: 'newpassword123',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    // ================================================================
    // account.updateProfile
    // ================================================================
    describe('account.updateProfile', () => {
        it('TC-SM5: 이름 변경 → { displayName: "새이름" }', async () => {
            const caller = createAuthenticatedCaller(seed.ids.accountId, seed.account.name);
            const result = await caller.account.updateProfile({
                displayName: '새이름',
            });

            expect(result).toEqual({ displayName: '새이름' });

            const account = await database.account.findFirst({
                where: { id: seed.account.id },
                select: { displayName: true },
            });
            expect(account!.displayName).toBe('새이름');
        });
    });

    // ================================================================
    // account.deleteAccount
    // ================================================================
    describe('account.deleteAccount', () => {
        it('TC-SM6: 정상 삭제 → success, 소프트 삭제 확인', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.account.deleteAccount({
                password: TEST_PASSWORD,
            });

            expect(result).toEqual({ success: true });

            const account = await database.account.findFirst({
                where: { id: seed.account.id },
                select: { deletedAt: true, organizationId: true, role: true },
            });
            expect(account!.deletedAt).not.toBeNull();
            expect(account!.organizationId).toBeNull();
            expect(account!.role).toBeNull();
        });

        it('TC-SM7: 비밀번호 불일치 → UNAUTHORIZED', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.account.deleteAccount({
                    password: 'wrongpassword',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('TC-SM8: 미소속 계정 삭제 → 본인 PENDING 합류 요청 REJECTED + pendingLock 해제 (A-3 고아 방지)', async () => {
            const now = getNowKST();
            const applicant = await database.account.create({
                data: {
                    name: '미소속신청자',
                    displayName: '미소속신청자',
                    password: TEST_PASSWORD_HASH,
                    role: null,
                    organizationId: null,
                    createdAt: now,
                    privacyAgreedAt: now,
                },
            });
            const joinRequest = await database.joinRequest.create({
                data: {
                    accountId: applicant.id,
                    organizationId: seed.org.id,
                    status: JOIN_REQUEST_STATUS.PENDING,
                    pendingLock: true,
                    createdAt: now,
                    updatedAt: now,
                },
            });

            // 미소속 caller (role/organizationId 없음 → fall-through 분기)
            const caller = createAuthenticatedCaller(String(applicant.id), applicant.name);
            const result = await caller.account.deleteAccount({ password: TEST_PASSWORD });

            expect(result).toEqual({ success: true });

            const updatedRequest = await database.joinRequest.findUnique({ where: { id: joinRequest.id } });
            expect(updatedRequest?.status).toBe(JOIN_REQUEST_STATUS.REJECTED);
            expect(updatedRequest?.pendingLock).toBeNull();

            const account = await database.account.findFirst({
                where: { id: applicant.id },
                select: { deletedAt: true },
            });
            expect(account?.deletedAt).not.toBeNull();
        });

        it('TC-SM9: TEACHER 탈퇴 → organizationId/role 모두 해제 (강퇴와 대칭) + 조직 cascade 미발동', async () => {
            const now = getNowKST();
            const teacher = await database.account.create({
                data: {
                    name: '소속교사',
                    displayName: '소속교사',
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
            const result = await caller.account.deleteAccount({ password: TEST_PASSWORD });

            expect(result).toEqual({ success: true });

            const account = await database.account.findUnique({ where: { id: teacher.id } });
            expect(account!.deletedAt).not.toBeNull();
            expect(account!.organizationId).toBeNull();
            expect(account!.role).toBeNull();

            // TEACHER 탈퇴는 조직 cascade 미발동
            const org = await database.organization.findUnique({ where: { id: seed.org.id } });
            expect(org!.deletedAt).toBeNull();
        });

        it('TC-SM10: 탈퇴 후 복원 → 미소속 + role 해제 상태 ("role 있음 + 조직 없음" 모순 회귀 방지)', async () => {
            // 유일 멤버 ADMIN 탈퇴 (cascade) 후 복원
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            await caller.account.deleteAccount({ password: TEST_PASSWORD });

            const publicCaller = createPublicCaller();
            await publicCaller.auth.restoreAccount({ name: seed.account.name, password: TEST_PASSWORD });

            const account = await database.account.findUnique({ where: { id: seed.account.id } });
            expect(account!.deletedAt).toBeNull();
            expect(account!.organizationId).toBeNull();
            expect(account!.role).toBeNull();
        });
    });
});
