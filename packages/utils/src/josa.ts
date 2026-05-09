/**
 * 한국어 조사 처리 — 받침 유무에 따라 적절한 조사를 선택해서 단어 뒤에 붙인다.
 *
 * 받침 판정: 마지막 글자가 한글이면 (코드 - 0xAC00) % 28 != 0 → 받침 있음
 * 한글이 아닌 경우(영문/숫자) → 발음 휴리스틱 대신 보수적으로 받침 없음 처리
 */

export type JosaPair = '을/를' | '이/가' | '은/는' | '와/과' | '으로/로' | '아/야';

const JOSA_MAP: Record<JosaPair, [withJongseong: string, withoutJongseong: string]> = {
    '을/를': ['을', '를'],
    '이/가': ['이', '가'],
    '은/는': ['은', '는'],
    '와/과': ['과', '와'],
    // ㄹ 받침은 '로'를 쓰는 예외가 있으나 본 프로젝트 라벨(그룹/멤버/학년/학생) 범위 외
    '으로/로': ['으로', '로'],
    '아/야': ['아', '야'],
};

const HANGUL_BASE = 0xac00;
const HANGUL_END = 0xd7a3;
const JONG_COUNT = 28;

/**
 * 마지막 글자에 받침이 있는지 판정.
 *
 * - 한글 음절: (코드 - 0xAC00) % 28 != 0 → 받침 있음
 * - 그 외(영문/숫자/공백): 받침 없음으로 보수 처리
 */
export const hasJongseong = (word: string): boolean => {
    if (!word) return false;
    const lastChar = word[word.length - 1];
    if (!lastChar) return false;
    const code = lastChar.charCodeAt(0);
    if (code < HANGUL_BASE || code > HANGUL_END) return false;
    return (code - HANGUL_BASE) % JONG_COUNT !== 0;
};

/**
 * 단어 뒤에 적절한 조사를 붙여 반환.
 *
 * @example
 * josa('학생', '을/를') // '학생을'
 * josa('멤버', '을/를') // '멤버를'
 * josa('학년', '이/가') // '학년이'
 * josa('그룹', '이/가') // '그룹이' (받침 ㅇ)
 */
export const josa = (word: string, pair: JosaPair): string => {
    const [withJong, withoutJong] = JOSA_MAP[pair];
    return word + (hasJongseong(word) ? withJong : withoutJong);
};
