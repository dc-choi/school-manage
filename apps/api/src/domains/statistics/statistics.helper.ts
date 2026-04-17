import { sql } from 'kysely';

/** 출석 점수 계산 SQL — ◎=2, ○=1, △=1, 그 외=0 */
export const ATTENDANCE_SCORE_SQL = sql<number>`SUM(CASE
    WHEN a.content = '◎' THEN 2
    WHEN a.content = '○' THEN 1
    WHEN a.content = '△' THEN 1
    ELSE 0
END)`;

/** 출석 인정(◎/○/△) 카운트 SQL */
export const PRESENT_COUNT_SQL = sql<number>`SUM(CASE
    WHEN a.content IN ('◎', '○', '△') THEN 1
    ELSE 0
END)`;
