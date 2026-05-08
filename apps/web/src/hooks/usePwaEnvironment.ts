import { useEffect, useMemo, useState } from 'react';
import { type PwaEnv, type PwaEnvironment, detectPwaEnv, isStandaloneMode } from '~/lib/pwa';

const MOBILE_BREAKPOINT_PX = 768;

const evaluateMobile = (env: PwaEnv, innerWidth: number): boolean => {
    if (env === 'desktop') return false;
    if (env === 'other-mobile') return innerWidth < MOBILE_BREAKPOINT_PX;
    return true;
};

/**
 * userAgent + display-mode + 뷰포트 평가로 PWA 환경 감지.
 * SSR/테스트 환경에서는 desktop 폴백.
 */
export const usePwaEnvironment = (): PwaEnvironment => {
    const [innerWidth, setInnerWidth] = useState<number>(() =>
        typeof window === 'undefined' ? 1920 : window.innerWidth
    );
    const [isStandalone, setIsStandalone] = useState<boolean>(() => isStandaloneMode());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleResize = (): void => setInnerWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);

        // matchMedia는 jsdom 등 일부 환경에서 부재하거나 throw 가능 → 가드
        const standaloneMql = window.matchMedia?.('(display-mode: standalone)') ?? null;
        const handleStandalone = (): void => setIsStandalone(isStandaloneMode());
        standaloneMql?.addEventListener?.('change', handleStandalone);

        return () => {
            window.removeEventListener('resize', handleResize);
            standaloneMql?.removeEventListener?.('change', handleStandalone);
        };
    }, []);

    const env = useMemo<PwaEnv>(() => {
        if (typeof window === 'undefined') return 'desktop';
        return detectPwaEnv(window.navigator.userAgent, innerWidth);
    }, [innerWidth]);

    const isMobile = useMemo(() => evaluateMobile(env, innerWidth), [env, innerWidth]);

    return useMemo(() => ({ env, isStandalone, isMobile }), [env, isStandalone, isMobile]);
};
