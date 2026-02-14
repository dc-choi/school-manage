/**
 * Mail Templates
 *
 * 메일 템플릿 정의
 */

interface SignupNotificationData {
    displayName: string;
}

/**
 * 임시 비밀번호 안내 메일 템플릿
 */
export const temporaryPasswordTemplate = (tempPassword: string) => {
    const subject = '[출석부] 임시 비밀번호 안내';

    const text = `임시 비밀번호가 발급되었습니다.

임시 비밀번호: ${tempPassword}

로그인 후 반드시 비밀번호를 변경해 주세요.

---
출석부 프로그램`;

    return { subject, text };
};

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
