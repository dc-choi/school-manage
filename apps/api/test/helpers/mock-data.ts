/**
 * 테스트용 Mock 데이터 생성 헬퍼
 *
 * 결정적(deterministic) mock 데이터를 생성합니다.
 * vitest의 모듈 mocking과 호환됩니다.
 */
import bcrypt from 'bcrypt';

// 기본 테스트 비밀번호
const TEST_PASSWORD = '5678';
const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

// ID 카운터 (테스트별로 고유한 ID 생성)
let idCounter = 100;
function nextId(): bigint {
    return BigInt(idCounter++);
}

/**
 * Mock Account 생성
 */
export function createMockAccount(overrides: Partial<MockAccount> = {}): MockAccount {
    return {
        id: nextId(),
        name: '테스트계정',
        displayName: '테스트계정',
        password: TEST_PASSWORD_HASH,
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        ...overrides,
    };
}

/**
 * Mock Group 생성
 */
export function createMockGroup(overrides: Partial<MockGroup> = {}): MockGroup {
    return {
        id: nextId(),
        name: '테스트그룹',
        accountId: BigInt(1),
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        ...overrides,
    };
}

/**
 * Mock Student 생성
 */
export function createMockStudent(overrides: Partial<MockStudent> = {}): MockStudent {
    return {
        id: nextId(),
        societyName: '홍길동',
        catholicName: '베드로',
        gender: 'M',
        age: BigInt(15),
        contact: BigInt(1012345678),
        description: '테스트 학생',
        baptizedAt: '2020-01-01',
        groupId: BigInt(1),
        graduatedAt: null,
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        ...overrides,
    };
}

/**
 * Mock Attendance 생성
 */
export function createMockAttendance(overrides: Partial<MockAttendance> = {}): MockAttendance {
    return {
        id: nextId(),
        date: '2024-01-01',
        content: '◎',
        studentId: BigInt(1),
        createdAt: new Date(),
        updatedAt: null,
        deletedAt: null,
        ...overrides,
    };
}

/**
 * 테스트용 기본 계정 (로그인 테스트용)
 */
export function getTestAccount(): MockAccount {
    return createMockAccount({
        id: BigInt(1),
        name: '중고등부',
        displayName: '중고등부',
        password: TEST_PASSWORD_HASH,
    });
}

/**
 * 테스트용 기본 비밀번호
 */
export const testPassword = TEST_PASSWORD;

/**
 * ID 카운터 리셋 (필요 시 사용)
 */
export function resetIdCounter(): void {
    idCounter = 100;
}

// Type definitions
export interface MockAccount {
    id: bigint;
    name: string;
    displayName: string;
    password: string;
    createdAt: Date;
    updatedAt: Date | null;
    deletedAt: Date | null;
}

export interface MockGroup {
    id: bigint;
    name: string;
    accountId: bigint;
    createdAt: Date;
    updatedAt: Date | null;
    deletedAt: Date | null;
}

export interface MockStudent {
    id: bigint;
    societyName: string;
    catholicName: string | null;
    gender: string | null;
    age: bigint | null;
    contact: bigint | null;
    description: string | null;
    baptizedAt: string | null;
    groupId: bigint;
    graduatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date | null;
    deletedAt: Date | null;
}

export interface MockAttendance {
    id: bigint;
    date: string | null;
    content: string | null;
    studentId: bigint;
    createdAt: Date;
    updatedAt: Date | null;
    deletedAt: Date | null;
}
