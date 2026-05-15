/**
 * 사용자 노출 공유 카피
 *
 * 클라이언트(랜딩·로그인)와 서버(메일 템플릿)가 동일하게 사용하는 표현을
 * 단일 출처로 관리한다. 카피 변경 시 한 곳만 수정하면 모든 노출이 동기화된다.
 */

export interface SocialProofCounts {
    churchCount: number;
    accountCount: number;
    studentCount: number;
}

export const formatSocialProof = (counts: SocialProofCounts): string => {
    const studentCount = counts.studentCount.toLocaleString('ko-KR');
    return `${counts.churchCount}개 본당에서 ${counts.accountCount}명의 선생님들이 ${studentCount}명의 학생과 함께하고 있어요.`;
};
