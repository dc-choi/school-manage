/**
 * Mail Service
 *
 * Nodemailer + Google SMTP를 사용한 메일 발송 서비스
 */
import { orgDailyReportTemplate, signupNotificationTemplate, temporaryPasswordTemplate } from './templates.ts';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { OrgAccountRow, OrgActivityRow, OrgSocialProof } from '~/domains/report/report.types.js';
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
     * 조직 현황 일일 보고서 메일 발송
     */
    async sendOrgDailyReport(
        activityRows: OrgActivityRow[],
        accountRows: OrgAccountRow[],
        socialProof: OrgSocialProof,
        dateStr: string
    ): Promise<void> {
        if (!this.isEnabled()) {
            logger.log('Mail disabled, skipping org daily report');
            return;
        }

        const { subject, text } = orgDailyReportTemplate(activityRows, accountRows, socialProof, dateStr);

        try {
            await this.getTransporter().sendMail({
                from: env.smtp.user,
                to: env.smtp.adminEmail,
                subject,
                text,
            });

            logger.log(
                `Org daily report sent: ${activityRows.length} orgs, ${accountRows.length} accounts, ` +
                    `social ${socialProof.churchCount} churches/${socialProof.accountCount} accounts/${socialProof.studentCount} students`
            );
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
