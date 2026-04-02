/**
 * IDOR (Insecure Direct Object Reference) 회귀 테스트 (실제 DB)
 *
 * 조직 A와 조직 B를 생성하고, 조직 B의 caller가
 * 조직 A의 리소스에 접근할 수 없음을 검증한다.
 */
import { type SeedBase, TEST_PASSWORD_HASH, seedBase, truncateAll } from '../helpers/db-lifecycle.ts';
import { createScopedCaller } from '../helpers/trpc-caller.ts';
import { getNowKST } from '@school/utils';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { database } from '~/infrastructure/database/database.js';

let seed: SeedBase;

// 조직 B 관련 데이터
let orgB: { orgId: string; accountId: string; accountName: string; orgName: string };

beforeEach(async () => {
    await truncateAll();
    seed = await seedBase();

    // 조직 B 생성 (같은 교구, 같은 본당, 다른 조직)
    const now = getNowKST();
    const orgBRecord = await database.organization.create({
        data: { name: '개봉동 초등부', type: 'ELEMENTARY', churchId: seed.church.id, createdAt: now },
    });
    const accountBRecord = await database.account.create({
        data: {
            name: '초등부',
            displayName: '초등부',
            password: TEST_PASSWORD_HASH,
            organizationId: orgBRecord.id,
            role: 'ADMIN',
            createdAt: now,
            privacyAgreedAt: now,
        },
    });

    orgB = {
        orgId: String(orgBRecord.id),
        accountId: String(accountBRecord.id),
        accountName: accountBRecord.name,
        orgName: orgBRecord.name,
    };
});

afterAll(async () => {
    await truncateAll();
});

/** 조직 A의 caller */
const createOrgACaller = () => createScopedCaller(seed.ids.accountId, seed.account.name, seed.ids.orgId, seed.org.name);

/** 조직 B의 caller */
const createOrgBCaller = () => createScopedCaller(orgB.accountId, orgB.accountName, orgB.orgId, orgB.orgName);

describe('IDOR 회귀 테스트', () => {
    describe('학생 도메인', () => {
        it('student.get -- 타 조직 학생에 접근 시 NOT_FOUND', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '홍길동', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(callerB.student.get({ id: String(studentA.id) })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            // 조직 A에서는 정상 접근
            const callerA = createOrgACaller();
            const result = await callerA.student.get({ id: String(studentA.id) });
            expect(result).toHaveProperty('id');
        });

        it('student.delete -- 타 조직 학생 삭제 시 NOT_FOUND', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '김철수', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(callerB.student.delete({ id: String(studentA.id) })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('student.update -- 타 조직 학생 수정 시 NOT_FOUND', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '이영희', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.student.update({ id: String(studentA.id), societyName: '변경시도' })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('student.create -- 타 조직 그룹 ID로 생성 시 FORBIDDEN', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '1학년', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.student.create({ societyName: '테스트', groupIds: [String(groupA.id)] })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('student.bulkCreate -- 타 조직 그룹 ID로 일괄 생성 시 FORBIDDEN', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '2학년', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.student.bulkCreate({
                    students: [{ societyName: '테스트', groupIds: [String(groupA.id)] }],
                })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });
        });

        it('student.list -- 타 조직 학생이 목록에 포함되지 않음', async () => {
            const now = getNowKST();
            await database.student.create({
                data: { societyName: '조직A학생', organizationId: seed.org.id, createdAt: now },
            });
            await database.student.create({
                data: { societyName: '조직B학생', organizationId: BigInt(orgB.orgId), createdAt: now },
            });

            const callerB = createOrgBCaller();
            const result = await callerB.student.list({});

            expect(result.students.every((s: { societyName: string }) => s.societyName !== '조직A학생')).toBe(true);
            expect(result.students.some((s: { societyName: string }) => s.societyName === '조직B학생')).toBe(true);
        });

        it('student.bulkDelete -- 타 조직 학생 일괄 삭제 시 영향 없음', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '삭제대상', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await callerB.student.bulkDelete({ ids: [String(studentA.id)] });

            // 조직 A의 학생은 삭제되지 않았어야 함
            const student = await database.student.findFirst({
                where: { id: studentA.id, deletedAt: null },
            });
            expect(student).not.toBeNull();
        });

        it('student.restore -- 타 조직 학생 복원 시 영향 없음', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '복원대상', organizationId: seed.org.id, createdAt: now, deletedAt: now },
            });

            const callerB = createOrgBCaller();
            await callerB.student.restore({ ids: [String(studentA.id)] });

            // 조직 A의 학생은 여전히 삭제 상태여야 함
            const student = await database.student.findFirst({
                where: { id: studentA.id },
            });
            expect(student?.deletedAt).not.toBeNull();
        });

        it('student.feastDayList -- 타 조직 학생이 결과에 포함되지 않음', async () => {
            const now = getNowKST();
            await database.student.create({
                data: {
                    societyName: '축일학생',
                    catholicName: '베드로',
                    organizationId: seed.org.id,
                    createdAt: now,
                },
            });

            const callerB = createOrgBCaller();
            const result = await callerB.student.feastDayList({ month: 1 });

            expect(result.students).toHaveLength(0);
        });

        it('student.graduate -- 타 조직 학생 졸업 시 영향 없음', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '졸업대상', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await callerB.student.graduate({ ids: [String(studentA.id)] });

            // 조직 A의 학생은 졸업 처리되지 않았어야 함
            const student = await database.student.findFirst({
                where: { id: studentA.id },
            });
            expect(student?.graduatedAt).toBeNull();
        });

        it('student.cancelGraduation -- 타 조직 학생 졸업 취소 시 영향 없음', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '졸업취소대상', organizationId: seed.org.id, createdAt: now, graduatedAt: now },
            });

            const callerB = createOrgBCaller();
            await callerB.student.cancelGraduation({ ids: [String(studentA.id)] });

            // 조직 A의 학생은 여전히 졸업 상태여야 함
            const student = await database.student.findFirst({
                where: { id: studentA.id },
            });
            expect(student?.graduatedAt).not.toBeNull();
        });

        it('student.bulkRegister -- 타 조직 학생 등록 시 영향 없음', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '등록대상', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await callerB.student.bulkRegister({ ids: [String(studentA.id)] });

            // 조직 A의 학생에 등록 레코드가 생기지 않았어야 함
            const registrations = await database.registration.findMany({
                where: { studentId: studentA.id },
            });
            expect(registrations).toHaveLength(0);
        });

        it('student.bulkCancelRegistration -- 타 조직 학생 등록 취소 시 영향 없음', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '등록취소대상', organizationId: seed.org.id, createdAt: now },
            });
            await database.registration.create({
                data: {
                    studentId: studentA.id,
                    year: 2026,
                    registeredAt: now,
                    createdAt: now,
                    updatedAt: now,
                },
            });

            const callerB = createOrgBCaller();
            await callerB.student.bulkCancelRegistration({ ids: [String(studentA.id)] });

            // 조직 A의 학생 등록은 취소되지 않았어야 함
            const reg = await database.registration.findFirst({
                where: { studentId: studentA.id, deletedAt: null },
            });
            expect(reg).not.toBeNull();
        });
    });

    describe('그룹 도메인', () => {
        it('group.list -- 타 조직 그룹이 목록에 포함되지 않음', async () => {
            const now = getNowKST();
            await database.group.create({
                data: { name: '조직A그룹', organizationId: seed.org.id, createdAt: now },
            });
            await database.group.create({
                data: { name: '조직B그룹', organizationId: BigInt(orgB.orgId), createdAt: now },
            });

            const callerB = createOrgBCaller();
            const result = await callerB.group.list({});

            expect(result.groups.every((g: { name: string }) => g.name !== '조직A그룹')).toBe(true);
            expect(result.groups.some((g: { name: string }) => g.name === '조직B그룹')).toBe(true);
        });

        it('group.get -- 타 조직 그룹 조회 시 NOT_FOUND', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '조직A전용', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(callerB.group.get({ id: String(groupA.id) })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });

            // 조직 A에서는 정상 접근
            const callerA = createOrgACaller();
            const result = await callerA.group.get({ id: String(groupA.id) });
            expect(result).toHaveProperty('id');
        });

        it('group.update -- 타 조직 그룹 수정 시 FORBIDDEN', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '원래이름', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.group.update({ id: String(groupA.id), name: '변경시도', type: 'GRADE' })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('group.delete -- 타 조직 그룹 삭제 시 에러 발생', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '삭제대상그룹', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(callerB.group.delete({ id: String(groupA.id) })).rejects.toMatchObject({
                code: 'INTERNAL_SERVER_ERROR',
            });

            // 조직 A의 그룹은 삭제되지 않았어야 함
            const group = await database.group.findFirst({
                where: { id: groupA.id, deletedAt: null },
            });
            expect(group).not.toBeNull();
        });

        it('group.bulkDelete -- 타 조직 그룹 일괄 삭제 시 영향 없음', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '일괄삭제대상', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await callerB.group.bulkDelete({ ids: [String(groupA.id)] });

            // 조직 A의 그룹은 삭제되지 않았어야 함
            const group = await database.group.findFirst({
                where: { id: groupA.id, deletedAt: null },
            });
            expect(group).not.toBeNull();
        });

        it('group.addStudent -- 타 조직 그룹에 학생 추가 시 NOT_FOUND', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '조직A그룹', organizationId: seed.org.id, createdAt: now },
            });
            const studentB = await database.student.create({
                data: { societyName: '조직B학생', organizationId: BigInt(orgB.orgId), createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.group.addStudent({ groupId: String(groupA.id), studentId: String(studentB.id) })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('group.removeStudent -- 타 조직 그룹에서 학생 제거 시 NOT_FOUND', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '조직A그룹', organizationId: seed.org.id, createdAt: now },
            });
            const studentA = await database.student.create({
                data: { societyName: '조직A학생', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: studentA.id, groupId: groupA.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.group.removeStudent({ groupId: String(groupA.id), studentId: String(studentA.id) })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('group.bulkAddStudents -- 타 조직 그룹에 학생 일괄 추가 시 NOT_FOUND', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '조직A그룹', organizationId: seed.org.id, createdAt: now },
            });
            const studentB = await database.student.create({
                data: { societyName: '조직B학생', organizationId: BigInt(orgB.orgId), createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.group.bulkAddStudents({ groupId: String(groupA.id), studentIds: [String(studentB.id)] })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('group.bulkRemoveStudents -- 타 조직 그룹에서 학생 일괄 제거 시 NOT_FOUND', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '조직A그룹', organizationId: seed.org.id, createdAt: now },
            });
            const studentA = await database.student.create({
                data: { societyName: '조직A학생', organizationId: seed.org.id, createdAt: now },
            });
            await database.studentGroup.create({
                data: { studentId: studentA.id, groupId: groupA.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.group.bulkRemoveStudents({ groupId: String(groupA.id), studentIds: [String(studentA.id)] })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });
    });

    describe('출석 도메인', () => {
        it('attendance.calendar -- 타 조직 그룹으로 출석 조회 시 FORBIDDEN', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '조직A출석그룹', organizationId: seed.org.id, createdAt: now },
            });

            const callerB = createOrgBCaller();
            await expect(
                callerB.attendance.calendar({ groupId: String(groupA.id), year: 2026, month: 1 })
            ).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });
    });

    describe('소유권 검증 유틸리티', () => {
        it('assertGroupIdsOwnership -- 타 조직 그룹 ID 전달 시 FORBIDDEN', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '소유권테스트그룹', organizationId: seed.org.id, createdAt: now },
            });

            const { assertGroupIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertGroupIdsOwnership([String(groupA.id)], orgB.orgId)).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('assertGroupIdsOwnership -- 자기 조직 그룹 ID 전달 시 통과', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '소유권통과그룹', organizationId: seed.org.id, createdAt: now },
            });

            const { assertGroupIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertGroupIdsOwnership([String(groupA.id)], seed.ids.orgId)).resolves.toBeUndefined();
        });

        it('assertGroupIdsOwnership -- 중복 ID 제거 후 검증', async () => {
            const now = getNowKST();
            const groupA = await database.group.create({
                data: { name: '중복테스트그룹', organizationId: seed.org.id, createdAt: now },
            });

            const { assertGroupIdsOwnership } = await import('~/global/utils/ownership.js');
            const gId = String(groupA.id);

            // [gId, gId, gId] -> 중복 제거 -> [gId] -> count 1 = 통과
            await expect(assertGroupIdsOwnership([gId, gId, gId], seed.ids.orgId)).resolves.toBeUndefined();
        });

        it('assertGroupIdsOwnership -- 빈 배열 시 즉시 통과', async () => {
            const { assertGroupIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertGroupIdsOwnership([], seed.ids.orgId)).resolves.toBeUndefined();
        });

        it('assertStudentIdsOwnership -- 타 조직 학생 ID 전달 시 FORBIDDEN', async () => {
            const now = getNowKST();
            const studentA = await database.student.create({
                data: { societyName: '소유권테스트학생', organizationId: seed.org.id, createdAt: now },
            });

            const { assertStudentIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertStudentIdsOwnership([String(studentA.id)], orgB.orgId)).rejects.toMatchObject({
                code: 'FORBIDDEN',
            });
        });

        it('assertStudentIdsOwnership -- 자기 조직 학생 ID 전달 시 통과', async () => {
            const now = getNowKST();
            const s1 = await database.student.create({
                data: { societyName: '학생1', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '학생2', organizationId: seed.org.id, createdAt: now },
            });
            const s3 = await database.student.create({
                data: { societyName: '학생3', organizationId: seed.org.id, createdAt: now },
            });

            const { assertStudentIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(
                assertStudentIdsOwnership([String(s1.id), String(s2.id), String(s3.id)], seed.ids.orgId)
            ).resolves.toBeUndefined();
        });

        it('assertStudentIdsOwnership -- 중복 ID 제거 후 검증', async () => {
            const now = getNowKST();
            const s1 = await database.student.create({
                data: { societyName: '중복학생1', organizationId: seed.org.id, createdAt: now },
            });
            const s2 = await database.student.create({
                data: { societyName: '중복학생2', organizationId: seed.org.id, createdAt: now },
            });

            const { assertStudentIdsOwnership } = await import('~/global/utils/ownership.js');
            const s1Id = String(s1.id);

            // [s1Id, s2Id, s1Id] -> 중복 제거 -> [s1Id, s2Id] -> count 2 = 통과
            await expect(
                assertStudentIdsOwnership([s1Id, String(s2.id), s1Id], seed.ids.orgId)
            ).resolves.toBeUndefined();
        });

        it('assertStudentIdsOwnership -- 빈 배열 시 즉시 통과', async () => {
            const { assertStudentIdsOwnership } = await import('~/global/utils/ownership.js');

            await expect(assertStudentIdsOwnership([], seed.ids.orgId)).resolves.toBeUndefined();
        });
    });
});
