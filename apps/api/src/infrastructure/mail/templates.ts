/**
 * Mail Templates
 *
 * 메일 템플릿 정의
 */
import type { ChurnAlert } from '~/domains/churn/churn.types.js';

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

/**
 * 이탈 감지 알림 메일 템플릿
 */
export const churnAlertTemplate = (alerts: ChurnAlert[], dateStr: string) => {
    const subject = `[출석부] 이탈 위험 단체 ${alerts.length}곳 감지 (${dateStr})`;

    const lines = alerts.map(
        (a, i) =>
            `${i + 1}. ${a.churchName} - ${a.organizationName} | 미활동 ${a.inactiveDays}일 | 학생 ${a.studentCount}명 | 마지막 활동: ${a.lastActivityDate}`
    );

    const text = `이탈 위험 단체 목록 (${dateStr} 기준)

${lines.join('\n')}

총 ${alerts.length}곳 감지됨.

---
출석부 프로그램`;

    return { subject, text };
};
