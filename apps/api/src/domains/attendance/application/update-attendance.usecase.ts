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
    async execute(input: UpdateAttendanceInput, accountId: string): Promise<UpdateAttendanceOutput> {
        if (!input.attendance || input.attendance.length <= 0) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: '출석 데이터가 필요합니다.',
            });
        }

        try {
            // 측정 인프라: 계정의 첫 출석인지 확인 (업데이트 전)
            const existingAttendanceCount = await database.attendance.count({
                where: {
                    student: {
                        group: {
                            accountId: BigInt(accountId),
                        },
                        deletedAt: null,
                    },
                    deletedAt: null,
                },
            });
            const isFirstAttendance = existingAttendanceCount === 0;

            // 측정 인프라: 가입 후 경과일 계산
            let daysSinceSignup: number | undefined;
            if (isFirstAttendance) {
                const account = await database.account.findUnique({
                    where: { id: BigInt(accountId) },
                    select: { createdAt: true },
                });
                if (account?.createdAt) {
                    const now = getNowKST();
                    const diffMs = now.getTime() - account.createdAt.getTime();
                    daysSinceSignup = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }
            }

            let row: number;

            if (input.isFull) {
                // 출석 입력 (insert or update)
                row = await this.updateAttendance(input.year, input.attendance);
            } else {
                // 출석 삭제 (hard delete)
                row = await this.deleteAttendance(input.year, input.attendance);
            }

            // 측정 인프라: 저장된 학생 수 (고유 학생 ID 수)
            const uniqueStudentIds = new Set(input.attendance.map((a) => a.id));
            const studentCount = uniqueStudentIds.size;

            // 측정 인프라: 출석 상세 정보 계산
            let fullAttendanceCount = 0; // ◎ (미사+교리)
            let massOnlyCount = 0; // ○ (미사만)
            let catechismOnlyCount = 0; // △ (교리만)
            let absentCount = 0; // - 또는 빈값

            for (const item of input.attendance) {
                switch (item.data) {
                    case '◎':
                        fullAttendanceCount++;
                        break;
                    case '○':
                        massOnlyCount++;
                        break;
                    case '△':
                        catechismOnlyCount++;
                        break;
                    case '-':
                    case '':
                    default:
                        absentCount++;
                        break;
                }
            }

            const presentCount = fullAttendanceCount + massOnlyCount + catechismOnlyCount;
            const attendanceRate = studentCount > 0 ? Math.round((presentCount / studentCount) * 100) : 0;

            return {
                row,
                isFull: input.isFull,
                // 측정 인프라용 필드
                isFirstAttendance,
                daysSinceSignup,
                studentCount,
                fullAttendanceCount,
                massOnlyCount,
                catechismOnlyCount,
                absentCount,
                attendanceRate,
            };
        } catch (e) {
            console.error('[UpdateAttendanceUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '출석 저장에 실패했습니다.',
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
