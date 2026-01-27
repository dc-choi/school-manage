/**
 * GA4 Server-Side Analytics Module
 *
 * Measurement Protocol을 사용한 서버 사이드 이벤트 전송
 * https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */
import { env } from '~/global/config/env.js';
import { logger } from '~/infrastructure/logger/logger.js';

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

interface GA4EventParams {
    [key: string]: string | number | boolean | undefined;
}

interface GA4Event {
    name: string;
    params?: GA4EventParams;
}

interface GA4Payload {
    client_id: string;
    events: GA4Event[];
}

/**
 * GA4 서버 사이드 이벤트 전송 모듈
 */
export const ga4 = {
    /**
     * GA4가 활성화되어 있는지 확인
     */
    isEnabled(): boolean {
        return Boolean(env.ga4.measurementId && env.ga4.apiSecret);
    },

    /**
     * GA4 이벤트 전송
     * @param clientId 클라이언트 식별자 (accountId 사용)
     * @param eventName 이벤트 이름
     * @param params 이벤트 파라미터
     */
    async sendEvent(clientId: string, eventName: string, params: GA4EventParams = {}): Promise<void> {
        if (!this.isEnabled()) {
            logger.log(`GA4 disabled, skipping event: ${eventName}`);
            return;
        }

        const payload: GA4Payload = {
            client_id: clientId,
            events: [
                {
                    name: eventName,
                    params,
                },
            ],
        };

        try {
            const url = `${GA4_ENDPOINT}?measurement_id=${env.ga4.measurementId}&api_secret=${env.ga4.apiSecret}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                logger.err(`GA4 event failed: ${eventName}, status: ${response.status}`);
            } else {
                logger.log(`GA4 event sent: ${eventName}`);
            }
        } catch (error) {
            logger.err(`GA4 event error: ${eventName}, error: ${error}`);
        }
    },

    /**
     * 학생 졸업 처리 이벤트
     * @param accountId 계정 ID (client_id로 사용)
     * @param studentCount 졸업 처리된 학생 수
     */
    async trackStudentGraduated(accountId: string, studentCount: number): Promise<void> {
        await this.sendEvent(accountId, 'student_graduated', {
            student_count: studentCount,
        });
    },
};
