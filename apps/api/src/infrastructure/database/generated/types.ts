import type { ColumnType } from 'kysely';

export type Generated<T> =
    T extends ColumnType<infer S, infer I, infer U> ? ColumnType<S, I | undefined, U> : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Account = {
    _id: Generated<number>;
    name: string;
    display_name: string;
    password: string;
    create_at: Timestamp;
    update_at: Timestamp | null;
    delete_at: Timestamp | null;
    privacy_agreed_at: Timestamp | null;
    organization_id: number | null;
    role: string | null;
};
export type AccountSnapshot = {
    _id: Generated<number>;
    account_id: number;
    name: string;
    display_name: string;
    organization_id: number;
    snapshot_at: Timestamp;
};
export type Attendance = {
    _id: Generated<number>;
    date: string | null;
    content: string | null;
    create_at: Timestamp;
    update_at: Timestamp | null;
    delete_at: Timestamp | null;
    student_id: number;
    group_id: number | null;
};
export type Church = {
    _id: Generated<number>;
    name: string;
    parish_id: number;
    create_at: Timestamp;
    delete_at: Timestamp | null;
};
export type ChurnAlertLog = {
    _id: Generated<number>;
    organization_id: number;
    inactive_days: number;
    sent_at: Timestamp;
};
export type Group = {
    _id: Generated<number>;
    name: string;
    type: Generated<string>;
    create_at: Timestamp;
    update_at: Timestamp | null;
    delete_at: Timestamp | null;
    account_id: number;
    organization_id: number | null;
};
export type GroupSnapshot = {
    _id: Generated<number>;
    group_id: number;
    name: string;
    snapshot_at: Timestamp;
};
export type JoinRequest = {
    _id: Generated<number>;
    account_id: number;
    organization_id: number;
    status: string;
    create_at: Timestamp;
    update_at: Timestamp;
};
export type Organization = {
    _id: Generated<number>;
    name: string;
    type: Generated<string>;
    church_id: number;
    create_at: Timestamp;
    delete_at: Timestamp | null;
};
export type Parish = {
    _id: Generated<number>;
    name: string;
    create_at: Timestamp;
    delete_at: Timestamp | null;
};
export type RefreshToken = {
    _id: Generated<number>;
    account_id: number;
    token_hash: string;
    family_id: string;
    expires_at: Timestamp;
    create_at: Timestamp;
};
export type Registration = {
    _id: Generated<number>;
    student_id: number;
    year: number;
    registered_at: Timestamp;
    create_at: Timestamp;
    update_at: Timestamp;
    delete_at: Timestamp | null;
};
export type Student = {
    _id: Generated<number>;
    society_name: string;
    catholic_name: string | null;
    gender: string | null;
    age: number | null;
    contact: number | null;
    description: string | null;
    baptized_at: string | null;
    graduated_at: Timestamp | null;
    create_at: Timestamp;
    update_at: Timestamp | null;
    delete_at: Timestamp | null;
    organization_id: number | null;
};
export type StudentGroup = {
    _id: Generated<number>;
    student_id: number;
    group_id: number;
    create_at: Timestamp;
};
export type StudentSnapshot = {
    _id: Generated<number>;
    student_id: number;
    society_name: string;
    catholic_name: string | null;
    gender: string | null;
    contact: number | null;
    description: string | null;
    baptized_at: string | null;
    group_id: number;
    organization_id: number | null;
    snapshot_at: Timestamp;
};
export type DB = {
    account: Account;
    account_snapshot: AccountSnapshot;
    attendance: Attendance;
    church: Church;
    churn_alert_log: ChurnAlertLog;
    group: Group;
    group_snapshot: GroupSnapshot;
    join_request: JoinRequest;
    organization: Organization;
    parish: Parish;
    refresh_token: RefreshToken;
    registration: Registration;
    student: Student;
    student_group: StudentGroup;
    student_snapshot: StudentSnapshot;
};
