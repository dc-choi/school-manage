import type { Context } from '@school/trpc';
import { TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { decodeToken } from '~/domains/auth/utils/token.utils.js';
import { database } from '~/infrastructure/database/database.js';
import { logger } from '~/infrastructure/logger/logger.js';

/**
 * tRPC 컨텍스트 생성 함수
 *
 * - Authorization 헤더에서 Bearer 토큰 파싱
 * - 토큰 검증 (jwt.verify가 만료 검증 포함)
 * - decoded에서 직접 account 정보 추출
 * - 인증된 사용자의 경우 DB에서 privacyAgreedAt + Organization 조인 조회
 */
export const createContext = async ({ req, res }: CreateExpressContextOptions): Promise<Context> => {
    const baseContext: Context = { req, res };

    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer')) {
        return baseContext;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return baseContext;
    }

    try {
        const decoded = decodeToken(token);

        // DB에서 privacyAgreedAt + Organization→Church→Parish 조인 조회
        const account = await database.account.findFirst({
            where: { id: BigInt(decoded.id), deletedAt: null },
            select: {
                displayName: true,
                privacyAgreedAt: true,
                organizationId: true,
                role: true,
                organization: {
                    select: {
                        id: true,
                        name: true,
                        churchId: true,
                        church: {
                            select: {
                                id: true,
                                name: true,
                                parishId: true,
                                parish: {
                                    select: { id: true, name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        const ctx: Context = {
            ...baseContext,
            account: {
                id: decoded.id,
                name: decoded.name,
                displayName: account?.displayName ?? decoded.name,
                organizationId: account?.organizationId ? String(account.organizationId) : undefined,
                role: (account?.role as import('@school/trpc').Role) ?? undefined,
            },
            privacyAgreedAt: account?.privacyAgreedAt ?? null,
        };

        // 조직 소속인 경우 organization, church 컨텍스트 설정
        if (account?.organization) {
            const org = account.organization;
            const church = org.church;

            ctx.organization = {
                id: String(org.id),
                name: org.name,
                churchId: String(org.churchId),
                churchName: church.name,
            };

            ctx.church = {
                id: String(church.id),
                name: church.name,
                parishId: String(church.parishId),
                parishName: church.parish.name,
            };
        }

        return ctx;
    } catch (error) {
        // TRPCError (인증 에러)는 그대로 throw
        if (error instanceof TRPCError) {
            throw error;
        }

        // 예상치 못한 에러만 로깅 후 기본 컨텍스트 반환
        logger.error('Unexpected error in createContext:', error);
        return baseContext;
    }
};
