/**
 * Update Attendance UseCase
 *
 * 출석 데이터 업데이트/삭제 — content 기반 분기:
 *   ◎/○/△ → atomic upsert (Kysely insertInto.onDuplicateKeyUpdate)
 *   - / '' → hard delete (deleteMany)
 */
import type { AttendanceData, UpdateAttendanceInput, UpdateAttendanceOutput } from '@school/shared';
import { getNowKST } from '@school/utils';
import { TRPCError } from '@trpc/server';
import { getFullTime } from '~/global/utils/utils.js';
import { database } from '~/infrastructure/database/database.js';

const MARK_VALUES = new Set(['◎', '○', '△']);

const isMark = (data: string): boolean => MARK_VALUES.has(data);

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

            // content 기반 분기: 마크는 upsert, 결석/미입력은 delete
            const marks = input.attendance.filter((a) => isMark(a.data));
            const erases = input.attendance.filter((a) => !isMark(a.data));

            const row = await this.applyChanges(input.year, input.groupId, marks, erases);

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
            console.error('[UpdateAttendanceUseCase]', {
                organizationId,
                year: input.year,
                groupId: input.groupId,
                cellCount: input.attendance.length,
                error: e instanceof Error ? { name: e.name, message: e.message } : String(e),
            });
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: '출석 저장에 실패했습니다.',
                cause: e instanceof Error ? e : undefined,
            });
        }
    }

    /**
     * 마크/삭제 항목을 단일 트랜잭션에서 처리.
     *
     * - 마크(◎/○/△): Kysely `insertInto.onDuplicateKeyUpdate` (atomic upsert).
     *   `(student_id, date)` UNIQUE 제약(20260428)에 conflict 시 update.
     *   `groupId`는 onDuplicateKeyUpdate 절에 미포함 → historical groupId 보존.
     * - 삭제(`-` / `''`): `deleteMany WHERE (studentId, date)`. 0행 영향이어도 throw 없음 (Prisma 기본).
     *
     * 반환값 `row`는 처리된 항목 수의 합 (마크 수 + 실제 삭제된 row 수).
     */
    private async applyChanges(
        year: number,
        groupId: string,
        marks: AttendanceData[],
        erases: AttendanceData[]
    ): Promise<number> {
        // studentId 오름차순으로 처리 — 동시 트랜잭션 간 잠금 순서 통일로 데드락 회피
        const sortedMarks = sortByStudentId(marks);
        const sortedErases = sortByStudentId(erases);

        return await database.$transaction(async (tx) => {
            let count = 0;

            for (const item of sortedMarks) {
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

            // 삭제는 (studentId, date) 페어 OR 조건으로 단일 SQL 처리
            if (sortedErases.length > 0) {
                const eraseConditions = await Promise.all(
                    sortedErases.map(async (item) => ({
                        studentId: BigInt(item.id),
                        date: await getFullTime(year, item.month, item.day),
                    }))
                );
                const result = await tx.attendance.deleteMany({
                    where: { OR: eraseConditions },
                });
                count += result.count;
            }

            return count;
        });
    }
}

const sortByStudentId = (items: AttendanceData[]): AttendanceData[] =>
    [...items].sort((a, b) => {
        const ai = BigInt(a.id);
        const bi = BigInt(b.id);
        return ai < bi ? -1 : ai > bi ? 1 : 0;
    });
