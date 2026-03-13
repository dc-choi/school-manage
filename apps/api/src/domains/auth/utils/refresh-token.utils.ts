/**
 * Refresh Token Utils
 *
 * RT 생성, 해싱, 쿠키 설정/삭제
 */
import type { Response } from 'express';
import crypto from 'node:crypto';
import { env } from '~/global/config/env.js';

const COOKIE_NAME = 'refresh_token';
const RT_BYTES = 32; // 256-bit random token

/**
 * 랜덤 Refresh Token 생성 (hex string, 64자)
 */
export const generateRefreshToken = (): string => {
    return crypto.randomBytes(RT_BYTES).toString('hex');
};

/**
 * Refresh Token SHA-256 해시 (DB 저장용)
 */
export const hashRefreshToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Token Family ID 생성 (UUID v4)
 */
export const generateFamilyId = (): string => {
    return crypto.randomUUID();
};

/**
 * RT 만료 시각 계산 (JWT_EXPIRE_REFRESH 기준)
 */
export const getRefreshTokenExpiry = (): Date => {
    const expireStr = env.jwt.expire.refresh;
    const match = expireStr.match(/^(\d+)([dhms])$/);
    if (!match) {
        // 기본값 14일
        return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const ms = { d: 86400000, h: 3600000, m: 60000, s: 1000 }[unit] ?? 86400000;
    return new Date(Date.now() + value * ms);
};

/**
 * RT httpOnly 쿠키 설정
 */
export const setRefreshTokenCookie = (res: Response, token: string): void => {
    const expiry = getRefreshTokenExpiry();
    const maxAgeMs = expiry.getTime() - Date.now();

    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: !!env.mode.prod,
        sameSite: 'lax',
        path: '/trpc',
        maxAge: maxAgeMs,
    });
};

/**
 * RT 쿠키 삭제
 */
export const clearRefreshTokenCookie = (res: Response): void => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: !!env.mode.prod,
        sameSite: 'lax',
        path: '/trpc',
    });
};

/**
 * 요청에서 RT 쿠키 추출
 */
export const getRefreshTokenFromCookies = (cookies: Record<string, string>): string | undefined => {
    return cookies?.[COOKIE_NAME];
};
