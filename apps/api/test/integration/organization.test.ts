/**
 * Organization 통합 테스트 (tRPC + Prisma Mocking)
 *
 * 조직 생성 시 동일 이름 차단, 타입 필수 입력 검증
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { createMockAccount, createMockOrganization } from '../helpers/mock-data.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('organization 통합 테스트', () => {
    beforeEach(() => {
        mockPrismaClient.organization.findFirst.mockReset();
        mockPrismaClient.organization.findMany.mockReset();
        mockPrismaClient.organization.create.mockReset();
        mockPrismaClient.account.update.mockReset();
        mockPrismaClient.accountSnapshot.create.mockReset();
        mockPrismaClient.group.updateMany.mockReset();
        mockPrismaClient.student.updateMany.mockReset();
    });

    describe('organization.create', () => {
        it('고유 이름으로 조직 생성 성공', async () => {
            const testAccount = createMockAccount({ id: BigInt(1) });
            const newOrg = createMockOrganization({ name: '초등부', type: 'ELEMENTARY', churchId: BigInt(1) });

            // $transaction mock (findFirst + create 모두 tx 내부)
            const txMock = {
                organization: {
                    findFirst: vi.fn().mockResolvedValue(null),
                    create: vi.fn().mockResolvedValue(newOrg),
                },
                account: {
                    update: vi.fn().mockResolvedValue({ ...testAccount, organizationId: newOrg.id, role: 'ADMIN' }),
                },
                accountSnapshot: {
                    create: vi.fn().mockResolvedValue({}),
                },
                group: {
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                },
                student: {
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                },
            };
            (mockPrismaClient as any).$transaction = vi.fn().mockImplementation((cb: any) => cb(txMock));

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.organization.create({
                churchId: '1',
                name: '초등부',
                type: 'ELEMENTARY',
            });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name', '초등부');
            expect(result).toHaveProperty('type', 'ELEMENTARY');
        });

        it('같은 Church 내 동일 이름 조직 생성 시 CONFLICT 에러', async () => {
            const testAccount = createMockAccount({ id: BigInt(1) });
            const existingOrg = createMockOrganization({ name: '중고등부', churchId: BigInt(1) });

            // $transaction 내부에서 동일 이름 발견
            const txMock = {
                organization: {
                    findFirst: vi.fn().mockResolvedValue(existingOrg),
                },
            };
            (mockPrismaClient as any).$transaction = vi.fn().mockImplementation((cb: any) => cb(txMock));

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            await expect(
                caller.organization.create({ churchId: '1', name: '중고등부', type: 'MIDDLE_HIGH' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('다른 Church에서 동일 이름 조직 생성 허용', async () => {
            const testAccount = createMockAccount({ id: BigInt(1) });
            const newOrg = createMockOrganization({ name: '중고등부', churchId: BigInt(2) });

            const txMock = {
                organization: {
                    findFirst: vi.fn().mockResolvedValue(null),
                    create: vi.fn().mockResolvedValue(newOrg),
                },
                account: {
                    update: vi.fn().mockResolvedValue({ ...testAccount, organizationId: newOrg.id, role: 'ADMIN' }),
                },
                accountSnapshot: {
                    create: vi.fn().mockResolvedValue({}),
                },
                group: {
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                },
                student: {
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                },
            };
            (mockPrismaClient as any).$transaction = vi.fn().mockImplementation((cb: any) => cb(txMock));

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.organization.create({
                churchId: '2',
                name: '중고등부',
                type: 'MIDDLE_HIGH',
            });

            expect(result).toHaveProperty('name', '중고등부');
        });

        it('type 미전송 시 BAD_REQUEST 에러', async () => {
            const testAccount = createMockAccount({ id: BigInt(1) });
            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);

            await expect(caller.organization.create({ churchId: '1', name: '테스트' } as any)).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(
                caller.organization.create({ churchId: '1', name: '테스트', type: 'MIDDLE_HIGH' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });
});
