/**
 * Lenit 피드백 위젯 로더
 *
 * 인증 사용자에게 플로팅 피드백 버튼(https://lenit.cloud)을 노출한다.
 * - VITE_LENIT_BOARD_KEY 미설정 시 no-op (로컬/테스트/개발 환경 격리)
 * - userId가 비어있으면 no-op (로그인 직후 PK 미확정 과도기 보호)
 * - 세션 내 스크립트는 1회만 주입 (StrictMode 이중 렌더/계정 재설정에도 멱등)
 * - 로드 실패가 앱 동작을 막지 않음 (에러 격리)
 *
 * 트리거: 계정 로드 완료 시 (AuthProvider)
 */

const WIDGET_SRC = 'https://lenit.cloud/widget.js';

/** Lenit 세그먼트용 앱 공통 상수 속성 (모든 사용자 동일). 식별 정보 없음. */
const STATIC_TRAITS: LenitTraits = {
    plan: 'free',
    language: 'ko',
    country: 'KR',
    industry: 'religious-education',
};

let loaded = false;

const getBoardKey = (): string | null => {
    return import.meta.env.VITE_LENIT_BOARD_KEY?.trim() || null;
};

/**
 * Lenit 위젯을 로드한다. 조건 미충족 시 조용히 no-op.
 * @param userId 로그인 계정 PK (account.id, 문자열)
 * @param traits 세그먼트 분석용 동적 속성 (선택). 앱 공통 상수(STATIC_TRAITS)와 병합되어 전송된다.
 */
export const loadLenit = (userId: string, traits?: LenitTraits): void => {
    if (loaded || !userId) return;

    const boardKey = getBoardKey();
    if (!boardKey) return;

    // HMR/모듈 재로드로 loaded 플래그가 초기화돼도 스크립트 중복 주입 방지
    if (document.querySelector(`script[src="${WIDGET_SRC}"]`)) {
        loaded = true;
        return;
    }

    try {
        const config: LenitConfig = { boardKey, userId, traits: { ...STATIC_TRAITS, ...traits } };

        window.Lenit = window.Lenit || [];
        window.Lenit.push(config);

        const script = document.createElement('script');
        script.src = WIDGET_SRC;
        script.async = true;
        document.body.appendChild(script);

        loaded = true;
    } catch (error) {
        console.warn('[Lenit] 위젯 로드 실패:', error);
    }
};
