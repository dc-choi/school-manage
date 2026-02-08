/**
 * 소수점 N자리까지 반올림한다.
 *
 * @param value 반올림할 숫자
 * @param places 소수점 자릿수 (기본값: 1)
 * @returns 반올림된 숫자
 */
export const roundToDecimal = (value: number, places: number = 1): number => {
    const multiplier = Math.pow(10, places);
    return Math.round(value * multiplier) / multiplier;
};

/**
 * 비율을 계산한다. (actual / expected * 100)
 *
 * @param actual 실제 값
 * @param expected 기대 값
 * @param decimalPlaces 소수점 자릿수 (기본값: 1)
 * @returns 비율 (%, 0-100)
 */
export const calculateRate = (actual: number, expected: number, decimalPlaces: number = 1): number => {
    if (expected === 0) return 0;
    const rate = (actual / expected) * 100;
    return roundToDecimal(rate, decimalPlaces);
};
