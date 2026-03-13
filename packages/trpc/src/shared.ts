/**
 * @school/trpc/shared - 공통 타입 정의
 *
 * 서버/클라이언트 모두에서 사용하는 공통 타입
 * 런타임 의존성 없음
 */

/**
 * 조직 내 역할
 */
export const ROLE = {
    ADMIN: 'ADMIN',
    TEACHER: 'TEACHER',
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

/**
 * 합류 요청 상태
 */
export const JOIN_REQUEST_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
} as const;

export type JoinRequestStatus = (typeof JOIN_REQUEST_STATUS)[keyof typeof JOIN_REQUEST_STATUS];

/**
 * 성별
 */
export const GENDER = {
    MALE: 'M',
    FEMALE: 'F',
} as const;

export type Gender = (typeof GENDER)[keyof typeof GENDER];

/**
 * 조직 타입
 */
export const ORGANIZATION_TYPE = {
    ELEMENTARY: 'ELEMENTARY',
    MIDDLE_HIGH: 'MIDDLE_HIGH',
    YOUNG_ADULT: 'YOUNG_ADULT',
} as const;

export type OrganizationType = (typeof ORGANIZATION_TYPE)[keyof typeof ORGANIZATION_TYPE];

/**
 * 타입별 졸업 연령 (한국 나이 기준)
 */
export const MAX_GRADUATION_AGE: Record<OrganizationType, number | null> = {
    ELEMENTARY: 14,
    MIDDLE_HIGH: 20,
    YOUNG_ADULT: null,
} as const;

export const getMaxGraduationAge = (type: OrganizationType): number | null => {
    return MAX_GRADUATION_AGE[type];
};

/**
 * 출석 표시 (출석으로 인정되는 마크)
 */
export const PRESENT_MARKS = new Set(['◎', '○', '△']) as ReadonlySet<string>;

/**
 * 인증된 계정 정보
 */
export interface AccountInfo {
    id: string;
    name: string;
    displayName: string;
    organizationId?: string;
    role?: Role;
}

/**
 * 조직 정보 (Organization + Church 요약)
 */
export interface OrganizationInfo {
    id: string;
    name: string;
    churchId: string;
    churchName: string;
}

/**
 * 본당 정보 (Church + Parish 요약)
 */
export interface ChurchInfo {
    id: string;
    name: string;
    parishId: string;
    parishName: string;
}
