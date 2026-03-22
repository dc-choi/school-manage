/**
 * Mail Service
 *
 * Nodemailer + Google SMTP를 사용한 메일 발송 서비스
 */
import {
    churnAlertTemplate,
    orgDailyReportTemplate,
    signupNotificationTemplate,
    temporaryPasswordTemplate,
} from './templates.ts';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { ChurnAlert } from '~/domains/churn/churn.types.js';
import type { OrgAccountRow, OrgActivityRow } from '~/domains/report/report.types.js';
import { env } from '~/global/config/env.js';
import { logger } from '~/infrastructure/logger/logger.js';

const GOOGLE_SMTP_HOST = 'smtp.gmail.com';
const GOOGLE_SMTP_PORT = 587;

/**
 * 메일 서비스
 */
class MailService {
    private transporter: Transporter | null = null;

    /**
     * 메일 발송이 활성화되어 있는지 확인
     */
    isEnabled(): boolean {
        return Boolean(env.smtp.user && env.smtp.pass && env.smtp.adminEmail);
    }

    /**
     * Nodemailer transporter (lazy singleton)
     */
    private getTransporter(): Transporter {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: GOOGLE_SMTP_HOST,
                port: GOOGLE_SMTP_PORT,
                secure: false, // TLS 사용
                auth: {
                    user: env.smtp.user,
                    pass: env.smtp.pass,
                },
            });
        }
        return this.transporter;
    }

    /**
     * 회원가입 알림 메일 발송
     * @param account 가입한 계정 정보
     */
    async sendSignupNotification(account: { displayName: string }): Promise<void> {
        if (!this.isEnabled()) {
            logger.log('Mail disabled, skipping signup notification');
            return;
        }

        const { subject, text } = signupNotificationTemplate(account);

        try {
            await this.getTransporter().sendMail({
                from: env.smtp.user,
                to: env.smtp.adminEmail,
                subject,
                text,
            });

            logger.log(`Signup notification sent: ${account.displayName}`);
        } catch (error) {
            logger.err(`Signup notification failed: ${account.displayName}, error: ${error}`);
        }
    }

    /**
     * 이탈 감지 알림 메일 발송
     * @param alerts 이탈 위험 단체 목록
     * @param dateStr 감지 날짜 (YYYY-MM-DD)
     */
    async sendChurnAlert(alerts: ChurnAlert[], dateStr: string): Promise<void> {
        if (!this.isEnabled()) {
            logger.log('Mail disabled, skipping churn alert');
            return;
        }

        const { subject, text } = churnAlertTemplate(alerts, dateStr);

        try {
            await this.getTransporter().sendMail({
                from: env.smtp.user,
                to: env.smtp.adminEmail,
                subject,
                text,
            });

            logger.log(`Churn alert sent: ${alerts.length} organizations`);
        } catch (error) {
            logger.err(`Churn alert failed: ${error}`);
        }
    }

    /**
     * 조직 현황 일일 보고서 메일 발송
     */
    async sendOrgDailyReport(
        activityRows: OrgActivityRow[],
        accountRows: OrgAccountRow[],
        dateStr: string
    ): Promise<void> {
        if (!this.isEnabled()) {
            logger.log('Mail disabled, skipping org daily report');
            return;
        }

        const { subject, text } = orgDailyReportTemplate(activityRows, accountRows, dateStr);

        try {
            await this.getTransporter().sendMail({
                from: env.smtp.user,
                to: env.smtp.adminEmail,
                subject,
                text,
            });

            logger.log(`Org daily report sent: ${activityRows.length} orgs, ${accountRows.length} accounts`);
        } catch (error) {
            logger.err(`Org daily report failed: ${error}`);
        }
    }

    /**
     * 임시 비밀번호 메일 발송 (동기)
     * @param to 수신자 이메일
     * @param tempPassword 임시 비밀번호
     * @returns 발송 성공 여부
     */
    async sendTemporaryPassword(to: string, tempPassword: string): Promise<boolean> {
        if (!this.isEnabled()) {
            logger.log('Mail disabled, skipping temporary password');
            return false;
        }

        const { subject, text } = temporaryPasswordTemplate(tempPassword);

        try {
            await this.getTransporter().sendMail({
                from: env.smtp.user,
                to,
                subject,
                text,
            });

            logger.log(`Temporary password sent to: ${to}`);
            return true;
        } catch (error) {
            logger.err(`Temporary password send failed: ${to}, error: ${error}`);
            return false;
        }
    }
}

export const mailService = new MailService();
