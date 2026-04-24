/**
 * 통합 테스트 DB lifecycle 헬퍼
 *
 * 실제 MySQL에 시드 데이터 삽입 및 테이블 초기화
 */
import { CURRENT_PRIVACY_VERSION } from '@school/shared';
import { getNowKST } from '@school/utils';
import bcrypt from 'bcrypt';
import { database } from '~/infrastructure/database/database.js';

// 테스트용 비밀번호 (bcrypt hash는 비용이 높으므로 한 번만 생성)
export const TEST_PASSWORD = '5678';
export const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

/**
 * 모든 테이블 데이터 삭제 (자식 → 부모 순서로 FK 안전)
 *
 * Prisma deleteMany 사용: 커넥션 풀 세션 변수 이슈 없이 안전하게 삭제.
 */
export const truncateAll = async () => {
    await database.attendance.deleteMany();
    await database.studentSnapshot.deleteMany();
    await database.groupSnapshot.deleteMany();
    await database.accountSnapshot.deleteMany();
    await database.registration.deleteMany();
    await database.studentGroup.deleteMany();
    await database.churnAlertLog.deleteMany();
    await database.joinRequest.deleteMany();
    await database.refreshToken.deleteMany();
    await database.student.deleteMany();
    await database.group.deleteMany();
    await database.account.deleteMany();
    await database.organization.deleteMany();
    await database.church.deleteMany();
    await database.parish.deleteMany();
};

/**
 * 기본 시드 데이터 삽입 (Parish → Church → Organization → Account)
 *
 * 대부분의 테스트에서 필요한 기본 계층 구조를 생성합니다.
 * 반환되는 ID를 tRPC caller 생성에 사용합니다.
 */
export const seedBase = async () => {
    const now = getNowKST();

    const parish = await database.parish.create({
        data: { name: '서울대교구', createdAt: now },
    });

    const church = await database.church.create({
        data: { name: '장위동성당', parishId: parish.id, createdAt: now },
    });

    const org = await database.organization.create({
        data: { name: '장위동 중고등부', type: 'MIDDLE_HIGH', churchId: church.id, createdAt: now },
    });

    const account = await database.account.create({
        data: {
            name: '중고등부',
            displayName: '중고등부',
            password: TEST_PASSWORD_HASH,
            organizationId: org.id,
            role: 'ADMIN',
            createdAt: now,
            privacyAgreedAt: now,
            privacyPolicyVersion: CURRENT_PRIVACY_VERSION,
        },
    });

    return {
        parish,
        church,
        org,
        account,
        // tRPC caller에 전달할 문자열 ID
        ids: {
            parishId: String(parish.id),
            churchId: String(church.id),
            orgId: String(org.id),
            accountId: String(account.id),
        },
    };
};

export type SeedBase = Awaited<ReturnType<typeof seedBase>>;

/**
 * DB 연결 해제
 */
export const disconnectDb = async () => {
    await database.$disconnect();
};
