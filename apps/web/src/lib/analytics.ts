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
 * - 랜딩 페이지 진입: analytics.trackLandingView()
 * - 랜딩 섹션 조회: analytics.trackLandingSectionView(section)
 * - 랜딩 CTA 클릭: analytics.trackLandingCtaClick(position)
 * - 랜딩 로그인 클릭: analytics.trackLandingLoginClick()
 * - 랜딩 FAQ 클릭: analytics.trackLandingFaqClick(question)
 * - 온보딩 체크리스트 표시: analytics.trackOnboardingChecklistShown(step)
 * - 온보딩 단계 CTA 클릭: analytics.trackOnboardingStepClicked(step)
 * - 온보딩 완료: analytics.trackOnboardingCompleted(daysSinceSignup)
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

    /**
     * 랜딩 페이지 진입 이벤트
     * 트리거: 랜딩 페이지 마운트 시 (useEffect)
     */
    trackLandingView: (): void => {
        safeGtag('event', 'landing_view');
    },

    /**
     * 랜딩 섹션 조회 이벤트
     * 트리거: 각 섹션이 뷰포트에 진입할 때 (1회만)
     * @param section 섹션 이름 (hero, pain-points, features, demo, cta, faq)
     */
    trackLandingSectionView: (section: string): void => {
        safeGtag('event', 'landing_section_view', { section });
    },

    /**
     * 랜딩 CTA 클릭 이벤트
     * 트리거: CTA 버튼 클릭 시
     * @param position 클릭 위치 (hero: 히어로 CTA, bottom: 하단 CTA)
     */
    trackLandingCtaClick: (position: 'hero' | 'bottom'): void => {
        safeGtag('event', 'landing_cta_click', { position });
    },

    /**
     * 랜딩 로그인 클릭 이벤트
     * 트리거: 로그인 링크 클릭 시
     */
    trackLandingLoginClick: (): void => {
        safeGtag('event', 'landing_login_click');
    },

    /**
     * 랜딩 FAQ 클릭 이벤트
     * 트리거: FAQ 아코디언 항목 열기 시
     * @param question 클릭한 질문 텍스트
     */
    trackLandingFaqClick: (question: string): void => {
        safeGtag('event', 'landing_faq_click', { question });
    },

    /**
     * 온보딩 체크리스트 표시 이벤트
     * 트리거: 체크리스트 컴포넌트 마운트 시 (useEffect, 1회)
     * @param step 현재 진행할 단계 번호
     */
    trackOnboardingChecklistShown: (step: number): void => {
        safeGtag('event', 'onboarding_checklist_shown', { step });
    },

    /**
     * 온보딩 단계 CTA 클릭 이벤트
     * 트리거: 단계별 CTA 버튼 클릭 시
     * @param step 클릭한 단계 번호
     */
    trackOnboardingStepClicked: (step: number): void => {
        safeGtag('event', 'onboarding_step_clicked', { step });
    },

    /**
     * 온보딩 완료 이벤트
     * 트리거: 3단계 모두 완료 시 (1회)
     * @param daysSinceSignup 가입 후 경과일
     */
    trackOnboardingCompleted: (daysSinceSignup: number): void => {
        safeGtag('event', 'onboarding_completed', {
            days_since_signup: daysSinceSignup,
        });
    },

    /**
     * 개인정보 동의 UI 노출 이벤트
     * 트리거: 동의 UI 표시 시 (signup 또는 consent 페이지)
     */
    trackPrivacyConsentShown: (source: 'signup' | 'consent'): void => {
        safeGtag('event', 'privacy_consent_shown', { source });
    },

    /**
     * 개인정보 동의 완료 이벤트
     * 트리거: 동의 완료 시 (가입 성공 또는 소급 동의)
     */
    trackPrivacyConsentAgreed: (source: 'signup' | 'consent'): void => {
        safeGtag('event', 'privacy_consent_agreed', { source });
    },

    /**
     * 개인정보 동의 거부 이벤트
     * 트리거: consent 페이지에서 거부 확인 시
     */
    trackPrivacyConsentDeclined: (): void => {
        safeGtag('event', 'privacy_consent_declined');
    },
};
