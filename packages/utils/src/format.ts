/**
 * 연락처를 포맷팅하여 반환 (010-XXXX-XXXX 형식)
 * 숫자로 저장되면서 앞의 0이 사라진 경우를 처리 (1012341234 → 010-1234-1234)
 *
 * @param contact 연락처 숫자 (e.g., 1012345678 또는 undefined)
 * @returns 포맷팅된 연락처 문자열
 */
export const formatContact = (contact?: number | null): string => {
    if (!contact) return '-';
    // 숫자로 저장되면서 앞의 0이 사라진 경우 (1012341234 → 01012341234)
    const str = contact.toString().padStart(11, '0');
    return `${str.slice(0, 3)}-${str.slice(3, 7)}-${str.slice(7)}`;
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
