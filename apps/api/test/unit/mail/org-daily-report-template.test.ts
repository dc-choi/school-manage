/**
 * 조직 현황 일일 보고서 메일 템플릿 단위 테스트
 */
import { describe, expect, it } from 'vitest';
import { orgDailyReportTemplate } from '~/infrastructure/mail/templates.js';

describe('orgDailyReportTemplate', () => {
    it('본문 첫 줄에 사회적 증거 카운트가 표시된다', () => {
        const { text } = orgDailyReportTemplate(
            [],
            [],
            { churchCount: 7, accountCount: 12, studentCount: 134 },
            '2026-05-07'
        );

        const firstLine = text.split('\n')[0];
        expect(firstLine).toBe('7개 본당에서 12명의 계정이 134명의 학생과 함께하고 있어요.');
    });

    it('카운트가 0이어도 분기 없이 0으로 표시된다', () => {
        const { text } = orgDailyReportTemplate(
            [],
            [],
            { churchCount: 0, accountCount: 0, studentCount: 0 },
            '2026-05-07'
        );

        const firstLine = text.split('\n')[0];
        expect(firstLine).toBe('0개 본당에서 0명의 계정이 0명의 학생과 함께하고 있어요.');
    });

    it('제목은 기존 형식을 유지한다', () => {
        const { subject } = orgDailyReportTemplate(
            [],
            [],
            { churchCount: 1, accountCount: 1, studentCount: 1 },
            '2026-05-07'
        );

        expect(subject).toBe('[출석부] 조직 현황 일일 보고서 (2026-05-07)');
    });
});
