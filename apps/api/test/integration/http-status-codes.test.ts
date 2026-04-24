/**
 * HTTP 상태 코드 통합 테스트
 *
 * tRPC caller는 HTTP 레이어를 우회하므로, 실제 HTTP 응답 상태 코드는 검증되지 않는다.
 * 본 테스트는 createApp() + fetch로 HTTP 레이어를 직접 호출하여 상태 코드를 검증한다.
 *
 * 회귀 게이트:
 * - tRPC 응답 본문 포맷은 동일 (클라이언트 무영향)
 * - 단일/배치 모두 procedure 에러 코드에 맞는 HTTP 상태 반환
 */
import { TEST_PASSWORD, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '~/app.js';

let server: Server;
let baseUrl: string;

beforeAll(async () => {
    const app = createApp();
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
    await truncateAll();
    await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

beforeEach(async () => {
    await truncateAll();
});

const callSingle = async (path: string, input: unknown) => {
    return fetch(`${baseUrl}/trpc/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: input }),
    });
};

const queryGet = async (path: string, input: unknown) => {
    const url = new URL(`${baseUrl}/trpc/${path}`);
    if (input !== undefined) {
        url.searchParams.set('input', JSON.stringify({ json: input }));
    }
    return fetch(url, { method: 'GET' });
};

const callBatch = async (calls: Array<{ path: string; input: unknown }>, headers: Record<string, string> = {}) => {
    const paths = calls.map((c) => c.path).join(',');
    const body: Record<string, { json: unknown }> = {};
    calls.forEach((c, i) => {
        body[i] = { json: c.input };
    });
    return fetch(`${baseUrl}/trpc/${paths}?batch=1`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
};

describe('HTTP 상태 코드 - 단일 호출', () => {
    it('TC-1: procedure 성공 → 200', async () => {
        const seed = await seedBase();
        const res = await callSingle('auth.login', {
            name: seed.account.name,
            password: TEST_PASSWORD,
        });
        expect(res.status).toBe(200);
    });

    it('TC-2: UNAUTHORIZED throw → 401', async () => {
        await seedBase();
        const res = await callSingle('auth.login', {
            name: 'nonexistent',
            password: 'wrong-password-12345',
        });
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body?.error?.json?.data?.code).toBe('UNAUTHORIZED');
    });

    it('TC-3a: BAD_REQUEST (Zod 검증 실패) → 400', async () => {
        const res = await callSingle('auth.login', { name: '', password: '' });
        expect(res.status).toBe(400);
    });

    it('TC-3b: 인증 누락 (UNAUTHORIZED) → 401', async () => {
        const res = await queryGet('account.get', undefined);
        expect(res.status).toBe(401);
    });
});

describe('HTTP 상태 코드 - 배치 호출 (httpBatchLink)', () => {
    it('TC-4: 배치 전부 성공 → 200', async () => {
        const seed = await seedBase();
        const res = await callBatch([
            { path: 'auth.login', input: { name: seed.account.name, password: TEST_PASSWORD } },
            { path: 'auth.login', input: { name: seed.account.name, password: TEST_PASSWORD } },
        ]);
        expect(res.status).toBe(200);
    });

    it('TC-5: 배치 중 1건 UNAUTHORIZED → 401 (silent refresh 트리거 보장)', async () => {
        const seed = await seedBase();
        const res = await callBatch([
            { path: 'auth.login', input: { name: 'nonexistent', password: 'wrong-pw-12345' } },
            { path: 'auth.login', input: { name: seed.account.name, password: TEST_PASSWORD } },
        ]);
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body[0]?.error?.json?.data?.code).toBe('UNAUTHORIZED');
        expect(body[1]?.result?.data?.json?.accessToken).toBeTypeOf('string');
    });
});

describe('HTTP 상태 코드 - tRPC 외 라우트 (Express 폴백)', () => {
    it('TC-E1: 정의되지 않은 경로 → 404', async () => {
        const res = await fetch(`${baseUrl}/no-such-route-xyz`, { method: 'GET' });
        expect(res.status).toBe(404);
    });

    it('TC-E2: JSON 파싱 실패 → 400', async () => {
        const res = await fetch(`${baseUrl}/trpc/auth.login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{not-valid-json',
        });
        expect(res.status).toBe(400);
    });
});
