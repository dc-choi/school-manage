/**
 * Church 통합 테스트 (tRPC + Prisma Mocking)
 *
 * 본당 생성 시 동일 이름 차단 검증
 */
import { mockPrismaClient } from '../../vitest.setup.ts';
import { createMockAccount } from '../helpers/mock-data.ts';
import { createAuthenticatedCaller, createPublicCaller } from '../helpers/trpc-caller.ts';
import { beforeEach, describe, expect, it } from 'vitest';

describe('church 통합 테스트', () => {
    beforeEach(() => {
        mockPrismaClient.church.findFirst.mockReset();
        mockPrismaClient.church.create.mockReset();
    });

    describe('church.create', () => {
        it('고유 이름으로 본당 생성 성공', async () => {
            const testAccount = createMockAccount({ id: BigInt(1) });

            // 동일 이름 없음
            mockPrismaClient.church.findFirst.mockResolvedValueOnce(null);
            mockPrismaClient.church.create.mockResolvedValueOnce({
                id: BigInt(100),
                name: '양재성당',
                parishId: BigInt(1),
                createdAt: new Date(),
                deletedAt: null,
            });

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.church.create({ parishId: '1', name: '양재성당' });

            expect(result).toHaveProperty('id');
            expect(result).toHaveProperty('name', '양재성당');
            expect(result).toHaveProperty('parishId', '1');
        });

        it('같은 Parish 내 동일 이름 본당 생성 시 CONFLICT 에러', async () => {
            const testAccount = createMockAccount({ id: BigInt(1) });

            // 동일 이름 존재
            mockPrismaClient.church.findFirst.mockResolvedValueOnce({
                id: BigInt(50),
                name: '장위동성당',
                parishId: BigInt(1),
                createdAt: new Date(),
                deletedAt: null,
            });

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            await expect(caller.church.create({ parishId: '1', name: '장위동성당' })).rejects.toMatchObject({
                code: 'CONFLICT',
            });
        });

        it('다른 Parish에서 동일 이름 본당 생성 허용', async () => {
            const testAccount = createMockAccount({ id: BigInt(1) });

            // 다른 parishId이므로 동일 이름 없음
            mockPrismaClient.church.findFirst.mockResolvedValueOnce(null);
            mockPrismaClient.church.create.mockResolvedValueOnce({
                id: BigInt(101),
                name: '장위동성당',
                parishId: BigInt(2),
                createdAt: new Date(),
                deletedAt: null,
            });

            const caller = createAuthenticatedCaller(String(testAccount.id), testAccount.name);
            const result = await caller.church.create({ parishId: '2', name: '장위동성당' });

            expect(result).toHaveProperty('name', '장위동성당');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();
            await expect(caller.church.create({ parishId: '1', name: '테스트성당' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });
});
