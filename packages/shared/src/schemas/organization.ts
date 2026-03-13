/**
 * Organization 도메인 Zod 스키마
 */
import { ORGANIZATION_TYPE } from '../constants.js';
import type { Role } from '../constants.js';
import { idSchema } from './common.js';
import { z } from 'zod';

/**
 * 조직 목록 조회 입력 스키마
 */
export const listOrganizationsInputSchema = z.object({
    churchId: idSchema,
});

/**
 * 조직 생성 입력 스키마
 */
export const createOrganizationInputSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    churchId: idSchema,
    type: z
        .enum([ORGANIZATION_TYPE.ELEMENTARY, ORGANIZATION_TYPE.MIDDLE_HIGH, ORGANIZATION_TYPE.YOUNG_ADULT])
        .default(ORGANIZATION_TYPE.MIDDLE_HIGH)
        .optional(),
});

/**
 * 조직 합류 요청 입력 스키마
 */
export const requestJoinInputSchema = z.object({
    organizationId: idSchema,
});

/**
 * 합류 요청 승인 입력 스키마
 */
export const approveJoinInputSchema = z.object({
    joinRequestId: idSchema,
});

/**
 * 합류 요청 거부 입력 스키마
 */
export const rejectJoinInputSchema = z.object({
    joinRequestId: idSchema,
});

// 입력 타입 export
export type ListOrganizationsInput = z.infer<typeof listOrganizationsInputSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationInputSchema>;
export type RequestJoinInput = z.infer<typeof requestJoinInputSchema>;
export type ApproveJoinInput = z.infer<typeof approveJoinInputSchema>;
export type RejectJoinInput = z.infer<typeof rejectJoinInputSchema>;

// ============================================================
// 출력 타입 (Output Types)
// ============================================================

/**
 * 조직 목록 항목
 */
export interface OrganizationItem {
    id: string;
    name: string;
    memberCount: number;
}

/**
 * 조직 목록 조회 응답
 */
export interface ListOrganizationsOutput {
    organizations: OrganizationItem[];
}

/**
 * 조직 생성 응답
 */
export interface CreateOrganizationOutput {
    id: string;
    name: string;
    churchId: string;
    type: string;
}

/**
 * 합류 요청 응답
 */
export interface RequestJoinOutput {
    joinRequestId: string;
}

/**
 * 대기 중인 합류 요청 항목
 */
export interface PendingRequestItem {
    id: string;
    accountDisplayName: string;
    createdAt: string;
}

/**
 * 대기 중인 합류 요청 목록 응답
 */
export interface PendingRequestsOutput {
    requests: PendingRequestItem[];
}

/**
 * 조직 멤버 항목
 */
export interface MemberItem {
    id: string;
    displayName: string;
    role: Role;
    joinedAt: string;
}

/**
 * 조직 멤버 목록 응답
 */
export interface MembersOutput {
    members: MemberItem[];
}
