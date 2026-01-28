/**
 * Mail Templates
 *
 * 메일 템플릿 정의
 */

interface SignupNotificationData {
    displayName: string;
}

/**
 * 회원가입 알림 메일 템플릿
 */
export const signupNotificationTemplate = (data: SignupNotificationData) => {
    const subject = `[출석부] 신규 회원가입: ${data.displayName}`;

    const text = `신규 회원이 가입했습니다.

- 닉네임: ${data.displayName}

---
출석부 프로그램`;

    return { subject, text };
};
