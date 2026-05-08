/**
 * PWA 설치 가이드 시스템 — 상수, 헬퍼, beforeinstallprompt 캡처
 *
 * - SPA only: window/navigator/localStorage 모든 접근은 SSR 가드 포함
 * - localStorage 접근은 safeGetItem/safeSetItem로 wrap (Safari Private Browsing /
 *   QuotaExceeded 등 SecurityError 시 기능 degraded, 호출자 크래시 방지)
 * - 9종 환경 감지 매트릭스
 * - 7일 dismiss 재노출 정책
 * - beforeinstallprompt 이벤트는 main.tsx 부트스트랩 시점에 발화하므로
 *   여기 모듈 변수에 캡처해두고 PwaGuideCard CTA 시점에 prompt() 호출
 */

export const PWA_STORAGE = {
    DISMISSED_AT: 'pwa_guide_dismissed_at',
    DISABLED: 'pwa_guide_disabled',
    FIRST_ATTENDANCE_DONE: 'pwa_first_attendance_done',
} as const;

export const PWA_DISMISS_REPROMPT_DAYS = 7;
export const PWA_FIRST_ATTENDANCE_EVENT = 'pwa:first-attendance';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type PwaEnv =
    | 'android-chrome'
    | 'samsung'
    | 'ios-safari'
    | 'ios-chrome'
    | 'kakao'
    | 'instagram'
    | 'facebook'
    | 'other-mobile'
    | 'desktop';

export interface PwaEnvironment {
    env: PwaEnv;
    isStandalone: boolean;
    isMobile: boolean;
}

export interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

/**
 * localStorage 안전 접근 — Safari Private Browsing의 SecurityError /
 * QuotaExceededError / iframe third-party context 차단 등에서 throw 흡수.
 * 호출자가 try/catch 없이 사용 가능.
 */
export const safeGetItem = (key: string): string | null => {
    try {
        if (typeof window === 'undefined') return null;
        return window.localStorage.getItem(key);
    } catch {
        return null;
    }
};

export const safeSetItem = (key: string, value: string): boolean => {
    try {
        if (typeof window === 'undefined') return false;
        window.localStorage.setItem(key, value);
        return true;
    } catch {
        return false;
    }
};

/**
 * userAgent 매칭 우선순위 (가장 구체적 먼저).
 * 역순 매칭 시 카톡 인앱이 Android Chrome으로 오분류됨.
 */
export const detectPwaEnv = (ua: string, innerWidth: number): PwaEnv => {
    if (/KAKAOTALK/i.test(ua)) return 'kakao';
    if (/Instagram/i.test(ua)) return 'instagram';
    if (/FBAN|FBAV/i.test(ua)) return 'facebook';
    if (/CriOS|FxiOS/i.test(ua)) return 'ios-chrome';
    if (/SamsungBrowser/i.test(ua)) return 'samsung';

    const isIOSDevice = /iPhone|iPad|iPod/i.test(ua);
    if (isIOSDevice) return 'ios-safari';

    const isAndroidDevice = /Android/i.test(ua);
    if (isAndroidDevice && /Chrome/i.test(ua)) return 'android-chrome';

    const isMobileUA = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
    if (isMobileUA || innerWidth < 768) return 'other-mobile';

    return 'desktop';
};

export const isStandaloneMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
        if (window.matchMedia?.('(display-mode: standalone)').matches) return true;
    } catch {
        // matchMedia 호출 자체가 실패 (구형 브라우저)
    }
    const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
    return navigatorWithStandalone.standalone === true;
};

export const shouldShowGuideForEnv = (env: PwaEnv): boolean => {
    return env !== 'desktop' && env !== 'other-mobile';
};

/**
 * dismiss 후 재노출 시점 평가.
 * dismissedAt이 부재하거나 7일 경과 시 true. 손상된 값(NaN)도 만료 처리.
 */
export const isDismissExpired = (dismissedAtIso: string | null, now: Date = new Date()): boolean => {
    if (!dismissedAtIso) return true;
    const dismissedAt = Date.parse(dismissedAtIso);
    if (Number.isNaN(dismissedAt)) return true;
    const elapsed = now.getTime() - dismissedAt;
    return elapsed >= PWA_DISMISS_REPROMPT_DAYS * MS_PER_DAY;
};

/**
 * beforeinstallprompt 이벤트 캡처 보관소.
 * main.tsx에서 이벤트 리스너 등록 후 set, PwaGuideCard CTA에서 get → prompt() 호출.
 * beforeinstallprompt는 페이지 로드 시점에 한 번만 발생하므로 모듈 싱글턴으로 관리.
 */
let installPromptEvent: BeforeInstallPromptEvent | null = null;

export const setInstallPrompt = (event: BeforeInstallPromptEvent | null): void => {
    installPromptEvent = event;
};

export const getInstallPrompt = (): BeforeInstallPromptEvent | null => {
    return installPromptEvent;
};

export const consumeInstallPrompt = (): BeforeInstallPromptEvent | null => {
    const event = installPromptEvent;
    installPromptEvent = null;
    return event;
};

/**
 * 첫 출석 입력 트리거 — AttendanceModal 저장 성공 시 호출.
 * localStorage 마킹(safe) + 같은 세션 가이드 훅 알림용 CustomEvent dispatch.
 * localStorage 접근이 실패해도 CustomEvent는 정상 dispatch (in-memory 폴백).
 */
export const markFirstAttendanceDone = (): void => {
    if (typeof window === 'undefined') return;
    if (safeGetItem(PWA_STORAGE.FIRST_ATTENDANCE_DONE) === 'true') return;
    safeSetItem(PWA_STORAGE.FIRST_ATTENDANCE_DONE, 'true');
    window.dispatchEvent(new CustomEvent(PWA_FIRST_ATTENDANCE_EVENT));
};
