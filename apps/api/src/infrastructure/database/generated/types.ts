import type { ColumnType } from 'kysely';

export type Generated<T> =
    T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Account = {
    id: Generated<number>;
    name: string;
    displayName: string;
    password: string;
    createAt: Timestamp;
    updateAt: Timestamp | null;
    deleteAt: Timestamp | null;
    privacyAgreedAt: Timestamp | null;
    privacyPolicyVersion: Generated<number>;
    organizationId: number | null;
    role: string | null;
};
export type AccountSnapshot = {
    id: Generated<number>;
    accountId: number;
    name: string;
    displayName: string;
    organizationId: number;
    snapshotAt: Timestamp;
};
export type Attendance = {
    id: Generated<number>;
    date: string | null;
    content: string | null;
    createAt: Timestamp;
    updateAt: Timestamp | null;
    deleteAt: Timestamp | null;
    studentId: number;
    groupId: number | null;
};
export type Church = {
    id: Generated<number>;
    name: string;
    parishId: number;
    createAt: Timestamp;
    deleteAt: Timestamp | null;
};
export type ChurnAlertLog = {
    id: Generated<number>;
    organizationId: number;
    inactiveDays: number;
    sentAt: Timestamp;
};
export type Group = {
    id: Generated<number>;
    name: string;
    type: Generated<string>;
    createAt: Timestamp;
    updateAt: Timestamp | null;
    deleteAt: Timestamp | null;
    organizationId: number | null;
};
export type GroupSnapshot = {
    id: Generated<number>;
    groupId: number;
    name: string;
    snapshotAt: Timestamp;
};
export type JoinRequest = {
    id: Generated<number>;
    accountId: number;
    organizationId: number;
    status: string;
    createAt: Timestamp;
    updateAt: Timestamp;
};
export type Organization = {
    id: Generated<number>;
    name: string;
    type: Generated<string>;
    churchId: number;
    createAt: Timestamp;
    deleteAt: Timestamp | null;
};
export type Parish = {
    id: Generated<number>;
    name: string;
    createAt: Timestamp;
    deleteAt: Timestamp | null;
};
export type RefreshToken = {
    id: Generated<number>;
    accountId: number;
    tokenHash: string;
    familyId: string;
    expiresAt: Timestamp;
    createAt: Timestamp;
};
export type Registration = {
    id: Generated<number>;
    studentId: number;
    year: number;
    registeredAt: Timestamp;
    createAt: Timestamp;
    updateAt: Timestamp;
    deleteAt: Timestamp | null;
};
export type Student = {
    id: Generated<number>;
    societyName: string;
    catholicName: string | null;
    gender: string | null;
    age: number | null;
    contact: string | null;
    parentContact: string | null;
    description: string | null;
    baptizedAt: string | null;
    graduatedAt: Timestamp | null;
    createAt: Timestamp;
    updateAt: Timestamp | null;
    deleteAt: Timestamp | null;
    organizationId: number | null;
};
export type StudentGroup = {
    id: Generated<number>;
    studentId: number;
    groupId: number;
    createAt: Timestamp;
};
export type StudentSnapshot = {
    id: Generated<number>;
    studentId: number;
    societyName: string;
    catholicName: string | null;
    gender: string | null;
    contact: string | null;
    parentContact: string | null;
    description: string | null;
    baptizedAt: string | null;
    groupId: number;
    organizationId: number | null;
    snapshotAt: Timestamp;
};
export type DB = {
    account: Account;
    accountSnapshot: AccountSnapshot;
    attendance: Attendance;
    church: Church;
    churnAlertLog: ChurnAlertLog;
    group: Group;
    groupSnapshot: GroupSnapshot;
    joinRequest: JoinRequest;
    organization: Organization;
    parish: Parish;
    refreshToken: RefreshToken;
    registration: Registration;
    student: Student;
    studentGroup: StudentGroup;
    studentSnapshot: StudentSnapshot;
};
