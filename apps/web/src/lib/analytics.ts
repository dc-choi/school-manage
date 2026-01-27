/**
 * GA4 이벤트 전송 유틸리티
 *
 * 사용법:
 * - 회원가입 완료: analytics.trackSignUp()
 * - 로그인 성공: analytics.trackLogin()
 * - 첫 그룹 생성: analytics.trackFirstGroupCreated(daysSinceSignup)
 * - 그룹 생성: analytics.trackGroupCreated()
 * - 그룹 수정: analytics.trackGroupUpdated()
 * - 그룹 삭제: analytics.trackGroupDeleted(count)
 * - 첫 학생 등록: analytics.trackFirstStudentRegistered(daysSinceSignup)
 * - 학생 등록: analytics.trackStudentCreated()
 * - 학생 수정: analytics.trackStudentUpdated()
 * - 학생 삭제: analytics.trackStudentDeleted(count)
 * - 첫 출석 기록: analytics.trackFirstAttendanceRecorded(daysSinceSignup)
 * - 출석 저장 완료: analytics.trackAttendanceRecorded(params)
 * - 대시보드 진입: analytics.trackDashboardViewed()
 */

const isGtagAvailable = (): boolean => {
    return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

const safeGtag = (command: 'event', eventName: string, params?: Record<string, unknown>): void => {
    if (!isGtagAvailable()) {
        console.warn('[Analytics] gtag not available, skipping event:', eventName);
        return;
    }

    try {
        window.gtag!(command, eventName, params);
    } catch (error) {
        console.error('[Analytics] Failed to send event:', eventName, error);
    }
};

export const analytics = {
    /**
     * 회원가입 완료 이벤트
     * 트리거: 회원가입 API 성공 응답 수신 후
     */
    trackSignUp: (): void => {
        safeGtag('event', 'sign_up', { method: 'form' });
    },

    /**
     * 로그인 성공 이벤트
     * 트리거: 로그인 API 성공 응답 수신 후
     */
    trackLogin: (): void => {
        safeGtag('event', 'login', { method: 'form' });
    },

    /**
     * 첫 그룹 생성 이벤트
     * 트리거: 그룹 생성 API 성공 + isFirstGroup: true
     * @param daysSinceSignup 가입 후 경과일
     */
    trackFirstGroupCreated: (daysSinceSignup: number): void => {
        safeGtag('event', 'first_group_created', {
            days_since_signup: daysSinceSignup,
        });
    },

    /**
     * 첫 학생 등록 이벤트
     * 트리거: 학생 생성 API 성공 + isFirstStudent: true
     * @param daysSinceSignup 가입 후 경과일
     */
    trackFirstStudentRegistered: (daysSinceSignup: number): void => {
        safeGtag('event', 'first_student_registered', {
            days_since_signup: daysSinceSignup,
        });
    },

    /**
     * 첫 출석 기록 이벤트
     * 트리거: 출석 저장 API 성공 + isFirstAttendance: true
     * @param daysSinceSignup 가입 후 경과일
     */
    trackFirstAttendanceRecorded: (daysSinceSignup: number): void => {
        safeGtag('event', 'first_attendance_recorded', {
            days_since_signup: daysSinceSignup,
        });
    },

    /**
     * 출석 기록 이벤트
     * 트리거: 출석 저장 완료 시 (매 셀 변경이 아닌 저장 완료 시점)
     * @param params 출석 상세 정보
     */
    trackAttendanceRecorded: (params: {
        studentCount: number;
        fullAttendanceCount?: number;
        massOnlyCount?: number;
        catechismOnlyCount?: number;
        absentCount?: number;
        attendanceRate?: number;
    }): void => {
        safeGtag('event', 'attendance_recorded', {
            student_count: params.studentCount,
            full_attendance_count: params.fullAttendanceCount,
            mass_only_count: params.massOnlyCount,
            catechism_only_count: params.catechismOnlyCount,
            absent_count: params.absentCount,
            attendance_rate: params.attendanceRate,
        });
    },

    /**
     * 그룹 생성 이벤트
     * 트리거: 그룹 생성 API 성공
     */
    trackGroupCreated: (): void => {
        safeGtag('event', 'group_created');
    },

    /**
     * 그룹 수정 이벤트
     * 트리거: 그룹 수정 API 성공
     */
    trackGroupUpdated: (): void => {
        safeGtag('event', 'group_updated');
    },

    /**
     * 그룹 삭제 이벤트
     * 트리거: 그룹 삭제 API 성공
     * @param count 삭제된 그룹 수
     */
    trackGroupDeleted: (count: number): void => {
        safeGtag('event', 'group_deleted', { count });
    },

    /**
     * 학생 등록 이벤트
     * 트리거: 학생 생성 API 성공
     */
    trackStudentCreated: (): void => {
        safeGtag('event', 'student_created');
    },

    /**
     * 학생 수정 이벤트
     * 트리거: 학생 수정 API 성공
     */
    trackStudentUpdated: (): void => {
        safeGtag('event', 'student_updated');
    },

    /**
     * 학생 삭제 이벤트
     * 트리거: 학생 삭제 API 성공
     * @param count 삭제된 학생 수
     */
    trackStudentDeleted: (count: number): void => {
        safeGtag('event', 'student_deleted', { count });
    },

    /**
     * 대시보드 진입 이벤트
     * 트리거: 대시보드 페이지 진입 시
     */
    trackDashboardViewed: (): void => {
        safeGtag('event', 'dashboard_viewed');
    },
};
