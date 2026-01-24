import schedule from 'node-schedule';
import { database } from '~/infrastructure/database/database.js';
import { logger } from '~/infrastructure/logger/logger.js';

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
                // 프로세스 유지, 에러만 로깅
            }
        });
    }
}
