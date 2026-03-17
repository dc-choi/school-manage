/**
 * Mail Templates
 *
 * 메일 템플릿 정의
 */
import type { ChurnAlert } from '~/domains/churn/churn.types.js';
import type { OrgAccountRow, OrgActivityRow } from '~/domains/report/report.types.js';

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

/**
 * 조직 현황 일일 보고서 메일 템플릿
 */
export const orgDailyReportTemplate = (
    activityRows: OrgActivityRow[],
    accountRows: OrgAccountRow[],
    dateStr: string
) => {
    const subject = `[출석부] 조직 현황 일일 보고서 (${dateStr})`;

    const formatDate = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : '-');

    // 섹션 1: 조직 활성화 현황
    const activityLines = activityRows.map(
        (r, i) =>
            `${i + 1}. ${r.church_name} - ${r.organization_name} (${r.organization_type}) | 그룹 ${r.group_count}개 | 학생 ${r.student_count}명 | 출석 ${r.attendance_count}건 | 최근출석: ${formatDate(r.recent_attendance_at)}`
    );

    // 섹션 2: 조직별 계정 현황
    const accountLines = accountRows.map(
        (r, i) =>
            `${i + 1}. ${r.church_name ?? '(미소속)'} - ${r.organization_name ?? '(미소속)'} (${r.organization_type ?? '-'}) | 계정 ${r.total_accounts}명 | ${r.account_names ?? '-'}`
    );

    const text = `[조직 활성화 현황] (${dateStr} 기준, ${activityRows.length}곳)

${activityLines.join('\n')}

---

[조직별 계정 현황] (${accountRows.length}곳)

${accountLines.join('\n')}

---
출석부 프로그램`;

    return { subject, text };
};
