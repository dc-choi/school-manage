/**
 * 객체에서 null/undefined 값을 가진 속성을 제거한다.
 * 런타임에서 불필요한 속성을 정리하며, 타입은 원본을 유지한다.
 */
export const prune = <T>(obj: T): T => {
    const result = { ...obj } as Record<string, unknown>;
    Object.keys(result).forEach((key) => {
        if (result[key] === undefined || result[key] === null) {
            delete result[key];
        }
    });
    return result as T;
};
