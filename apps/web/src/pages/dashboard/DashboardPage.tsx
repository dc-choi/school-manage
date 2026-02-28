import { GenderDistributionChart } from './GenderDistributionChart';
import { GroupStatisticsTable } from './GroupStatisticsTable';
import { LiturgicalSeasonCard } from './LiturgicalSeasonCard';
import { PatronFeastCard } from './PatronFeastCard';
import { TopRankingCard } from './TopRankingCard';
import { getNthSundayOf, getWeeksInMonth } from '@school/utils';
import { Check } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useAuth } from '~/features/auth';
import { useDashboardStatistics } from '~/features/statistics';
import { useOnboardingStatus } from '~/hooks/useOnboardingStatus';
import { analytics } from '~/lib/analytics';

const ONBOARDING_STEPS = [
    {
        step: 1,
        title: '학년 만들기',
        description: '반이나 모임을 만들어보세요',
        ctaLabel: '학년 추가',
        ctaPath: '/groups/new',
    },
    {
        step: 2,
        title: '학생 등록하기',
        description: '학생을 추가하면 출석 체크를 시작할 수 있어요',
        ctaLabel: '학생 추가',
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

function DashboardContent() {
    const { account } = useAuth();
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>(undefined);
    const [selectedWeek, setSelectedWeek] = useState<number | undefined>(undefined);

    const stats = useDashboardStatistics({
        year: selectedYear,
        month: selectedMonth,
        week: selectedWeek,
    });
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
        <MainLayout title={`안녕하세요, ${account?.name}님!`}>
            <div className="space-y-4">
                {/* 전례 시기 & 연도/월/주차 선택 */}
                <div className="flex flex-col gap-4 md:flex-row md:items-start">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label>연도</Label>
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(v) => {
                                    setSelectedYear(Number(v));
                                    setSelectedMonth(undefined);
                                    setSelectedWeek(undefined);
                                }}
                            >
                                <SelectTrigger className="w-24">
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
                        </div>

                        <div className="flex items-center gap-2">
                            <Label>월　</Label>
                            <Select
                                value={selectedMonth?.toString() ?? ''}
                                onValueChange={(v) => {
                                    setSelectedMonth(v ? Number(v) : undefined);
                                    setSelectedWeek(undefined);
                                }}
                            >
                                <SelectTrigger className="w-24">
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
                        </div>

                        <div className="flex items-center gap-2">
                            <Label>주차</Label>
                            <Select
                                value={selectedWeek?.toString() ?? ''}
                                onValueChange={(v) => setSelectedWeek(v && v !== 'all' ? Number(v) : undefined)}
                                disabled={!selectedMonth}
                            >
                                <SelectTrigger className="w-24">
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
                        </div>
                    </div>

                    <div className="md:flex-1">
                        <LiturgicalSeasonCard />
                    </div>
                    <div className="md:flex-1">
                        <PatronFeastCard />
                    </div>
                </div>

                {/* 학년별 상세 통계 테이블 */}
                <GroupStatisticsTable data={stats.groupStatistics} isLoading={stats.isLoading} error={hasError} />

                {/* 성별 분포 & 우수 출석 학생 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <GenderDistributionChart data={stats.byGender} isLoading={stats.isLoading} error={hasError} />
                    <TopRankingCard
                        title="전체 우수 출석 학생 TOP 5"
                        items={topStudentItems}
                        isLoading={stats.isLoading}
                        error={hasError}
                    />
                </div>
            </div>
        </MainLayout>
    );
}

const ONBOARDING_FLAG_KEY = 'onboarding_checklist_shown';

export function DashboardPage() {
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
            <MainLayout title={`안녕하세요, ${account?.name}님!`}>
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

    return (
        <MainLayout title={`안녕하세요, ${account?.name}님!`}>
            <OnboardingChecklist
                currentStep={onboarding.currentStep as 1 | 2 | 3}
                hasGroups={onboarding.hasGroups}
                hasStudents={onboarding.hasStudents}
                hasAttendance={onboarding.hasAttendance}
            />
        </MainLayout>
    );
}
