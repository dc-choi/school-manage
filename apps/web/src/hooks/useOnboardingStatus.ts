import { trpc } from '~/lib/trpc';

/**
 * 온보딩 상태 판단 훅
 * 기존 API(group.list, student.list, statistics.yearly)로 3단계 완료 여부를 판단한다.
 *
 * 단계:
 * 1. 그룹 만들기 (groups.length > 0)
 * 2. 멤버 등록하기 (total > 0)
 * 3. 출석 체크하기 (avgAttendance > 0)
 */
export const useOnboardingStatus = () => {
    const groupsQuery = trpc.group.list.useQuery();
    const studentsQuery = trpc.student.list.useQuery({ page: 1 });
    const yearlyQuery = trpc.statistics.yearly.useQuery({
        year: new Date().getFullYear(),
    });

    const isLoading = groupsQuery.isLoading || studentsQuery.isLoading || yearlyQuery.isLoading;
    const isError = !!groupsQuery.error || !!studentsQuery.error || !!yearlyQuery.error;

    const hasGroups = (groupsQuery.data?.groups.length ?? 0) > 0;
    const hasStudents = (studentsQuery.data?.total ?? 0) > 0;
    const hasAttendance = (yearlyQuery.data?.avgAttendance ?? 0) > 0;

    let currentStep: 0 | 1 | 2 | 3;
    if (!hasGroups) {
        currentStep = 1;
    } else if (!hasStudents) {
        currentStep = 2;
    } else if (!hasAttendance) {
        currentStep = 3;
    } else {
        currentStep = 0;
    }

    const isOnboardingComplete = currentStep === 0;

    return {
        isOnboardingComplete,
        currentStep,
        hasGroups,
        hasStudents,
        hasAttendance,
        isLoading,
        isError,
    };
};
