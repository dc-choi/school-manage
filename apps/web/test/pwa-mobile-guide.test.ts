/**
 * pwa-mobile-guide — 환경 감지 / dismiss 정책 / 첫 출석 트리거 단위 테스트
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    PWA_FIRST_ATTENDANCE_EVENT,
    PWA_STORAGE,
    consumeInstallPrompt,
    detectPwaEnv,
    getInstallPrompt,
    isDismissExpired,
    markFirstAttendanceDone,
    setInstallPrompt,
    shouldShowGuideForEnv,
} from '~/lib/pwa';

afterEach(() => {
    localStorage.clear();
    setInstallPrompt(null);
});

describe('detectPwaEnv — userAgent 우선순위', () => {
    const W = 400;

    it('카카오톡 인앱은 안드로이드 Chrome 패턴이 섞여도 kakao로 분류', () => {
        const ua =
            'Mozilla/5.0 (Linux; Android 13; SM-S918N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36;KAKAOTALK 25.5.0';
        expect(detectPwaEnv(ua, W)).toBe('kakao');
    });

    it('인스타그램 / 페이스북 인앱', () => {
        expect(detectPwaEnv('Mozilla/5.0 (iPhone) Instagram 273.0.0', W)).toBe('instagram');
        expect(detectPwaEnv('Mozilla/5.0 (Android) [FBAN/FB4A;FBAV/450.0.0]', W)).toBe('facebook');
    });

    it('iOS Chrome / Firefox는 ios-chrome', () => {
        expect(detectPwaEnv('Mozilla/5.0 (iPhone) CriOS/120.0 Mobile/15E148 Safari/604.1', W)).toBe('ios-chrome');
        expect(detectPwaEnv('Mozilla/5.0 (iPhone) FxiOS/120.0 Mobile/15E148 Safari/604.1', W)).toBe('ios-chrome');
    });

    it('Samsung Internet', () => {
        expect(
            detectPwaEnv(
                'Mozilla/5.0 (Linux; Android 13; SM-S918N) Chrome/120.0 SamsungBrowser/22.0 Mobile Safari/537.36',
                W
            )
        ).toBe('samsung');
    });

    it('iOS Safari — 인앱 패턴 부재', () => {
        expect(detectPwaEnv('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) AppleWebKit/605 Safari/604.1', W)).toBe(
            'ios-safari'
        );
    });

    it('Android Chrome — 인앱 패턴 부재', () => {
        expect(detectPwaEnv('Mozilla/5.0 (Linux; Android 13; Pixel 7) Chrome/120.0 Mobile Safari/537.36', W)).toBe(
            'android-chrome'
        );
    });

    it('데스크탑 Chrome → desktop', () => {
        expect(
            detectPwaEnv(
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605 Chrome/120.0 Safari/537.36',
                1920
            )
        ).toBe('desktop');
    });

    it('모바일 키워드 없는 좁은 뷰포트는 other-mobile', () => {
        expect(detectPwaEnv('Mozilla/5.0 (X11; Linux x86_64)', 400)).toBe('other-mobile');
    });
});

describe('shouldShowGuideForEnv', () => {
    it('desktop / other-mobile은 노출 안 함', () => {
        expect(shouldShowGuideForEnv('desktop')).toBe(false);
        expect(shouldShowGuideForEnv('other-mobile')).toBe(false);
    });

    it('나머지 7종은 노출', () => {
        const envs = [
            'android-chrome',
            'samsung',
            'ios-safari',
            'ios-chrome',
            'kakao',
            'instagram',
            'facebook',
        ] as const;
        for (const env of envs) {
            expect(shouldShowGuideForEnv(env)).toBe(true);
        }
    });
});

describe('isDismissExpired — 7일 재노출 정책', () => {
    const NOW = new Date('2026-05-15T00:00:00Z');

    it('dismissedAt 부재 → 만료 (true)', () => {
        expect(isDismissExpired(null, NOW)).toBe(true);
    });

    it('파싱 실패 → 만료 (true)', () => {
        expect(isDismissExpired('not-a-date', NOW)).toBe(true);
    });

    it('6일 전 → 미만료 (false)', () => {
        const sixDaysAgo = new Date(NOW.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
        expect(isDismissExpired(sixDaysAgo, NOW)).toBe(false);
    });

    it('7일 정확 경과 → 만료 (true)', () => {
        const sevenDaysAgo = new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        expect(isDismissExpired(sevenDaysAgo, NOW)).toBe(true);
    });

    it('7일 1분 경과 → 만료 (true)', () => {
        const past = new Date(NOW.getTime() - (7 * 24 * 60 * 60 * 1000 + 60 * 1000)).toISOString();
        expect(isDismissExpired(past, NOW)).toBe(true);
    });
});

describe('markFirstAttendanceDone — 첫 출석 트리거', () => {
    it('localStorage 마킹 + CustomEvent dispatch', () => {
        const handler = vi.fn();
        window.addEventListener(PWA_FIRST_ATTENDANCE_EVENT, handler);

        markFirstAttendanceDone();

        expect(localStorage.getItem(PWA_STORAGE.FIRST_ATTENDANCE_DONE)).toBe('true');
        expect(handler).toHaveBeenCalledTimes(1);

        window.removeEventListener(PWA_FIRST_ATTENDANCE_EVENT, handler);
    });

    it('이미 마킹된 경우 dispatch 안 함 (idempotent)', () => {
        localStorage.setItem(PWA_STORAGE.FIRST_ATTENDANCE_DONE, 'true');
        const handler = vi.fn();
        window.addEventListener(PWA_FIRST_ATTENDANCE_EVENT, handler);

        markFirstAttendanceDone();

        expect(handler).not.toHaveBeenCalled();
        window.removeEventListener(PWA_FIRST_ATTENDANCE_EVENT, handler);
    });
});

describe('beforeinstallprompt 캡처/소비', () => {
    it('set/get/consume 사이클', () => {
        expect(getInstallPrompt()).toBeNull();

        const fake = { prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted', platform: '' }) };
        setInstallPrompt(fake as unknown as Parameters<typeof setInstallPrompt>[0]);

        expect(getInstallPrompt()).toBe(fake);

        const consumed = consumeInstallPrompt();
        expect(consumed).toBe(fake);
        expect(getInstallPrompt()).toBeNull();
    });
});
