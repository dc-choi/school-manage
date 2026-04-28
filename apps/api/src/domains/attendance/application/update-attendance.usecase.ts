/**
 * Update Attendance UseCase
 *
 * 출석 데이터 업데이트/삭제
 */
import type { AttendanceData, UpdateAttendanceInput, UpdateAttendanceOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { getFullTime } from '~/global/utils/utils.js';
import { database } from '~/infrastructure/database/database.js';

export class UpdateAttendanceUseCase {
    async execute(input: UpdateAttendanceInput, organizationId: string): Promise<UpdateAttendanceOutput> {
        try {
            // 측정 인프라: 조직의 첫 출석인지 확인 (업데이트 전)
            const existingAttendanceCount = await database.attendance.count({
                where: {
                    student: {
                        organizationId: BigInt(organizationId),
                        deletedAt: null,
                    },
                    deletedAt: null,
                },
            });
            const isFirstAttendance = existingAttendanceCount === 0;

            // 측정 인프라: 가입 후 경과일 계산
            let daysSinceSignup: number | undefined;
            if (isFirstAttendance) {
                const org = await database.organization.findUnique({
                    where: { id: BigInt(organizationId) },
                    select: { createdAt: true },
                });
                if (org?.createdAt) {
                    const now = getNowKST();
                    const diffMs = now.getTime() - org.createdAt.getTime();
                    daysSinceSignup = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                }
            }

            // 권한 검증: 모든 학생이 해당 조직 소속인지 확인
            const uniqueStudentIds = [...new Set(input.attendance.map((a) => BigInt(a.id)))];
            const orgStudentCount = await database.student.count({
                where: {
                    id: { in: uniqueStudentIds },
                    organizationId: BigInt(organizationId),
                },
            });
            if (orgStudentCount !== uniqueStudentIds.length) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: '해당 학생에 대한 접근 권한이 없습니다.',
                });
            }

            let row: number;

            if (input.isFull) {
                // 출석 입력 (insert or update)
                row = await this.updateAttendance(input.year, input.groupId, input.attendance);
            } else {
                // 출석 삭제 (hard delete)
                row = await this.deleteAttendance(input.year, input.attendance);
            }

            // 측정 인프라: 저장된 학생 수 (고유 학생 ID 수)
            const studentIdSet = new Set(input.attendance.map((a) => a.id));
            const studentCount = studentIdSet.size;

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
            if (e instanceof TRPCError) throw e;
            console.error('[UpdateAttendanceUseCase]', e);
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '출석 저장에 실패했습니다.',
            });
        }
    }

    /**
     * 출석 데이터 업데이트 (atomic upsert via Kysely + ON DUPLICATE KEY UPDATE)
     *
     * (student_id, date) UNIQUE 제약(20260428)에 conflict 시 단일 atomic SQL로 update.
     * groupId는 onDuplicateKeyUpdate 절에 미포함 → 학생 그룹 이동 후에도 historical groupId 보존.
     * Prisma upsert가 race-safe하지 않은 한계(P2002→P2025)를 Kysely 빌더로 회피.
     */
    private async updateAttendance(year: number, groupId: string, attendance: AttendanceData[]): Promise<number> {
        return await database.$transaction(async (tx) => {
            let count = 0;

            for (const item of attendance) {
                const fullTime = await getFullTime(year, item.month, item.day);
                const now = getNowKST();
                await tx.$kysely
                    .insertInto('attendance')
                    .values({
                        date: fullTime,
                        content: item.data,
                        studentId: Number(item.id),
                        groupId: Number(groupId),
                        createAt: now,
                    })
                    .onDuplicateKeyUpdate({
                        content: item.data,
                        updateAt: now,
                    })
                    .execute();
                count++;
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
