import { formatKSTDateISO } from '@school/utils';
import schedule from 'node-schedule';
import { OrgDailyReportUseCase } from '~/domains/report/application/org-daily-report.usecase.js';
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

    static async orgDailyReport() {
        // 매일 21:00 KST
        const time = '0 21 * * *';
        schedule.scheduleJob(time, async () => {
            try {
                if (!mailService.isEnabled()) {
                    logger.log('[Scheduler] orgDailyReport: mail disabled, skipping');
                    return;
                }

                const usecase = new OrgDailyReportUseCase();
                const result = await usecase.execute();

                const dateStr = formatKSTDateISO();

                await mailService.sendOrgDailyReport(
                    result.activityRows,
                    result.accountRows,
                    result.socialProof,
                    dateStr
                );

                logger.log(
                    `[Scheduler] orgDailyReport: sent (${result.activityRows.length} orgs, ` +
                        `${result.accountRows.length} accounts, social ${result.socialProof.churchCount}/` +
                        `${result.socialProof.accountCount}/${result.socialProof.studentCount})`
                );
            } catch (error) {
                logger.error('[Scheduler] orgDailyReport failed:', error);
            }
        });
    }
}
