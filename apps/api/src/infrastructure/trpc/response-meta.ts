import type { ResponseMeta } from '@trpc/server/http';

/**
 * tRPC 배치 응답에서 첫 에러의 httpStatus를 채택해 HTTP 상태 코드를 결정한다.
 *
 * 단일 호출은 tRPC의 기본 매핑이 올바르게 동작하지만, 여러 상태가 섞인 배치 응답은
 * `getHTTPStatusCode`가 207(Multi-Status)을 반환한다. 프론트엔드 silent refresh는
 * 401을 정확히 감지해야 하므로 첫 에러 기준으로 단일 상태 코드를 선택한다.
 *
 * tRPC v10 내부 구현상 responseMeta의 `errors`는 TRPCError 인스턴스가 아닌
 * 에러 shape(`{ message, code, data: { httpStatus, code, ... } }`)을 담고 있어
 * `data.httpStatus`를 직접 참조한다.
 */
type ErrorShape = { data?: { httpStatus?: number } };

export const buildResponseMeta = ({ errors }: { errors: unknown[] }): ResponseMeta => {
    if (errors.length === 0) return {};
    const firstError = errors[0] as ErrorShape;
    const httpStatus = firstError.data?.httpStatus;
    return typeof httpStatus === 'number' ? { status: httpStatus } : {};
};
