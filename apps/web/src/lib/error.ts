/**
 * unknown 타입 에러에서 사용자 표시용 메시지를 추출한다.
 * tRPC 에러, Zod 유효성 에러, Error 인스턴스, 기타 모든 타입을 안전하게 처리한다.
 *
 * Zod 유효성 에러는 message가 JSON 배열 문자열로 전달되므로
 * 모든 이슈의 message를 추출하여 줄바꿈으로 합쳐 사용자에게 보여준다.
 */
export const extractErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        const msg = error.message;

        // tRPC Zod 유효성 에러: message가 JSON 배열 문자열
        // e.g. '[{"code":"too_small","message":"Name is required","path":["name"]}]'
        if (msg.startsWith('[')) {
            try {
                const issues = JSON.parse(msg) as { message?: string }[];
                if (Array.isArray(issues) && issues.length > 0) {
                    const messages = issues.map((i) => i.message).filter(Boolean);
                    if (messages.length > 0) {
                        return messages.join('\n');
                    }
                }
            } catch {
                // JSON 파싱 실패 시 원본 메시지 사용
            }
        }

        return msg || '오류가 발생했습니다.';
    }

    if (typeof error === 'string') {
        return error;
    }

    return '오류가 발생했습니다.';
};
