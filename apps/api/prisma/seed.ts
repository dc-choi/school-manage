/**
 * Prisma Seed Script (로컬 개발용)
 *
 * 목적: 로컬 DB drift 방지 + 현실적 초기 개발 데이터 자동 생성
 * 실행: pnpm --filter @school/api db:seed
 * 초기화 + 시드: pnpm --filter @school/api db:reset
 *
 * 프로덕션 실행 가드: NODE_ENV=production 시 즉시 abort.
 * 모든 계정 비밀번호: TEST_PASSWORD ('5678')
 *
 * 데이터 스코프: Parish 2 / Church 4 / Organization 5 / Account 7 / Group 8
 * / Student 20 / Registration 10 / Attendance 20
 */
import { PrismaClient } from '@prisma/client';
import { getNowKST } from '@school/utils';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_PASSWORD = '5678';

async function main() {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('Seed는 프로덕션에서 실행할 수 없습니다. NODE_ENV 확인 필요.');
    }

    const passwordHash = bcrypt.hashSync(TEST_PASSWORD, 10);
    const now = getNowKST();

    console.log('🌱 Seed 시작...');

    // Parish
    const seoul = await prisma.parish.create({ data: { name: '서울대교구', createdAt: now } });
    const suwon = await prisma.parish.create({ data: { name: '수원교구', createdAt: now } });

    // Church
    const jangwi = await prisma.church.create({ data: { name: '장위동성당', parishId: seoul.id, createdAt: now } });
    const heukseok = await prisma.church.create({ data: { name: '흑석동성당', parishId: seoul.id, createdAt: now } });
    const suwonHq = await prisma.church.create({ data: { name: '수원본당', parishId: suwon.id, createdAt: now } });
    const bundang = await prisma.church.create({ data: { name: '분당성당', parishId: suwon.id, createdAt: now } });

    // Organization
    const elementary = await prisma.organization.create({
        data: { name: '장위동 초등부', type: 'ELEMENTARY', churchId: jangwi.id, createdAt: now },
    });
    const middleHigh = await prisma.organization.create({
        data: { name: '장위동 중고등부', type: 'MIDDLE_HIGH', churchId: jangwi.id, createdAt: now },
    });
    const youngAdult = await prisma.organization.create({
        data: { name: '수원본당 청년부', type: 'YOUNG_ADULT', churchId: suwonHq.id, createdAt: now },
    });
    const heukseokOrg = await prisma.organization.create({
        data: { name: '흑석동 초등부', type: 'ELEMENTARY', churchId: heukseok.id, createdAt: now },
    });
    const bundangOrg = await prisma.organization.create({
        data: { name: '분당 중고등부', type: 'MIDDLE_HIGH', churchId: bundang.id, createdAt: now },
    });

    // Account (ADMIN 2 + TEACHER 3 + 미소속 1 + pending 1 = 7)
    const admin = await prisma.account.create({
        data: {
            name: 'admin',
            displayName: '관리자',
            password: passwordHash,
            organizationId: middleHigh.id,
            role: 'ADMIN',
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
    const teacher1 = await prisma.account.create({
        data: {
            name: 'teacher1',
            displayName: '김교사',
            password: passwordHash,
            organizationId: middleHigh.id,
            role: 'TEACHER',
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
    const elementaryAdmin = await prisma.account.create({
        data: {
            name: 'elemadmin',
            displayName: '초등부관리자',
            password: passwordHash,
            organizationId: elementary.id,
            role: 'ADMIN',
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
    const heukseokTeacher = await prisma.account.create({
        data: {
            name: 'heukseok',
            displayName: '흑석선생님',
            password: passwordHash,
            organizationId: heukseokOrg.id,
            role: 'ADMIN',
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
    const bundangTeacher = await prisma.account.create({
        data: {
            name: 'bundang',
            displayName: '분당선생님',
            password: passwordHash,
            organizationId: bundangOrg.id,
            role: 'ADMIN',
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
    const orphan = await prisma.account.create({
        data: {
            name: 'orphan',
            displayName: '미소속',
            password: passwordHash,
            createdAt: now,
            privacyAgreedAt: now,
        },
    });
    const pending = await prisma.account.create({
        data: {
            name: 'pending',
            displayName: '합류대기',
            password: passwordHash,
            createdAt: now,
            privacyAgreedAt: now,
        },
    });

    // JoinRequest (pending 1 + approved 1)
    await prisma.joinRequest.create({
        data: {
            accountId: pending.id,
            organizationId: middleHigh.id,
            status: 'pending',
            createdAt: now,
            updatedAt: now,
        },
    });
    await prisma.joinRequest.create({
        data: {
            accountId: teacher1.id,
            organizationId: middleHigh.id,
            status: 'approved',
            createdAt: now,
            updatedAt: now,
        },
    });

    // Group (GRADE 6 + DEPARTMENT 2)
    const mh1 = await prisma.group.create({ data: { name: '1학년', type: 'GRADE', organizationId: middleHigh.id, createdAt: now } });
    const mh2 = await prisma.group.create({ data: { name: '2학년', type: 'GRADE', organizationId: middleHigh.id, createdAt: now } });
    const mh3 = await prisma.group.create({ data: { name: '3학년', type: 'GRADE', organizationId: middleHigh.id, createdAt: now } });
    const el1 = await prisma.group.create({ data: { name: '1학년', type: 'GRADE', organizationId: elementary.id, createdAt: now } });
    const el2 = await prisma.group.create({ data: { name: '2학년', type: 'GRADE', organizationId: elementary.id, createdAt: now } });
    const el3 = await prisma.group.create({ data: { name: '3학년', type: 'GRADE', organizationId: elementary.id, createdAt: now } });
    const worship = await prisma.group.create({ data: { name: '예절부', type: 'DEPARTMENT', organizationId: middleHigh.id, createdAt: now } });
    const choir = await prisma.group.create({ data: { name: '성가대', type: 'DEPARTMENT', organizationId: middleHigh.id, createdAt: now } });

    // Student (20)
    interface StudentDef {
        societyName: string;
        catholicName: string | null;
        gender: 'M' | 'F';
        age: number;
        orgId: bigint;
        groupIds: bigint[];
    }

    const studentDefs: StudentDef[] = [
        // 장위동 중고등부 10
        { societyName: '김민준', catholicName: '베드로', gender: 'M', age: 14, orgId: middleHigh.id, groupIds: [mh1.id] },
        { societyName: '이서연', catholicName: '마리아', gender: 'F', age: 14, orgId: middleHigh.id, groupIds: [mh1.id, worship.id] },
        { societyName: '박지호', catholicName: '요한', gender: 'M', age: 14, orgId: middleHigh.id, groupIds: [mh1.id] },
        { societyName: '최수빈', catholicName: '안나', gender: 'F', age: 15, orgId: middleHigh.id, groupIds: [mh2.id, choir.id] },
        { societyName: '정윤호', catholicName: null, gender: 'M', age: 15, orgId: middleHigh.id, groupIds: [mh2.id] },
        { societyName: '강다영', catholicName: '루치아', gender: 'F', age: 15, orgId: middleHigh.id, groupIds: [mh2.id] },
        { societyName: '조현우', catholicName: '바오로', gender: 'M', age: 16, orgId: middleHigh.id, groupIds: [mh3.id] },
        { societyName: '윤지우', catholicName: '데레사', gender: 'F', age: 16, orgId: middleHigh.id, groupIds: [mh3.id, worship.id] },
        { societyName: '한예준', catholicName: '요셉', gender: 'M', age: 16, orgId: middleHigh.id, groupIds: [mh3.id] },
        { societyName: '오시은', catholicName: '마르타', gender: 'F', age: 16, orgId: middleHigh.id, groupIds: [mh3.id, choir.id] },
        // 장위동 초등부 7
        { societyName: '김하늘', catholicName: '토마스', gender: 'M', age: 8, orgId: elementary.id, groupIds: [el1.id] },
        { societyName: '박서하', catholicName: '아녜스', gender: 'F', age: 8, orgId: elementary.id, groupIds: [el1.id] },
        { societyName: '이도윤', catholicName: '미카엘', gender: 'M', age: 9, orgId: elementary.id, groupIds: [el2.id] },
        { societyName: '정아린', catholicName: '클라라', gender: 'F', age: 9, orgId: elementary.id, groupIds: [el2.id] },
        { societyName: '최건우', catholicName: '프란치스코', gender: 'M', age: 10, orgId: elementary.id, groupIds: [el3.id] },
        { societyName: '강시온', catholicName: '엘리사벳', gender: 'F', age: 10, orgId: elementary.id, groupIds: [el3.id] },
        { societyName: '윤지안', catholicName: null, gender: 'M', age: 10, orgId: elementary.id, groupIds: [el3.id] },
        // 흑석동 초등부 2 (그룹 없음 — 다양성)
        { societyName: '조하린', catholicName: '세실리아', gender: 'F', age: 8, orgId: heukseokOrg.id, groupIds: [] },
        { societyName: '김은호', catholicName: '스테파노', gender: 'M', age: 9, orgId: heukseokOrg.id, groupIds: [] },
        // 분당 중고등부 1
        { societyName: '이지유', catholicName: '엘레나', gender: 'F', age: 14, orgId: bundangOrg.id, groupIds: [] },
    ];

    const studentIds: bigint[] = [];
    for (const s of studentDefs) {
        const created = await prisma.student.create({
            data: {
                societyName: s.societyName,
                catholicName: s.catholicName,
                gender: s.gender,
                age: BigInt(s.age),
                organizationId: s.orgId,
                createdAt: now,
            },
        });
        studentIds.push(created.id);
        for (const gId of s.groupIds) {
            await prisma.studentGroup.create({
                data: { studentId: created.id, groupId: gId, createdAt: now },
            });
        }
    }

    // Registration — 현재 연도 앞 10명
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 10; i++) {
        await prisma.registration.create({
            data: {
                studentId: studentIds[i],
                year: currentYear,
                registeredAt: now,
                createdAt: now,
                updatedAt: now,
            },
        });
    }

    // Attendance — 최근 4주 × 5명 샘플
    const attendanceMarks = ['◎', '○', '△', '-', '◎'];
    for (let i = 0; i < 5; i++) {
        for (let w = 0; w < 4; w++) {
            const dt = new Date(now);
            dt.setDate(dt.getDate() - w * 7);
            const dateStr = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
            await prisma.attendance.create({
                data: {
                    studentId: studentIds[i],
                    date: dateStr,
                    content: attendanceMarks[(i + w) % attendanceMarks.length],
                    groupId: mh1.id,
                    createdAt: now,
                },
            });
        }
    }

    console.log('✅ Seed 완료');
    console.log(`   Parish 2 / Church 4 / Organization 5`);
    console.log(`   Account 7 / JoinRequest 2`);
    console.log(`   Group 8 / Student ${studentDefs.length} / Registration 10 / Attendance 20`);
    console.log(`   계정 이름: admin, teacher1, elemadmin, heukseok, bundang, orphan, pending`);
    console.log(`   비밀번호 (모두): ${TEST_PASSWORD}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed 실패:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
