/**
 * Auth 통합 테스트 (실제 DB)
 */
import { type SeedBase, TEST_PASSWORD, TEST_PASSWORD_HASH, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createPublicCaller } from '../helpers/trpc-caller.ts';
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

describe('auth.login 통합 테스트', () => {
    describe('정상 케이스', () => {
        it('유효한 자격 증명으로 로그인 성공', async () => {
            const caller = createPublicCaller();
            const result = await caller.auth.login({
                name: seed.account.name,
                password: TEST_PASSWORD,
            });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('name');
            expect(typeof result.accessToken).toBe('string');
            expect(result.name).toBe(seed.account.name);
        });
    });

    describe('예외 케이스', () => {
        it('존재하지 않는 계정으로 로그인 시 NOT_FOUND', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: 'nonexistent-account-test',
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('잘못된 비밀번호로 로그인 시 UNAUTHORIZED', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: seed.account.name,
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('삭제된 계정 + 올바른 비밀번호 + 2년 이내 → FORBIDDEN (ACCOUNT_DELETED)', async () => {
            const deletedAt = new Date();
            deletedAt.setMonth(deletedAt.getMonth() - 6);

            await database.account.create({
                data: {
                    name: '삭제계정',
                    displayName: '삭제계정',
                    password: TEST_PASSWORD_HASH,
                    createdAt: getNowKST(),
                    deletedAt,
                },
            });

            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: '삭제계정',
                    password: TEST_PASSWORD,
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
                message: 'ACCOUNT_DELETED',
            });
        });

        it('삭제된 계정 + 잘못된 비밀번호 → NOT_FOUND (삭제 여부 미노출)', async () => {
            const deletedAt = new Date();
            deletedAt.setMonth(deletedAt.getMonth() - 6);

            await database.account.create({
                data: {
                    name: '삭제계정2',
                    displayName: '삭제계정2',
                    password: TEST_PASSWORD_HASH,
                    createdAt: getNowKST(),
                    deletedAt,
                },
            });

            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: '삭제계정2',
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });
    });
});

describe('auth.restoreAccount 통합 테스트', () => {
    describe('정상 케이스', () => {
        it('삭제된 계정을 정상적으로 복원', async () => {
            const deletedAt = new Date();
            deletedAt.setMonth(deletedAt.getMonth() - 6);

            await database.account.create({
                data: {
                    name: '복원대상',
                    displayName: '복원대상',
                    password: TEST_PASSWORD_HASH,
                    createdAt: getNowKST(),
                    deletedAt,
                },
            });

            const caller = createPublicCaller();
            const result = await caller.auth.restoreAccount({
                name: '복원대상',
                password: TEST_PASSWORD,
            });

            expect(result).toHaveProperty('accessToken');
            expect(result.name).toBe('복원대상');
            expect(result.displayName).toBe('복원대상');
        });
    });

    describe('예외 케이스', () => {
        it('삭제된 계정이 없으면 NOT_FOUND', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.auth.restoreAccount({
                    name: 'nonexistent',
                    password: TEST_PASSWORD,
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('비밀번호 불일치 시 UNAUTHORIZED', async () => {
            const deletedAt = new Date();
            deletedAt.setMonth(deletedAt.getMonth() - 6);

            await database.account.create({
                data: {
                    name: '비밀번호틀림',
                    displayName: '비밀번호틀림',
                    password: TEST_PASSWORD_HASH,
                    createdAt: getNowKST(),
                    deletedAt,
                },
            });

            const caller = createPublicCaller();

            await expect(
                caller.auth.restoreAccount({
                    name: '비밀번호틀림',
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('2년 초과 삭제 계정은 FORBIDDEN', async () => {
            const expiredDate = new Date();
            expiredDate.setFullYear(expiredDate.getFullYear() - 3);

            await database.account.create({
                data: {
                    name: '오래된계정',
                    displayName: '오래된계정',
                    password: TEST_PASSWORD_HASH,
                    createdAt: getNowKST(),
                    deletedAt: expiredDate,
                },
            });

            const caller = createPublicCaller();

            await expect(
                caller.auth.restoreAccount({
                    name: '오래된계정',
                    password: TEST_PASSWORD,
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });
    });
});
