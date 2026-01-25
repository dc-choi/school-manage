/**
 * Update Attendance UseCase
 *
 * 출석 데이터 업데이트/삭제
 */
import type { AttendanceData, UpdateAttendanceInput, UpdateAttendanceOutput } from '@school/trpc';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { getFullTime } from '~/global/utils/utils.js';
import { database } from '~/infrastructure/database/database.js';

export class UpdateAttendanceUseCase {
    async execute(input: UpdateAttendanceInput): Promise<UpdateAttendanceOutput> {
        if (!input.attendance || input.attendance.length <= 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'BAD_REQUEST: attendance is required',
            });
        }

        try {
            let row: number;

            if (input.isFull) {
                // 출석 입력 (insert or update)
                row = await this.updateAttendance(input.year, input.attendance);
            } else {
                // 출석 삭제 (hard delete)
                row = await this.deleteAttendance(input.year, input.attendance);
            }

            return {
                row,
                isFull: input.isFull,
            };
        } catch (e) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `${e}`,
            });
        }
    }

    /**
     * 출석 데이터 업데이트 (insert or update)
     */
    private async updateAttendance(year: number, attendance: AttendanceData[]): Promise<number> {
        return await database.$transaction(async (tx) => {
            let count = 0;

            for (const item of attendance) {
                const fullTime = await getFullTime(year, item.month, item.day);
                const existing = await tx.attendance.findFirst({
                    where: {
                        studentId: BigInt(item.id),
                        date: fullTime,
                        deletedAt: null,
                    },
                });

                if (existing === null) {
                    // 새로 생성
                    await tx.attendance.create({
                        data: {
                            date: fullTime,
                            content: item.data,
                            studentId: BigInt(item.id),
                            createdAt: getNowKST(),
                        },
                    });
                    count++;
                } else {
                    // 기존 데이터 수정
                    const result = await tx.attendance.updateMany({
                        where: {
                            date: fullTime,
                            studentId: BigInt(item.id),
                            deletedAt: null,
                        },
                        data: {
                            content: item.data,
                            updatedAt: getNowKST(),
                        },
                    });
                    count += result.count;
                }
            }
            return count;
        });
    }

    /**
     * 출석 데이터 삭제 (hard delete)
     */
    private async deleteAttendance(year: number, attendance: AttendanceData[]): Promise<number> {
        return await database.$transaction(async (tx) => {
            let count = 0;

            for (const item of attendance) {
                const fullTime = await getFullTime(year, item.month, item.day);
                const result = await tx.attendance.deleteMany({
                    where: {
                        studentId: BigInt(item.id),
                        date: fullTime,
                    },
                });
                count += result.count;
            }
            return count;
        });
    }
}
