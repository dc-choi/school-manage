import { formatDateISO, getNowKST } from '@school/utils';
import schedule from 'node-schedule';
import { DetectChurnUseCase } from '~/domains/churn/application/detect-churn.usecase.js';
import { database } from '~/infrastructure/database/database.js';
import { logger } from '~/infrastructure/logger/logger.js';
import { mailService } from '~/infrastructure/mail/mail.service.js';

export class Scheduler {
    static async studentAge() {
        // 초(옵션), 분, 시, 일, 월, 요일
        const time = '0 0 1 1 *';
        schedule.scheduleJob(time, async () => {
            try {
                await database.student.updateMany({
                    where: {
                        deletedAt: null,
                    },
                    data: {
                        age: {
                            increment: 1,
                        },
                    },
                });
                logger.log('Scheduler job completed: studentAge');
            } catch (error) {
                logger.error('Scheduler job failed: studentAge', error);
            }
        });
    }

    static async churnDetection() {
        // 매일 09:00 KST
        const time = '0 9 * * *';
        schedule.scheduleJob(time, async () => {
            try {
                if (!mailService.isEnabled()) {
                    logger.log('[Scheduler] churnDetection: mail disabled, skipping');
                    return;
                }

                const usecase = new DetectChurnUseCase();
                const result = await usecase.execute();

                if (result.skipped) {
                    logger.log(`[Scheduler] churnDetection: skipped (${result.skipReason})`);
                    return;
                }

                if (result.alerts.length === 0) {
                    logger.log('[Scheduler] churnDetection: no at-risk organizations');
                    return;
                }

                const now = getNowKST();
                const dateStr = formatDateISO(now);

                await mailService.sendChurnAlert(result.alerts, dateStr);

                // 발송 이력 저장
                for (const alert of result.alerts) {
                    await database.churnAlertLog.create({
                        data: {
                            organizationId: alert.organizationId,
                            inactiveDays: alert.inactiveDays,
                            sentAt: now,
                        },
                    });
                }

                logger.log(`[Scheduler] churnDetection: ${result.alerts.length} alerts sent`);
            } catch (error) {
                logger.error('[Scheduler] churnDetection failed:', error);
            }
        });
    }
}
