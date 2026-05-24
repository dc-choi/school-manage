import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const WIDGET_SRC = 'https://lenit.cloud/widget.js';

/** loadLenit이 모든 payload에 병합하는 앱 공통 상수 traits */
const STATIC_TRAITS = { plan: 'free', language: 'ko', country: 'KR', industry: 'religious-education' };

/**
 * loadLenit은 모듈 레벨 `loaded` 플래그로 멱등성을 보장하므로,
 * 각 테스트마다 vi.resetModules()로 모듈을 새로 import 해 상태를 초기화한다.
 */
const importFresh = async () => {
    vi.resetModules();
    return import('~/lib/lenit');
};

const scriptCount = (): number => document.querySelectorAll(`script[src="${WIDGET_SRC}"]`).length;

describe('loadLenit', () => {
    beforeEach(() => {
        document.body.innerHTML = '';
        delete (window as { Lenit?: unknown }).Lenit;
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('TC-1: 유효한 boardKey + userId면 큐에 push하고 스크립트를 1회 주입한다 (상수 traits 병합)', async () => {
        vi.stubEnv('VITE_LENIT_BOARD_KEY', 'vb_test_key');
        const { loadLenit } = await importFresh();

        loadLenit('user-123');

        expect(window.Lenit).toEqual([{ boardKey: 'vb_test_key', userId: 'user-123', traits: STATIC_TRAITS }]);
        expect(scriptCount()).toBe(1);
    });

    it('TC-1b: 동적 traits는 상수 traits 위에 병합된다', async () => {
        vi.stubEnv('VITE_LENIT_BOARD_KEY', 'vb_test_key');
        const { loadLenit } = await importFresh();

        loadLenit('user-123', { role: 'TEACHER', hasOrganization: true, signupDays: 12 });

        expect(window.Lenit).toEqual([
            {
                boardKey: 'vb_test_key',
                userId: 'user-123',
                traits: { ...STATIC_TRAITS, role: 'TEACHER', hasOrganization: true, signupDays: 12 },
            },
        ]);
    });

    it('TC-2: 두 번 호출해도 스크립트는 1회만 주입된다 (멱등)', async () => {
        vi.stubEnv('VITE_LENIT_BOARD_KEY', 'vb_test_key');
        const { loadLenit } = await importFresh();

        loadLenit('user-123');
        loadLenit('user-123');

        expect(window.Lenit).toHaveLength(1);
        expect(scriptCount()).toBe(1);
    });

    it('TC-E1: boardKey가 없으면 push/주입을 하지 않는다', async () => {
        vi.stubEnv('VITE_LENIT_BOARD_KEY', '');
        const { loadLenit } = await importFresh();

        loadLenit('user-123');

        expect(window.Lenit).toBeUndefined();
        expect(scriptCount()).toBe(0);
    });

    it('TC-E2: userId가 빈 문자열이면 push/주입을 하지 않는다', async () => {
        vi.stubEnv('VITE_LENIT_BOARD_KEY', 'vb_test_key');
        const { loadLenit } = await importFresh();

        loadLenit('');

        expect(window.Lenit).toBeUndefined();
        expect(scriptCount()).toBe(0);
    });
});
