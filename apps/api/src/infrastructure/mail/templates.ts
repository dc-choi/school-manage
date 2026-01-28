/**
 * Mail Templates
 *
 * 메일 템플릿 정의
 */

interface SignupNotificationData {
    displayName: string;
    createdAt: Date;
}

/**
 * KST 포맷으로 날짜 변환
 */
const formatKST = (date: Date): string => {
    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
};

/**
 * 회원가입 알림 메일 템플릿
 */
export const signupNotificationTemplate = (data: SignupNotificationData) => {
    const subject = `[출석부] 신규 회원가입: ${data.displayName}`;

    const text = `신규 회원이 가입했습니다.

- 닉네임: ${data.displayName}
- 가입 일시: ${formatKST(data.createdAt)}

---
출석부 프로그램`;

    return { subject, text };
};
