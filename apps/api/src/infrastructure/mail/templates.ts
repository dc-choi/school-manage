/**
 * Mail Templates
 *
 * 메일 템플릿 정의
 */
import { formatSocialProof } from '@school/shared';
import type { OrgAccountRow, OrgActivityRow, OrgSocialProof } from '~/domains/report/report.types.js';

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
 * 조직 현황 일일 보고서 메일 템플릿
 */
export const orgDailyReportTemplate = (
    activityRows: OrgActivityRow[],
    accountRows: OrgAccountRow[],
    socialProof: OrgSocialProof,
    dateStr: string
) => {
    const subject = `[출석부] 조직 현황 일일 보고서 (${dateStr})`;

    const formatDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '-');

    // 섹션 0: 사회적 증거
    const socialProofLine = formatSocialProof(socialProof);

    // 섹션 1: 조직 활성화 현황
    const activityLines = activityRows.map(
        (r, i) =>
            `${i + 1}. ${r.churchName} - ${r.organizationName} (${r.organizationType}) | 그룹 ${r.groupCount}개 | 학생 ${r.studentCount}명 | 출석 ${r.attendanceCount}건 | 최근출석: ${formatDate(r.recentAttendanceAt)}`
    );

    // 섹션 2: 조직별 계정 현황
    const accountLines = accountRows.map(
        (r, i) =>
            `${i + 1}. ${r.churchName ?? '(미소속)'} - ${r.organizationName ?? '(미소속)'} (${r.organizationType ?? '-'}) | 계정 ${r.totalAccounts}명 | ${r.accountNames ?? '-'}`
    );

    const text = `${socialProofLine}

---

[조직 활성화 현황] (${dateStr} 기준, ${activityRows.length}곳)

${activityLines.join('\n')}

---

[조직별 계정 현황] (${accountRows.length}곳)

${accountLines.join('\n')}

---
출석부 프로그램`;

    return { subject, text };
};
