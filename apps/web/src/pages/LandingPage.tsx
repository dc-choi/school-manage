import {
    BarChart3,
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    Plus,
    Users,
    X,
} from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/features/auth';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';
import { cn } from '~/lib/utils';

const PAIN_POINTS = [
    {
        quote: '출석부 어디 뒀더라...',
        desc: '매주 종이 출석부 찾는 것부터 시작하는 주일',
    },
    {
        quote: '작년 명단이 어디 갔지...?',
        desc: '기록이 여기저기 흩어져 있으면 매번 처음부터 정리하게 돼요',
    },
    {
        quote: '이번 달 축일이 누구더라...?',
        desc: '축일 따로 찾고, 연락처 따로 확인하고... 매번 반복',
    },
];

const FAQ_ITEMS = [
    {
        question: '정말 무료인가요?',
        answer: '네, 모든 기능을 무료로 사용할 수 있어요. 지금 제공되는 핵심 기능은 앞으로도 무료로 유지됩니다.',
    },
    {
        question: '개인정보는 안전한가요?',
        answer: '개인정보 처리방침에 따라 최소한의 정보만 수집하고, 제3자에게 제공하지 않아요.',
    },
    {
        question: '선생님이 여러 명인데, 각각 가입해야 하나요?',
        answer: '아니요. 모임 하나당 계정 하나를 만들고, 선생님들이 같은 계정을 공유하시면 돼요.',
    },
    {
        question: '가입하면 뭘 먼저 해야 하나요?',
        answer: '가입 후 ① 그룹(반)을 만들고 ② 멤버를 등록하면 ③ 출석 체크를 시작할 수 있어요. 3분이면 충분해요.',
    },
    {
        question: '스마트폰에서도 쓸 수 있나요?',
        answer: '네, 웹 기반이라 스마트폰, 태블릿, PC 어디서든 사용할 수 있어요. 앱 설치는 필요 없어요.',
    },
    {
        question: '가톨릭 주일학교만 쓸 수 있나요?',
        answer: '주일학교 운영에 최적화되어 있지만, 출석 관리가 필요한 모임이면 어디든 사용할 수 있어요.',
    },
    {
        question: '기존에 쓰던 출석 데이터를 옮길 수 있나요?',
        answer: '현재는 직접 입력 방식이에요. 대량 등록 기능은 준비 중입니다.',
    },
];

const FEATURES = [
    {
        icon: ClipboardCheck,
        title: '출석 체크',
        description: '폰에서 탭 한 번이면 출석 체크 끝.',
    },
    {
        icon: Users,
        title: '멤버·축일 관리',
        description: '멤버 정보와 축일을 한곳에서 기록하고 바로 검색.',
    },
    {
        icon: BarChart3,
        title: '통계 자동 계산',
        description: '출석률, 출석상 순위까지 자동으로 정리돼요.',
    },
    {
        icon: Calendar,
        title: '달력으로 한눈에',
        description: '우리 반 아이들이 언제 왔는지 한눈에 보여요.',
    },
];

const INITIAL_DEMO_STUDENTS = [
    { id: 1, name: '김하늘', baptismalName: '마리아', feastDay: '03/19', phone: '010-1234-5678' },
    { id: 2, name: '이서준', baptismalName: '베드로', feastDay: '06/29', phone: '010-1234-5678' },
    { id: 3, name: '박지유', baptismalName: '데레사', feastDay: '10/01', phone: '010-1234-5678' },
    { id: 4, name: '최도윤', baptismalName: '요셉', feastDay: '11/01', phone: '010-1234-5678' },
    { id: 5, name: '정예린', baptismalName: '루치아', feastDay: '12/08', phone: '010-1234-5678' },
];

const getStatusSymbol = (mass: boolean, catechism: boolean) => {
    if (mass && catechism) return '◎';
    if (mass) return '○';
    if (catechism) return '△';
    return '-';
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

// 데모용 달력 데이터 생성
const buildDemoCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = Array(firstDay).fill(null);

    for (let d = 1; d <= daysInMonth; d++) {
        week.push(d);
        if (week.length === 7) {
            weeks.push(week);
            week = [];
        }
    }
    if (week.length > 0) {
        while (week.length < 7) week.push(null);
        weeks.push(week);
    }
    return weeks;
};

type DayAttendance = Record<number, { mass: boolean; catechism: boolean }>;

// 날짜별 출석 현황 계산
const countPresent = (att: DayAttendance) => Object.values(att).filter((a) => a.mass || a.catechism).length;

function InteractiveDemo() {
    const now = new Date();
    const [year, setYear] = useState(now.getFullYear());
    const [month, setMonth] = useState(now.getMonth());
    const [selectedDate, setSelectedDate] = useState<number | null>(null);

    // 날짜별 출석 데이터 저장: key = "YYYY-MM-DD"
    const [attendanceByDate, setAttendanceByDate] = useState<Record<string, DayAttendance>>({});
    const [students, setStudents] = useState(INITIAL_DEMO_STUDENTS);

    const updateStudent = (id: number, field: 'name' | 'baptismalName' | 'feastDay' | 'phone', value: string) => {
        setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
    };

    const addStudent = () => {
        const newId = Math.max(...students.map((s) => s.id)) + 1;
        setStudents((prev) => [...prev, { id: newId, name: '', baptismalName: '', feastDay: '', phone: '' }]);
    };

    const removeStudent = (id: number) => {
        if (students.length <= 1) return;
        setStudents((prev) => prev.filter((s) => s.id !== id));
    };

    const dateKey = (d: number) => `${year}-${month}-${d}`;
    const savedAttendance = selectedDate ? attendanceByDate[dateKey(selectedDate)] : undefined;
    const currentAttendance: DayAttendance = Object.fromEntries(
        students.map((s) => [s.id, savedAttendance?.[s.id] ?? { mass: false, catechism: false }])
    );
    const presentCount = countPresent(currentAttendance);
    const rate = selectedDate ? Math.round((presentCount / students.length) * 100) : 0;

    const weeks = buildDemoCalendar(year, month);
    const today = now.getFullYear() === year && now.getMonth() === month ? now.getDate() : null;

    const prevMonth = () => {
        if (month === 0) {
            setYear(year - 1);
            setMonth(11);
        } else setMonth(month - 1);
        setSelectedDate(null);
    };
    const nextMonth = () => {
        if (month === 11) {
            setYear(year + 1);
            setMonth(0);
        } else setMonth(month + 1);
        setSelectedDate(null);
    };

    const toggleField = (id: number, field: 'mass' | 'catechism') => {
        if (!selectedDate) return;
        const key = dateKey(selectedDate);
        setAttendanceByDate((prev) => {
            const current =
                prev[key] ?? Object.fromEntries(students.map((s) => [s.id, { mass: false, catechism: false }]));
            return {
                ...prev,
                [key]: {
                    ...current,
                    [id]: { ...current[id], [field]: !current[id][field] },
                },
            };
        });
    };

    const handleDateClick = (day: number) => {
        setSelectedDate(day);
    };

    const dayLabel = selectedDate
        ? `${year}년 ${month + 1}월 ${selectedDate}일 ${WEEKDAYS[new Date(year, month, selectedDate).getDay()]}요일`
        : '';

    return (
        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-start lg:justify-center lg:gap-12">
            {/* 달력 카드 */}
            <div className="w-full max-w-sm rounded-2xl border bg-background p-5 shadow-xl">
                {/* 달력 헤더 */}
                <div className="mb-4 flex items-center justify-between">
                    <button type="button" onClick={prevMonth} className="rounded-lg p-1.5 hover:bg-muted">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        <span className="text-lg font-bold tracking-tight">
                            {year}년 {month + 1}월
                        </span>
                    </div>
                    <button type="button" onClick={nextMonth} className="rounded-lg p-1.5 hover:bg-muted">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>

                {/* 요일 헤더 */}
                <div className="mb-1 grid grid-cols-7 gap-0">
                    {WEEKDAYS.map((wd, i) => (
                        <div
                            key={wd}
                            className={cn(
                                'py-1.5 text-center text-xs font-semibold',
                                i === 0 && 'text-red-500',
                                i === 6 && 'text-blue-500',
                                i > 0 && i < 6 && 'text-muted-foreground'
                            )}
                        >
                            {wd}
                        </div>
                    ))}
                </div>

                {/* 날짜 그리드 */}
                <div className="grid grid-cols-7 gap-0">
                    {weeks.flat().map((day, i) => {
                        const dayOfWeek = i % 7;
                        const isSunday = dayOfWeek === 0;
                        const isSaturday = dayOfWeek === 6;
                        const isSelected = day === selectedDate;
                        const isToday = day === today;
                        const dayData = day !== null ? attendanceByDate[dateKey(day)] : undefined;
                        const dayPresentCount = dayData ? countPresent(dayData) : 0;

                        if (day === null) {
                            return <div key={i} className="h-12" />;
                        }

                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => handleDateClick(day)}
                                className={cn(
                                    'relative flex h-12 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg text-sm transition-all hover:bg-accent/50',
                                    isSunday && 'bg-rose-50/40 text-red-500',
                                    isSaturday && 'text-blue-500',
                                    isToday && !isSelected && 'font-bold ring-1 ring-primary/30',
                                    isSelected && 'bg-primary text-primary-foreground font-bold hover:bg-primary/90'
                                )}
                            >
                                <span className="text-xs leading-none">{day}</span>
                                {dayPresentCount > 0 && (
                                    <span
                                        className={cn(
                                            'text-[10px] leading-none font-medium',
                                            isSelected ? 'text-primary-foreground/80' : 'text-green-600'
                                        )}
                                    >
                                        {dayPresentCount}/{students.length}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* 안내 문구 */}
                <p className="mt-3 text-center text-xs text-muted-foreground">
                    {selectedDate ? '출석을 체크하면 달력에 반영돼요' : '날짜를 클릭해보세요'}
                </p>
            </div>

            {/* 오른쪽 패널: 멤버 정보 ↔ 출석 체크 전환 */}
            <div className="w-full max-w-sm rounded-2xl border bg-background shadow-xl">
                {selectedDate ? (
                    <>
                        {/* 출석 체크 헤더 */}
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <h3 className="text-base font-semibold">{dayLabel}</h3>
                                <p className="text-xs text-muted-foreground">출석 체크</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedDate(null)}
                                className="rounded-lg p-1.5 hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {/* 출석 체크 내용 */}
                        <div className="px-5 py-4">
                            <div className="mb-2 grid grid-cols-[1fr_56px_56px_40px] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
                                <span>이름</span>
                                <span className="text-center">미사</span>
                                <span className="text-center">교리</span>
                                <span className="text-center">상태</span>
                            </div>

                            <ul className="space-y-1">
                                {students.map((student) => {
                                    const a = currentAttendance[student.id];
                                    const symbol = getStatusSymbol(a.mass, a.catechism);
                                    return (
                                        <li
                                            key={student.id}
                                            className="grid grid-cols-[1fr_56px_56px_40px] items-center gap-2 rounded-lg py-1.5"
                                        >
                                            <span className="text-sm font-medium">{student.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => toggleField(student.id, 'mass')}
                                                className={cn(
                                                    'mx-auto flex h-7 w-7 items-center justify-center rounded-md border-2 transition-all',
                                                    a.mass
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-muted-foreground/30 hover:border-primary/50'
                                                )}
                                            >
                                                {a.mass && <Check className="h-3.5 w-3.5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => toggleField(student.id, 'catechism')}
                                                className={cn(
                                                    'mx-auto flex h-7 w-7 items-center justify-center rounded-md border-2 transition-all',
                                                    a.catechism
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-muted-foreground/30 hover:border-primary/50'
                                                )}
                                            >
                                                {a.catechism && <Check className="h-3.5 w-3.5" />}
                                            </button>
                                            <span
                                                className={cn(
                                                    'text-center text-base font-bold',
                                                    symbol === '◎'
                                                        ? 'text-green-600'
                                                        : symbol === '-'
                                                          ? 'text-muted-foreground/40'
                                                          : 'text-yellow-600'
                                                )}
                                            >
                                                {symbol}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>

                            <div className="mt-4 space-y-2 border-t pt-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">출석률</span>
                                    <span className="font-semibold">{rate}%</span>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-primary transition-all duration-500"
                                        style={{ width: `${rate}%` }}
                                    />
                                </div>
                                <p className="text-center text-xs text-muted-foreground">
                                    {presentCount}/{students.length}명 출석
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* 멤버 관리 헤더 */}
                        <div className="border-b px-5 py-4">
                            <h3 className="text-base font-semibold">멤버 정보</h3>
                            <p className="text-xs text-muted-foreground">정보를 수정해보세요</p>
                        </div>

                        {/* 멤버 정보 */}
                        <div className="px-5 py-4">
                            <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_1fr_24px] gap-1.5 border-b pb-2 text-xs font-medium text-muted-foreground">
                                <span>이름</span>
                                <span className="text-center">세례명</span>
                                <span className="text-center">축일</span>
                                <span className="text-center">연락처</span>
                                <span />
                            </div>
                            <ul className="space-y-1">
                                {students.map((student) => (
                                    <li
                                        key={student.id}
                                        className="grid grid-cols-[1fr_1fr_1fr_1fr_24px] items-center gap-1.5 py-1"
                                    >
                                        <input
                                            type="text"
                                            value={student.name}
                                            onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                                            placeholder="이름"
                                            className="w-full rounded bg-transparent px-1 py-0.5 text-sm font-medium outline-none focus:bg-muted/50 focus:ring-1 focus:ring-primary/30"
                                        />
                                        <input
                                            type="text"
                                            value={student.baptismalName}
                                            onChange={(e) => updateStudent(student.id, 'baptismalName', e.target.value)}
                                            placeholder="세례명"
                                            className="w-full rounded bg-transparent px-1 py-0.5 text-center text-xs outline-none focus:bg-muted/50 focus:ring-1 focus:ring-primary/30"
                                        />
                                        <input
                                            type="text"
                                            value={student.feastDay}
                                            onChange={(e) => updateStudent(student.id, 'feastDay', e.target.value)}
                                            inputMode="numeric"
                                            maxLength={5}
                                            placeholder="MM/DD"
                                            className="w-full rounded bg-transparent px-1 py-0.5 text-center text-xs outline-none focus:bg-muted/50 focus:ring-1 focus:ring-primary/30"
                                        />
                                        <input
                                            type="tel"
                                            value={student.phone}
                                            onChange={(e) => updateStudent(student.id, 'phone', e.target.value)}
                                            placeholder="연락처"
                                            className="w-full rounded bg-transparent px-1 py-0.5 text-center text-xs outline-none focus:bg-muted/50 focus:ring-1 focus:ring-primary/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeStudent(student.id)}
                                            className={cn(
                                                'flex h-6 w-6 items-center justify-center rounded-md transition-colors',
                                                students.length > 1
                                                    ? 'text-muted-foreground hover:bg-destructive/10 hover:text-destructive'
                                                    : 'cursor-not-allowed text-muted-foreground/20'
                                            )}
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                onClick={addStudent}
                                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                            >
                                <Plus className="h-4 w-4" />
                                멤버 추가
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

function ScrollDownHint({ targetId }: { targetId: string }) {
    return (
        <button
            type="button"
            className="mt-12 flex flex-col items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
            }}
        >
            <span className="text-base">아래로 스크롤해보세요</span>
            <ChevronDown className="h-7 w-7 animate-bounce" />
        </button>
    );
}

function FadeInSection({
    children,
    className,
    onVisible,
}: {
    children: ReactNode;
    className?: string;
    onVisible?: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const tracked = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
                if (entry.isIntersecting && !tracked.current) {
                    tracked.current = true;
                    onVisible?.();
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [onVisible]);

    return (
        <div
            ref={ref}
            className={cn(
                'transition-all duration-1000 ease-out',
                isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-95 opacity-0',
                className
            )}
        >
            {children}
        </div>
    );
}

export function LandingPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    const { data: countData } = trpc.account.count.useQuery(undefined, {
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        analytics.trackLandingView();
        analytics.trackLandingSectionView('hero');
    }, []);

    if (isAuthenticated && !isAuthLoading) {
        return <Navigate to="/" replace />;
    }

    const handleBottomCtaClick = () => {
        analytics.trackLandingCtaClick('bottom');
        navigate('/signup');
    };

    const handleLoginClick = () => {
        analytics.trackLandingLoginClick();
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="break-keep">
                {/* ① Hero — 첫 화면은 즉시 표시 */}
                <section className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-primary/8 to-background px-6 text-center">
                    <h1 className="text-4xl font-bold leading-snug tracking-tight text-balance sm:text-5xl lg:text-7xl">
                        매주 일요일,
                        <br />
                        이거 하나면 됩니다
                    </h1>
                    <p className="text-2xl text-muted-foreground sm:text-3xl">
                        <span className="font-semibold text-foreground">출석, 축일, 멤버 현황</span>까지.
                        <br />
                        주일학교 교리교사를 위한 주간 도구.
                    </p>
                    <ScrollDownHint targetId="pain-points" />
                </section>

                {/* ② Pain Points — 공감 */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('pain-points')}>
                    <section
                        id="pain-points"
                        className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 text-center"
                    >
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">
                            혹시 이런 주일, 보내고 계신가요?
                        </h2>
                        <div className="flex flex-col gap-10">
                            {PAIN_POINTS.map((point) => (
                                <div key={point.quote} className="flex flex-col gap-2">
                                    <p className="text-xl font-medium sm:text-2xl">&ldquo;{point.quote}&rdquo;</p>
                                    <p className="text-base text-muted-foreground sm:text-lg">{point.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-xl sm:text-2xl">
                            우리 다 겪어봤습니다.
                            <br />
                            <span className="font-semibold">그래서 만들었어요.</span>
                        </p>
                        <ScrollDownHint targetId="features" />
                    </section>
                </FadeInSection>

                {/* ③ Features — 솔루션 */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('features')}>
                    <section
                        id="features"
                        className="flex min-h-screen flex-col items-center justify-center gap-12 bg-muted/30 px-6 text-center"
                    >
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">
                            종이와 엑셀 대신, 이렇게 바뀌어요
                        </h2>
                        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
                            {FEATURES.map((feature) => (
                                <div key={feature.title} className="flex flex-col items-center gap-4 text-center">
                                    <feature.icon className="h-10 w-10 text-primary lg:h-12 lg:w-12" />
                                    <h3 className="text-xl font-semibold sm:text-2xl">{feature.title}</h3>
                                    <p className="text-base text-muted-foreground sm:text-lg">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                        <ScrollDownHint targetId="screenshot" />
                    </section>
                </FadeInSection>

                {/* ④ 인터랙티브 데모 */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('demo')}>
                    <section
                        id="screenshot"
                        className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center"
                    >
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">직접 체험해보세요</h2>
                        <p className="text-base text-muted-foreground sm:text-lg">출석 체크하면 바로 반영돼요</p>
                        <p className="text-base text-muted-foreground sm:text-base">실제 데이터는 아니에요!</p>
                        <InteractiveDemo />
                        <ScrollDownHint targetId="cta" />
                    </section>
                </FadeInSection>

                {/* ⑤ Social Proof + Final CTA */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('cta')}>
                    <section
                        id="cta"
                        className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-t from-primary/8 to-background px-6 text-center"
                    >
                        {countData && countData.count > 0 && (
                            <div className="flex flex-col items-center gap-2 text-lg font-medium text-balance sm:flex-row sm:gap-3 sm:text-2xl">
                                <Users className="h-7 w-7 shrink-0 text-primary" />
                                <span>{countData.count}개 단체가 이미 사용하고 있어요</span>
                            </div>
                        )}
                        <p className="text-lg text-muted-foreground sm:text-xl">
                            무료로 시작할 수 있어요. 30초면 충분해요.
                            <br />
                            이번 주일부터 써보세요.
                        </p>
                        <Button size="lg" className="px-8 py-6 text-lg" onClick={handleBottomCtaClick}>
                            지금 시작해보기
                        </Button>
                        <Button variant="ghost" className="text-base sm:text-lg" asChild onClick={handleLoginClick}>
                            <Link to="/login">이미 계정이 있으신가요?</Link>
                        </Button>
                    </section>
                </FadeInSection>

                {/* ⑥ FAQ */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('faq')}>
                    <section className="py-20 px-6">
                        <h2 className="text-3xl font-bold text-center mb-8">자주 묻는 질문</h2>
                        <Accordion
                            type="single"
                            collapsible
                            className="max-w-2xl mx-auto"
                            onValueChange={(value) => {
                                if (value) {
                                    const item = FAQ_ITEMS[Number(value)];
                                    if (item) {
                                        analytics.trackLandingFaqClick(item.question);
                                    }
                                }
                            }}
                        >
                            {FAQ_ITEMS.map((item, index) => (
                                <AccordionItem key={index} value={String(index)}>
                                    <AccordionTrigger>{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">{item.answer}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>
                </FadeInSection>
            </main>

            {/* Footer */}
            <footer className="px-6 py-12 text-center text-sm text-muted-foreground">
                &copy; 2022 주일학교 출석부
            </footer>
        </div>
    );
}
