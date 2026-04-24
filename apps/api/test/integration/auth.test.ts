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
        it('존재하지 않는 계정으로 로그인 시 UNAUTHORIZED (통일 메시지)', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: 'nonexistent-account-test',
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
                message: '아이디 또는 비밀번호가 올바르지 않습니다.',
            });
        });

        it('잘못된 비밀번호로 로그인 시 UNAUTHORIZED (통일 메시지)', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: seed.account.name,
                    password: 'wrongpassword123',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
                message: '아이디 또는 비밀번호가 올바르지 않습니다.',
            });
        });

        it('존재하지 않는 계정과 잘못된 비밀번호의 응답이 동일해야 함 (사용자 열거 방지)', async () => {
            const caller = createPublicCaller();

            const nonexistentError = (await caller.auth
                .login({ name: 'nonexistent-account-test', password: 'wrongpassword123' })
                .catch((e: unknown) => e)) as { code: string; message: string };

            const wrongPasswordError = (await caller.auth
                .login({ name: seed.account.name, password: 'wrongpassword123' })
                .catch((e: unknown) => e)) as { code: string; message: string };

            expect(nonexistentError.code).toBe(wrongPasswordError.code);
            expect(nonexistentError.message).toBe(wrongPasswordError.message);
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

        it('삭제된 계정 + 잘못된 비밀번호 → UNAUTHORIZED (통일 메시지, 삭제 여부 미노출)', async () => {
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
                code: 'UNAUTHORIZED',
                message: '아이디 또는 비밀번호가 올바르지 않습니다.',
            });
        });

        it('TC-L-N1: name 50자 경계 → Zod 통과 (실존 X → UNAUTHORIZED)', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: 'a'.repeat(50),
                    password: 'anypassword',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('TC-L-E1: name 51자 → BAD_REQUEST', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: 'a'.repeat(51),
                    password: 'anypassword',
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-L-E2: password 129자 → BAD_REQUEST', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.auth.login({
                    name: seed.account.name,
                    password: 'a'.repeat(129),
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });
});

describe('auth.signup 통합 테스트', () => {
    const makeSignupInput = (overrides: Partial<{ name: string; displayName: string; password: string }> = {}) => ({
        name: overrides.name ?? 'newuser01',
        displayName: overrides.displayName ?? '새유저',
        password: overrides.password ?? 'password1234',
        privacyAgreed: true as const,
    });

    describe('정상 케이스', () => {
        it('신규 name으로 가입 성공', async () => {
            const caller = createPublicCaller();
            const result = await caller.auth.signup(makeSignupInput({ name: 'newuser01' }));

            expect(result).toHaveProperty('accessToken');
            expect(result.name).toBe('newuser01');
            expect(result.displayName).toBe('새유저');
        });
    });

    describe('예외 케이스', () => {
        it('활성 계정과 동일 name 가입 시 CONFLICT (앱 레벨 감지)', async () => {
            await database.account.create({
                data: {
                    name: 'existinguser',
                    displayName: '기존유저',
                    password: TEST_PASSWORD_HASH,
                    createdAt: getNowKST(),
                    privacyAgreedAt: getNowKST(),
                },
            });

            const caller = createPublicCaller();

            await expect(caller.auth.signup(makeSignupInput({ name: 'existinguser' }))).rejects.toMatchObject({
                code: 'CONFLICT',
                message: '이미 사용 중인 아이디입니다.',
            });
        });

        it('탈퇴한 계정과 동일 name 가입 시 CONFLICT (DB UNIQUE 감지)', async () => {
            const deletedAt = new Date();
            deletedAt.setMonth(deletedAt.getMonth() - 6);

            await database.account.create({
                data: {
                    name: 'deleteduser',
                    displayName: '탈퇴유저',
                    password: TEST_PASSWORD_HASH,
                    createdAt: getNowKST(),
                    deletedAt,
                },
            });

            const caller = createPublicCaller();

            await expect(caller.auth.signup(makeSignupInput({ name: 'deleteduser' }))).rejects.toMatchObject({
                code: 'CONFLICT',
                message: '이미 사용 중인 아이디입니다.',
            });
        });

        it('동일 name으로 동시 가입 시 정확히 1건 성공, 1건 CONFLICT (race condition 방어)', async () => {
            const caller = createPublicCaller();

            const results = await Promise.allSettled([
                caller.auth.signup(makeSignupInput({ name: 'raceuser' })),
                caller.auth.signup(makeSignupInput({ name: 'raceuser' })),
            ]);

            const fulfilled = results.filter((r) => r.status === 'fulfilled');
            const rejected = results.filter((r) => r.status === 'rejected');

            expect(fulfilled).toHaveLength(1);
            expect(rejected).toHaveLength(1);
            expect((rejected[0] as PromiseRejectedResult).reason).toMatchObject({
                code: 'CONFLICT',
                message: '이미 사용 중인 아이디입니다.',
            });

            // DB에 정확히 1개만 존재 확인
            const count = await database.account.count({ where: { name: 'raceuser' } });
            expect(count).toBe(1);
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
