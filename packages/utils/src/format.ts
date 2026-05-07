/**
 * 연락처를 포맷팅하여 반환.
 *
 * - 11자리: 3-4-4 분리 (휴대폰)
 * - 10자리: 3-3-4 분리 (지역번호 — 서울 02 8자리 본번 등)
 * - 8~9자리, 12~15자리: **디지트 그대로 출력** (해외번호·구 번호·비정상 데이터 — 분리 정책 미정의)
 * - null/undefined/빈 디지트: `-`
 *
 * 정책 의도:
 * - DB(`Student.contact: VARCHAR(20)`)가 사용자 원본 디지트를 보존하므로 padStart 보정 불필요 (2026-04 BigInt → String 이관).
 * - 비표준 길이는 임의 분리하지 않고 raw 디지트로 노출하여 운영자가 이상 데이터를 인지할 수 있게 한다 (silent format 방지).
 * - 비숫자 입력은 `replace(/\D/g, '')`로 제거되므로 XSS 표면 0.
 *
 * @param contact 연락처 디지트 문자열 (예: "01012345678") 또는 null/undefined
 */
export const formatContact = (contact?: string | null): string => {
    if (!contact) return '-';
    const digits = contact.replace(/\D/g, '');
    if (!digits) return '-';
    if (digits.length === 11) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
        return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    return digits;
};

/**
 * 날짜를 YYYYMMDD 형식으로 변환한다.
 */
export const formatDateCompact = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
};

/**
 * 현재 KST 날짜를 YYYY-MM-DD 형식으로 반환한다.
 *
 * getNowKST() + formatDateISO()는 이중 오프셋 문제가 있으므로
 * KST 날짜 문자열이 필요할 때는 이 함수를 사용한다.
 */
export const formatKSTDateISO = (date: Date = new Date()): string => {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환한다.
 */
export const formatDateISO = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * 날짜를 한국어 형식으로 변환한다. (YYYY. M. D.)
 * @param date Date 객체 또는 ISO 문자열
 * @param fallback 날짜가 없을 때 반환할 값
 * @returns 포맷팅된 날짜 문자열 또는 fallback
 */
export const formatDateKR = (date: Date | string | null | undefined, fallback = '-'): string => {
    if (!date) return fallback;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString('ko-KR');
};

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * ISO 날짜 문자열을 "M/D (요일)" 형식으로 변환한다.
 * @param dateStr YYYY-MM-DD 형식 문자열
 * @returns 포맷팅된 문자열 (예: "4/5 (일)")
 */
export const formatDateShortKR = (dateStr: string): string => {
    const [, month, day] = dateStr.split('-');
    const date = new Date(dateStr + 'T00:00:00');
    const dayName = DAY_NAMES[date.getDay()];
    return `${Number(month)}/${Number(day)} (${dayName})`;
};
