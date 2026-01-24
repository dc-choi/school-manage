/**
 * 공통 Zod 스키마
 *
 * 여러 도메인에서 재사용하는 기본 스키마 정의
 */
import { z } from 'zod';

/**
 * ID 스키마 (숫자 형식 문자열)
 */
export const idSchema = z.string().regex(/^\d+$/, 'ID must be a numeric string');

/**
 * 페이지 스키마 (양의 정수, 기본값 1)
 */
export const pageSchema = z.number().int().positive().optional().default(1);

/**
 * 검색 옵션 스키마
 */
export const searchOptionSchema = z.string().optional();

/**
 * 검색어 스키마
 */
export const searchWordSchema = z.string().optional();
