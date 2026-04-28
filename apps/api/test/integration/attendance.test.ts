/**
 * Attendance 통합 테스트 (실제 DB)
 *
 * 실제 DB를 사용하여 출석 프로시저 테스트
 */
import { type SeedBase, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createPublicCaller, createScopedCaller } from '../helpers/trpc-caller.ts';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();
});

afterAll(async () => {
    await truncateAll();
});

describe('attendance 통합 테스트', () => {
    describe('group.attendance (출석 조회)', () => {
        it('그룹별 출석 현황 조회 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });
            await database.attendance.create({
                data: {
                    date: '20240107',
                    content: '◎',
                    studentId: student.id,
                    groupId: group.id,
                    createdAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.group.attendance({ groupId: String(group.id) });

            expect(result).toHaveProperty('students');
            expect(result).toHaveProperty('attendances');
            expect(result).toHaveProperty('year');
            expect(Array.isArray(result.students)).toBe(true);
            expect(result.students.length).toBe(1);
            expect(result.attendances.length).toBeGreaterThanOrEqual(1);
        });

        it('특정 연도 출석 조회 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });
            await database.attendance.create({
                data: {
                    date: '20240107',
                    content: '◎',
                    studentId: student.id,
                    groupId: group.id,
                    createdAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.group.attendance({
                groupId: String(group.id),
                year: 2024,
            });

            expect(result).toHaveProperty('students');
            expect(result).toHaveProperty('year');
            expect(result.year).toBe(2024);
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createPublicCaller();

            await expect(caller.group.attendance({ groupId: String(group.id) })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 그룹 ID 형식 시 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(caller.group.attendance({ groupId: 'invalid-id' })).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });

    describe('attendance.update', () => {
        it('출석 입력 성공 (새 출석 생성)', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.attendance.update({
                year: 2024,
                groupId: String(group.id),
                attendance: [
                    {
                        id: String(student.id),
                        month: 1,
                        day: 7,
                        data: '◎',
                    },
                ],
                isFull: true,
            });

            expect(result).toHaveProperty('row');
            expect(result).toHaveProperty('isFull');
            expect(result.isFull).toBe(true);
            expect(result.row).toBe(1);

            // DB에 실제 생성되었는지 확인
            const dbAttendance = await database.attendance.findFirst({
                where: { studentId: student.id, date: '20240107' },
            });
            expect(dbAttendance).not.toBeNull();
            expect(dbAttendance?.content).toBe('◎');
        });

        it('출석 수정 성공 (기존 출석 업데이트)', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });
            // 기존 출석 데이터 생성
            await database.attendance.create({
                data: {
                    date: '20240107',
                    content: '◎',
                    studentId: student.id,
                    groupId: group.id,
                    createdAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.attendance.update({
                year: 2024,
                groupId: String(group.id),
                attendance: [
                    {
                        id: String(student.id),
                        month: 1,
                        day: 7,
                        data: '○',
                    },
                ],
                isFull: true,
            });

            expect(result).toHaveProperty('row');
            expect(result).toHaveProperty('isFull');

            // DB에서 수정 확인
            const dbAttendance = await database.attendance.findFirst({
                where: { studentId: student.id, date: '20240107' },
            });
            expect(dbAttendance?.content).toBe('○');
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const caller = createPublicCaller();

            await expect(
                caller.attendance.update({
                    year: 2024,
                    groupId: '1',
                    attendance: [
                        {
                            id: '1',
                            month: 1,
                            day: 7,
                            data: '◎',
                        },
                    ],
                    isFull: true,
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('attendance 배열이 500개 초과하면 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            const oversizedAttendance = Array.from({ length: 501 }, (_, i) => ({
                id: String(i + 1),
                month: 1,
                day: 7,
                data: '◎',
            }));

            await expect(
                caller.attendance.update({
                    year: 2024,
                    groupId: '1',
                    attendance: oversizedAttendance,
                    isFull: true,
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('attendance 배열이 비어있으면 BAD_REQUEST 에러', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.attendance.update({
                    year: 2024,
                    groupId: '1',
                    attendance: [],
                    isFull: true,
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });

        it('TC-A-N1: data = "-" (결석 명시) 정상 저장', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.attendance.update({
                year: 2024,
                groupId: String(group.id),
                attendance: [{ id: String(student.id), month: 1, day: 7, data: '-' }],
                isFull: true,
            });

            expect(result.row).toBe(1);
            const dbAttendance = await database.attendance.findFirst({
                where: { studentId: student.id, date: '20240107' },
            });
            expect(dbAttendance?.content).toBe('-');
        });

        it('TC-A-E1: data 11자 초과 → BAD_REQUEST', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.attendance.update({
                    year: 2024,
                    groupId: '1',
                    attendance: [{ id: '1', month: 1, day: 7, data: '◎'.repeat(11) }],
                    isFull: true,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-A-E2: data 허용 외 문자 "X" → BAD_REQUEST', async () => {
            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.attendance.update({
                    year: 2024,
                    groupId: '1',
                    attendance: [{ id: '1', month: 1, day: 7, data: 'X' }],
                    isFull: true,
                })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('TC-5: 학생 그룹 이동 후 과거 출석 수정 시 groupId historical 유지', async () => {
            const now = getNowKST();
            const group1 = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const group2 = await database.group.create({
                data: { name: '2학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group1.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            // 1학년 시점에 출석 입력
            await caller.attendance.update({
                year: 2024,
                groupId: String(group1.id),
                attendance: [{ id: String(student.id), month: 1, day: 7, data: '◎' }],
                isFull: true,
            });

            // 학생이 2학년으로 이동
            await database.studentGroup.deleteMany({
                where: { studentId: student.id, groupId: group1.id },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group2.id, createdAt: now },
            });

            // 2학년 그룹 컨텍스트로 동일 셀(1/7) 수정
            await caller.attendance.update({
                year: 2024,
                groupId: String(group2.id),
                attendance: [{ id: String(student.id), month: 1, day: 7, data: '○' }],
                isFull: true,
            });

            const dbAttendance = await database.attendance.findFirst({
                where: { studentId: student.id, date: '20240107' },
            });
            expect(dbAttendance?.content).toBe('○');
            expect(dbAttendance?.groupId).toBe(group1.id); // historical groupId 유지
        });

        it('TC-E1: 동일 (student_id, date) 동시 입력 시 row 1건으로 수렴 (race retry)', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            // 두 caller가 같은 셀에 다른 마크 동시 입력
            const results = await Promise.allSettled([
                caller.attendance.update({
                    year: 2024,
                    groupId: String(group.id),
                    attendance: [{ id: String(student.id), month: 1, day: 7, data: '◎' }],
                    isFull: true,
                }),
                caller.attendance.update({
                    year: 2024,
                    groupId: String(group.id),
                    attendance: [{ id: String(student.id), month: 1, day: 7, data: '○' }],
                    isFull: true,
                }),
            ]);

            // 두 호출 모두 성공 (race retry로 수렴)
            expect(results[0].status).toBe('fulfilled');
            expect(results[1].status).toBe('fulfilled');

            // 결과 row 1건 (UNIQUE 보장)
            const rows = await database.attendance.findMany({
                where: { studentId: student.id, date: '20240107' },
            });
            expect(rows.length).toBe(1);
            expect(['◎', '○']).toContain(rows[0]?.content); // 둘 중 하나로 수렴
        });

        it('TC-E3: tx.$kysely INSERT 후 throw 시 트랜잭션 롤백 (atomic 보장)', async () => {
            const now = getNowKST();
            const student = await database.student.create({
                data: { societyName: '롤백', organizationId: seed.org.id, createdAt: now },
            });

            await expect(
                database.$transaction(async (tx) => {
                    await tx.$kysely
                        .insertInto('attendance')
                        .values({
                            date: '99991231',
                            content: '◎',
                            studentId: Number(student.id),
                            groupId: 1,
                            createAt: now,
                        })
                        .execute();
                    throw new Error('intentional rollback');
                })
            ).rejects.toThrow('intentional rollback');

            const rows = await database.attendance.findMany({
                where: { studentId: student.id, date: '99991231' },
            });
            expect(rows.length).toBe(0); // 롤백 시 row 0건 — tx.$kysely가 트랜잭션 공유 증명
        });

        it('TC-E2: 출석 삭제 후 동일 셀 재입력 시 새 INSERT 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            // 1) 입력
            await caller.attendance.update({
                year: 2024,
                groupId: String(group.id),
                attendance: [{ id: String(student.id), month: 1, day: 7, data: '◎' }],
                isFull: true,
            });

            // 2) 삭제 (isFull=false → hard delete 분기)
            await caller.attendance.update({
                year: 2024,
                groupId: String(group.id),
                attendance: [{ id: String(student.id), month: 1, day: 7, data: '' }],
                isFull: false,
            });

            // 3) 재입력 (UNIQUE 위반 없이 새 INSERT)
            await caller.attendance.update({
                year: 2024,
                groupId: String(group.id),
                attendance: [{ id: String(student.id), month: 1, day: 7, data: '△' }],
                isFull: true,
            });

            const rows = await database.attendance.findMany({
                where: { studentId: student.id, date: '20240107' },
            });
            expect(rows.length).toBe(1);
            expect(rows[0]?.content).toBe('△');
        });
    });

    describe('attendance.calendar (달력 조회)', () => {
        it('월별 달력 데이터 조회 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });
            await database.attendance.create({
                data: {
                    date: '20240107',
                    content: '◎',
                    studentId: student.id,
                    groupId: group.id,
                    createdAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.attendance.calendar({
                groupId: String(group.id),
                year: 2024,
                month: 1,
            });

            expect(result).toHaveProperty('year', 2024);
            expect(result).toHaveProperty('month', 1);
            expect(result).toHaveProperty('totalStudents', 1);
            expect(result).toHaveProperty('days');
            expect(Array.isArray(result.days)).toBe(true);
            expect(result.days.length).toBe(31); // 1월은 31일
        });

        it('미사/교리 인원 분리 집계 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student1 = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            const student2 = await database.student.create({
                data: { societyName: '학생2', organizationId: seed.org.id, createdAt: now },
            });
            const student3 = await database.student.create({
                data: { societyName: '학생3', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: student1.id, groupId: group.id, createdAt: now },
                    { studentId: student2.id, groupId: group.id, createdAt: now },
                    { studentId: student3.id, groupId: group.id, createdAt: now },
                ],
            });

            // ◎(미사+교리), ○(미사만), △(교리만)
            await database.attendance.createMany({
                data: [
                    { date: '20240107', content: '◎', studentId: student1.id, groupId: group.id, createdAt: now },
                    { date: '20240107', content: '○', studentId: student2.id, groupId: group.id, createdAt: now },
                    { date: '20240107', content: '△', studentId: student3.id, groupId: group.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.attendance.calendar({
                groupId: String(group.id),
                year: 2024,
                month: 1,
            });

            // 1월 7일 데이터 확인
            const jan7 = result.days.find((d) => d.date === '2024-01-07');
            expect(jan7).toBeDefined();
            expect(jan7!.attendance.present).toBe(3); // 전체 출석: 3명
            expect(jan7!.attendance.massPresent).toBe(2); // 미사: ◎+○ = 2명
            expect(jan7!.attendance.catechismPresent).toBe(2); // 교리: ◎+△ = 2명
            expect(jan7!.attendance.total).toBe(3);
        });

        it('출석 없는 날짜는 모든 카운트가 0', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const s1 = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '학생2', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: s1.id, groupId: group.id, createdAt: now },
                    { studentId: s2.id, groupId: group.id, createdAt: now },
                ],
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.attendance.calendar({
                groupId: String(group.id),
                year: 2024,
                month: 1,
            });

            // 모든 날짜에서 출석이 0이어야 함
            for (const day of result.days) {
                expect(day.attendance.present).toBe(0);
                expect(day.attendance.massPresent).toBe(0);
                expect(day.attendance.catechismPresent).toBe(0);
                expect(day.attendance.total).toBe(2);
            }
        });

        it('권한 없는 그룹 조회 시 FORBIDDEN 에러', async () => {
            const now = getNowKST();
            // 다른 조직의 그룹 생성
            const otherOrg = await database.organization.create({
                data: { name: '다른조직', type: 'MIDDLE_HIGH', churchId: seed.church.id, createdAt: now },
            });
            const otherGroup = await database.group.create({
                data: { name: '다른그룹', organizationId: otherOrg.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.attendance.calendar({
                    groupId: String(otherGroup.id),
                    year: 2024,
                    month: 1,
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createPublicCaller();

            await expect(
                caller.attendance.calendar({
                    groupId: String(group.id),
                    year: 2024,
                    month: 1,
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('attendance.dayDetail (날짜별 상세 조회)', () => {
        it('특정 날짜 출석 상세 조회 성공', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student1 = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            const student2 = await database.student.create({
                data: { societyName: '김철수', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.createMany({
                data: [
                    { studentId: student1.id, groupId: group.id, createdAt: now },
                    { studentId: student2.id, groupId: group.id, createdAt: now },
                ],
            });
            await database.attendance.create({
                data: {
                    date: '20240107',
                    content: '◎',
                    studentId: student1.id,
                    groupId: group.id,
                    createdAt: now,
                },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.attendance.dayDetail({
                groupId: String(group.id),
                date: '2024-01-07',
            });

            expect(result).toHaveProperty('date', '2024-01-07');
            expect(result).toHaveProperty('holyday');
            expect(result).toHaveProperty('students');
            expect(Array.isArray(result.students)).toBe(true);
            expect(result.students.length).toBe(2);

            // 첫 번째 학생은 출석 ◎
            const student1Result = result.students.find((s) => s.id === String(student1.id));
            expect(student1Result?.content).toBe('◎');

            // 두 번째 학생은 출석 데이터 없음
            const student2Result = result.students.find((s) => s.id === String(student2.id));
            expect(student2Result?.content).toBe('');
        });

        it('의무축일 정보 포함 확인 (1월 1일 - 천주의 성모 마리아 대축일)', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });
            const student = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: student.id, groupId: group.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);
            const result = await caller.attendance.dayDetail({
                groupId: String(group.id),
                date: '2024-01-01',
            });

            expect(result.holyday).toBe('천주의 성모 마리아 대축일');
        });

        it('권한 없는 그룹 조회 시 FORBIDDEN 에러', async () => {
            const now = getNowKST();
            // 다른 조직의 그룹 생성
            const otherOrg = await database.organization.create({
                data: { name: '다른조직', type: 'MIDDLE_HIGH', churchId: seed.church.id, createdAt: now },
            });
            const otherGroup = await database.group.create({
                data: { name: '다른그룹', organizationId: otherOrg.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.attendance.dayDetail({
                    groupId: String(otherGroup.id),
                    date: '2024-01-07',
                })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('미인증 시 UNAUTHORIZED 에러', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createPublicCaller();

            await expect(
                caller.attendance.dayDetail({
                    groupId: String(group.id),
                    date: '2024-01-07',
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('잘못된 날짜 형식 시 BAD_REQUEST 에러', async () => {
            const now = getNowKST();
            const group = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });

            const caller = createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

            await expect(
                caller.attendance.dayDetail({
                    groupId: String(group.id),
                    date: '2024-1-7', // 잘못된 형식
                })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
            });
        });
    });
});
