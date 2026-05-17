import { ContextBanner } from './ContextBanner';
import { GenderDistributionChart } from './GenderDistributionChart';
import { GroupStatisticsTable } from './GroupStatisticsTable';
import { JoinRequestsSection } from './JoinRequestsSection';
import { LiturgicalSeasonCard } from './LiturgicalSeasonCard';
import { PatronFeastCard } from './PatronFeastCard';
import { TopRankingCard } from './TopRankingCard';
import { JOIN_REQUEST_STATUS, ROLE, getOrganizationLabels } from '@school/shared';
import { getNthSundayOf, getWeeksInMonth } from '@school/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon, Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Calendar } from '~/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useAuth } from '~/features/auth';
import { useDashboardStatistics } from '~/features/statistics';
import { useOnboardingStatus } from '~/hooks/useOnboardingStatus';
import { analytics } from '~/lib/analytics';
import { cn } from '~/lib/utils';

const buildOnboardingSteps = (group: string, member: string) => [
    {
        step: 1,
        title: `${group} 만들기`,
        description: '반이나 모임을 만들어보세요',
        ctaLabel: `${group} 추가`,
        ctaPath: '/groups/new',
    },
    {
        step: 2,
        title: `${member} 등록하기`,
        description: `${member}을 추가하면 출석 체크를 시작할 수 있어요`,
        ctaLabel: `${member} 추가`,
        ctaPath: '/students/new',
    },
    {
        step: 3,
        title: '출석 체크하기',
        description: '날짜를 선택하고 출석을 체크해보세요',
        ctaLabel: '출석부 열기',
        ctaPath: '/attendance',
    },
];

function OnboardingChecklist({
    currentStep,
    hasGroups,
    hasStudents,
    hasAttendance,
}: {
    currentStep: 1 | 2 | 3;
    hasGroups: boolean;
    hasStudents: boolean;
    hasAttendance: boolean;
}) {
    const navigate = useNavigate();
    const { organizationType } = useAuth();
    const labels = useMemo(() => getOrganizationLabels(organizationType), [organizationType]);
    const ONBOARDING_STEPS = useMemo(
        () => buildOnboardingSteps(labels.group, labels.member),
        [labels.group, labels.member]
    );
    const completedFlags = [hasGroups, hasStudents, hasAttendance];

    useEffect(() => {
        sessionStorage.setItem(ONBOARDING_FLAG_KEY, 'true');
        analytics.trackOnboardingChecklistShown(currentStep);
    }, [currentStep]);

    return (
        <div className="mx-auto max-w-lg space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold">시작하기 가이드</h2>
                <p className="mt-2 text-muted-foreground">3단계만 완료하면 바로 사용할 수 있어요</p>
            </div>

            <ol className="space-y-3">
                {ONBOARDING_STEPS.map((item, index) => {
                    const isCompleted = completedFlags[index];
                    const isCurrent = item.step === currentStep;

                    return (
                        <li key={item.step}>
                            <Card
                                className={`flex items-center gap-4 p-4 ${isCurrent ? 'border-primary' : ''}${!isCurrent && isCompleted ? ' bg-muted' : ''}`}
                            >
                                {/* 아이콘/번호 */}
                                <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                        isCompleted || isCurrent
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {isCompleted ? (
                                        <Check className="h-4 w-4" aria-hidden="true" />
                                    ) : (
                                        <span className="text-sm font-medium">{item.step}</span>
                                    )}
                                </div>

                                {/* 텍스트 */}
                                <div className="flex-1">
                                    <p
                                        className={`font-medium ${
                                            isCompleted ? 'line-through text-muted-foreground' : ''
                                        }`}
                                    >
                                        {item.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>

                                {/* CTA */}
                                {isCurrent ? (
                                    <Button
                                        onClick={() => {
                                            analytics.trackOnboardingStepClicked(item.step);
                                            navigate(item.ctaPath);
                                        }}
                                    >
                                        {item.ctaLabel}
                                    </Button>
                                ) : null}
                            </Card>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

function DashboardContent({ showContextBanner = false }: { showContextBanner?: boolean }) {
    const { account, role, organizationType } = useAuth();
    const labels = useMemo(() => getOrganizationLabels(organizationType), [organizationType]);
    const memberLabel = labels.member;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>(currentMonth);
    const [selectedWeek, setSelectedWeek] = useState<number | undefined>(() => {
        const weeks = getWeeksInMonth(currentYear, currentMonth);
        for (let w = weeks; w >= 1; w--) {
            if (getNthSundayOf(currentYear, currentMonth, w) <= now) return w;
        }
        return undefined;
    });
    const [selectedDay, setSelectedDay] = useState<string | undefined>(() => format(now, 'yyyy-MM-dd'));

    const stats = useDashboardStatistics({
        year: selectedYear,
        month: selectedMonth,
        week: selectedWeek,
        day: selectedDay,
    });
    const effectiveDay = stats.groupStatistics?.effectiveDay ?? null;
    const hasError = !!stats.error;

    // GA4 이벤트: 대시보드 진입
    useEffect(() => {
        analytics.trackDashboardViewed();
    }, []);

    const yearOptions = useMemo(() => {
        const years = [];
        for (let y = currentYear; y >= currentYear - 5; y--) {
            years.push({ value: y.toString(), label: `${y}년` });
        }
        return years;
    }, [currentYear]);

    const monthOptions = useMemo(() => {
        const maxMonth = selectedYear === currentYear ? currentMonth : 12;
        const months = [{ value: '', label: '전체' }];
        for (let m = 1; m <= maxMonth; m++) {
            months.push({ value: m.toString(), label: `${m}월` });
        }
        return months;
    }, [selectedYear, currentYear, currentMonth]);

    const weekOptions = useMemo(() => {
        if (!selectedMonth) {
            return [{ value: '', label: '전체' }];
        }
        const weeksInMonth = getWeeksInMonth(selectedYear, selectedMonth);
        const isCurrentMonth = selectedYear === currentYear && selectedMonth === currentMonth;
        const weeks = [{ value: '', label: '전체' }];
        for (let w = 1; w <= weeksInMonth; w++) {
            if (isCurrentMonth && getNthSundayOf(selectedYear, selectedMonth, w) > now) break;
            weeks.push({ value: w.toString(), label: `${w}주차` });
        }
        return weeks;
    }, [selectedYear, selectedMonth, currentYear, currentMonth, now]);

    const topStudentItems =
        stats.topOverall?.students.map((s) => ({
            id: s.id,
            name: s.societyName,
            subText: s.groupName,
            value: s.score,
            valueSuffix: '점',
        })) ?? [];

    return (
        <MainLayout title={`안녕하세요, ${account?.displayName}님!`}>
            <div className="flex flex-col gap-3">
                {/* 합류 요청 관리 (admin만) */}
                {role === ROLE.ADMIN ? <JoinRequestsSection /> : null}

                {/* 컨텍스트 배너: 학생 있음 + 출석 미시작 */}
                {showContextBanner ? <ContextBanner /> : null}

                {/* 필터 + 전례 시기 카드 — 필터는 모바일 숨김(통계 페이지에 노출), 전례/축일자는 모바일에도 표시 */}
                <div className="flex flex-col gap-3">
                    <div className="hidden flex-wrap items-center gap-2 md:flex">
                        <Label className="text-xs text-muted-foreground">연도</Label>
                        <Select
                            value={selectedYear.toString()}
                            onValueChange={(v) => {
                                setSelectedYear(Number(v));
                                setSelectedMonth(undefined);
                                setSelectedWeek(undefined);
                                setSelectedDay(undefined);
                            }}
                        >
                            <SelectTrigger className="h-9 w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((y) => (
                                    <SelectItem key={y.value} value={y.value}>
                                        {y.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Label className="text-xs text-muted-foreground">월</Label>
                        <Select
                            value={selectedMonth?.toString() ?? ''}
                            onValueChange={(v) => {
                                setSelectedMonth(v ? Number(v) : undefined);
                                setSelectedWeek(undefined);
                                setSelectedDay(undefined);
                            }}
                        >
                            <SelectTrigger className="h-9 w-28">
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map((m) => (
                                    <SelectItem key={m.value || 'all'} value={m.value || 'all'}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Label className="text-xs text-muted-foreground">주차</Label>
                        <Select
                            value={selectedWeek?.toString() ?? ''}
                            onValueChange={(v) => {
                                setSelectedWeek(v && v !== 'all' ? Number(v) : undefined);
                                setSelectedDay(undefined);
                            }}
                            disabled={!selectedMonth}
                        >
                            <SelectTrigger className="h-9 w-28">
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                {weekOptions.map((w) => (
                                    <SelectItem key={w.value || 'all'} value={w.value || 'all'}>
                                        {w.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Label className="text-xs text-muted-foreground">날짜</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className={cn(
                                        'h-9 w-[9.5rem] justify-start gap-2 px-2 text-left text-sm font-normal tabular-nums',
                                        !(selectedDay ?? effectiveDay) && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="size-4 shrink-0" aria-hidden="true" />
                                    <span className="truncate">
                                        {(selectedDay ?? effectiveDay)
                                            ? format(new Date(selectedDay ?? effectiveDay ?? ''), 'yyyy-MM-dd', {
                                                  locale: ko,
                                              })
                                            : '날짜 선택'}
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={
                                        (selectedDay ?? effectiveDay)
                                            ? new Date(selectedDay ?? effectiveDay ?? '')
                                            : undefined
                                    }
                                    onSelect={(selected) =>
                                        setSelectedDay(selected ? format(selected, 'yyyy-MM-dd') : undefined)
                                    }
                                    captionLayout="dropdown"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-start">
                        <div className="md:flex-1">
                            <LiturgicalSeasonCard />
                        </div>
                        <div className="md:flex-1">
                            <PatronFeastCard />
                        </div>
                    </div>
                </div>

                {/* 학년별 상세 통계 테이블 — 모바일에서는 /statistics로 이동, 데스크탑에서만 표시 */}
                <GroupStatisticsTable
                    data={stats.groupStatistics}
                    isLoading={stats.isLoading}
                    error={hasError}
                    className="hidden h-[420px] md:flex"
                />

                {/* 성별 분포 & 우수 출석 학생 — 모바일 숨김 */}
                <div className="hidden grid-cols-1 gap-3 md:grid md:grid-cols-2">
                    <GenderDistributionChart data={stats.byGender} isLoading={stats.isLoading} error={hasError} />
                    <TopRankingCard
                        title={`전체 우수 출석 ${memberLabel} TOP 5`}
                        items={topStudentItems}
                        isLoading={stats.isLoading}
                        error={hasError}
                    />
                </div>
            </div>
        </MainLayout>
    );
}

function GuestDashboardContent() {
    const now = new Date();
    const currentYear = now.getFullYear();

    useEffect(() => {
        analytics.trackGuestDashboardViewed();
    }, []);

    return (
        <MainLayout title="주일학교 출석부">
            <div className="flex flex-col gap-3">
                {/* 필터 (disabled) + 전례 시기 카드 — 필터/통계 카드는 모바일 숨김 */}
                <div className="flex flex-col gap-3 md:flex-row md:items-start">
                    <div className="hidden flex-wrap items-center gap-2 md:flex">
                        <Label className="text-xs text-muted-foreground">연도</Label>
                        <Select value={currentYear.toString()} disabled>
                            <SelectTrigger className="h-9 w-28">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={currentYear.toString()}>{currentYear}년</SelectItem>
                            </SelectContent>
                        </Select>
                        <Label className="text-xs text-muted-foreground">월</Label>
                        <Select value="" disabled>
                            <SelectTrigger className="h-9 w-28">
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체</SelectItem>
                            </SelectContent>
                        </Select>
                        <Label className="text-xs text-muted-foreground">주차</Label>
                        <Select value="" disabled>
                            <SelectTrigger className="h-9 w-28">
                                <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">전체</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="md:flex-1">
                        <LiturgicalSeasonCard />
                    </div>
                    <div className="md:flex-1">
                        <Card className="p-4">
                            <p className="font-semibold">이달의 축일자</p>
                            <p className="mt-1 text-sm text-muted-foreground">로그인이 필요합니다</p>
                        </Card>
                    </div>
                </div>

                {/* 학년별 통계 — 모바일 숨김 */}
                <Card className="hidden h-[420px] md:block">
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-base">학년별 통계</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <p className="text-sm text-muted-foreground">로그인이 필요합니다</p>
                    </CardContent>
                </Card>

                {/* 성별 분포 & 우수 출석 학생 — 모바일 숨김 */}
                <div className="hidden grid-cols-1 gap-3 md:grid md:grid-cols-2">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">성별 분포</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">로그인이 필요합니다</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base">전체 우수 출석 학생 TOP 5</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground">로그인이 필요합니다</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
}

const ONBOARDING_FLAG_KEY = 'onboarding_checklist_shown';

export function DashboardPage() {
    const { isAuthenticated, isLoading: isAuthLoading, organizationId, joinRequestStatus } = useAuth();

    // 게스트 모드: 인증 로딩 완료 후 비인증이면 게스트 대시보드
    if (!isAuthLoading && !isAuthenticated) {
        return <GuestDashboardContent />;
    }

    // 미소속 사용자: 로딩 완료 후 organizationId 없으면 /join 또는 /pending 리다이렉트
    if (!isAuthLoading && isAuthenticated && !organizationId) {
        if (joinRequestStatus === JOIN_REQUEST_STATUS.PENDING) {
            return <Navigate to="/pending" replace />;
        }
        return <Navigate to="/join" replace />;
    }

    return <AuthenticatedDashboard />;
}

function AuthenticatedDashboard() {
    const { account } = useAuth();
    const onboarding = useOnboardingStatus();

    // 온보딩 완료 감지: 체크리스트가 표시된 적 있고(sessionStorage 플래그) 완료 상태로 전환 시 1회 발생
    useEffect(() => {
        if (!onboarding.isLoading && onboarding.isOnboardingComplete) {
            if (sessionStorage.getItem(ONBOARDING_FLAG_KEY)) {
                analytics.trackOnboardingCompleted(0);
                sessionStorage.removeItem(ONBOARDING_FLAG_KEY);
            }
        }
    }, [onboarding.isLoading, onboarding.isOnboardingComplete]);

    if (onboarding.isLoading) {
        return (
            <MainLayout title={`안녕하세요, ${account?.displayName}님!`}>
                <div className="flex justify-center p-8">
                    <output aria-label="로딩 중">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </output>
                </div>
            </MainLayout>
        );
    }

    if (onboarding.isError || onboarding.isOnboardingComplete) {
        return <DashboardContent />;
    }

    // step 3 (학생 있음, 출석 미시작): 대시보드 + 컨텍스트 배너
    if (onboarding.currentStep === 3) {
        return <DashboardContent showContextBanner />;
    }

    return (
        <MainLayout title={`안녕하세요, ${account?.displayName}님!`}>
            <OnboardingChecklist
                currentStep={onboarding.currentStep as 1 | 2}
                hasGroups={onboarding.hasGroups}
                hasStudents={onboarding.hasStudents}
                hasAttendance={onboarding.hasAttendance}
            />
        </MainLayout>
    );
}
