/**
 * GA4 이벤트 전송 유틸리티
 *
 * 사용법:
 * - 회원가입 완료: analytics.trackSignUp()
 * - 로그인 성공: analytics.trackLogin()
 * - 첫 그룹 생성: analytics.trackFirstGroupCreated(daysSinceSignup)
 * - 첫 학생 등록: analytics.trackFirstStudentRegistered(daysSinceSignup)
 * - 첫 출석 기록: analytics.trackFirstAttendanceRecorded(daysSinceSignup)
 * - 출석 저장 완료: analytics.trackAttendanceRecorded(studentCount)
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
     * @param studentCount 출석 체크한 학생 수
     */
    trackAttendanceRecorded: (studentCount: number): void => {
        safeGtag('event', 'attendance_recorded', {
            student_count: studentCount,
        });
    },
};
