/**
 * Mail Service
 *
 * Nodemailer + Google SMTP를 사용한 메일 발송 서비스
 */
import { signupNotificationTemplate } from './templates.js';
import nodemailer from 'nodemailer';
import { env } from '~/global/config/env.js';
import { logger } from '~/infrastructure/logger/logger.js';

const GOOGLE_SMTP_HOST = 'smtp.gmail.com';
const GOOGLE_SMTP_PORT = 587;

/**
 * 메일 서비스
 */
export const mailService = {
    /**
     * 메일 발송이 활성화되어 있는지 확인
     */
    isEnabled(): boolean {
        return Boolean(env.smtp.user && env.smtp.pass && env.smtp.adminEmail);
    },

    /**
     * Nodemailer transporter 생성
     */
    createTransporter() {
        return nodemailer.createTransport({
            host: GOOGLE_SMTP_HOST,
            port: GOOGLE_SMTP_PORT,
            secure: false, // TLS 사용
            auth: {
                user: env.smtp.user,
                pass: env.smtp.pass,
            },
        });
    },

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
            const transporter = this.createTransporter();

            await transporter.sendMail({
                from: env.smtp.user,
                to: env.smtp.adminEmail,
                subject,
                text,
            });

            logger.log(`Signup notification sent: ${account.displayName}`);
        } catch (error) {
            logger.err(`Signup notification failed: ${account.displayName}, error: ${error}`);
        }
    },
};
