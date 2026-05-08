import { useCallback, useEffect, useState } from 'react';
import { usePwaEnvironment } from '~/hooks/usePwaEnvironment';
import { analytics } from '~/lib/analytics';
import {
    PWA_FIRST_ATTENDANCE_EVENT,
    PWA_STORAGE,
    isDismissExpired,
    safeGetItem,
    safeSetItem,
    shouldShowGuideForEnv,
} from '~/lib/pwa';

const FIRST_ATTENDANCE_GUIDE_DELAY_MS = 1000;

interface UsePwaGuideTriggerResult {
    shouldShow: boolean;
    env: ReturnType<typeof usePwaEnvironment>['env'];
    onDismiss: (persistent: boolean) => void;
}

const evaluatePolicy = (
    env: UsePwaGuideTriggerResult['env'],
    isStandalone: boolean,
    isMobile: boolean,
    firstAttendanceDone: boolean,
    sessionShown: boolean
): boolean => {
    if (!isMobile || isStandalone) return false;
    if (!shouldShowGuideForEnv(env)) return false;
    if (!firstAttendanceDone) return false;
    if (sessionShown) return false;

    if (typeof window === 'undefined') return false;
    if (safeGetItem(PWA_STORAGE.DISABLED) === 'true') return false;
    if (!isDismissExpired(safeGetItem(PWA_STORAGE.DISMISSED_AT))) return false;

    return true;
};

/**
 * PWA 가이드 카드 노출 정책 평가 + 첫 출석 트리거 구독.
 * 노출 차단 조건 (AND): 모바일 / standalone X / desktop·other-mobile 아님 /
 * DISABLED 아님 / dismiss 7일 경과 / 첫 출석 발화 / 같은 세션 미노출.
 */
export const usePwaGuideTrigger = (): UsePwaGuideTriggerResult => {
    const { env, isStandalone, isMobile } = usePwaEnvironment();
    const [firstAttendanceDone, setFirstAttendanceDone] = useState<boolean>(
        () => safeGetItem(PWA_STORAGE.FIRST_ATTENDANCE_DONE) === 'true'
    );
    const [delayedTrigger, setDelayedTrigger] = useState<boolean>(false);
    const [sessionShown, setSessionShown] = useState<boolean>(false);

    // 같은 세션 첫 출석 dispatch → 1초 후 트리거 활성
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (firstAttendanceDone) {
            setDelayedTrigger(true);
            return;
        }

        const handler = (): void => {
            setFirstAttendanceDone(true);
            window.setTimeout(() => setDelayedTrigger(true), FIRST_ATTENDANCE_GUIDE_DELAY_MS);
        };
        window.addEventListener(PWA_FIRST_ATTENDANCE_EVENT, handler);
        return () => window.removeEventListener(PWA_FIRST_ATTENDANCE_EVENT, handler);
    }, [firstAttendanceDone]);

    const shouldShow = delayedTrigger && evaluatePolicy(env, isStandalone, isMobile, firstAttendanceDone, sessionShown);

    const onDismiss = useCallback(
        (persistent: boolean): void => {
            if (persistent) {
                safeSetItem(PWA_STORAGE.DISABLED, 'true');
            } else {
                safeSetItem(PWA_STORAGE.DISMISSED_AT, new Date().toISOString());
            }
            setSessionShown(true);
            analytics.trackPwaGuideDismissed(env, persistent);
        },
        [env]
    );

    return { shouldShow, env, onDismiss };
};
