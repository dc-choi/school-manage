import { Calendar, Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '~/lib/utils';

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
    let week: (number | null)[] = new Array(firstDay).fill(null);

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

const getSymbolColor = (symbol: string): string => {
    if (symbol === '◎') return 'text-green-600';
    if (symbol === '-') return 'text-muted-foreground/40';
    return 'text-yellow-600';
};

// 날짜별 출석 현황 계산
const countPresent = (att: DayAttendance) => Object.values(att).filter((a) => a.mass || a.catechism).length;

export function InteractiveDemo() {
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
                        const weekIndex = Math.floor(i / 7);
                        const dayOfWeek = i % 7;
                        const isSunday = dayOfWeek === 0;
                        const isSaturday = dayOfWeek === 6;
                        const isSelected = day === selectedDate;
                        const isToday = day === today;
                        const dayData = day !== null ? attendanceByDate[dateKey(day)] : undefined;
                        const dayPresentCount = dayData ? countPresent(dayData) : 0;

                        if (day === null) {
                            return <div key={`empty-w${weekIndex}-d${dayOfWeek}`} className="h-12" />;
                        }

                        return (
                            <button
                                key={`day-${day}`}
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

            {/* 오른쪽 패널: 학생 정보 ↔ 출석 체크 전환 */}
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
                                                    getSymbolColor(symbol)
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
                        {/* 학생 관리 헤더 */}
                        <div className="border-b px-5 py-4">
                            <h3 className="text-base font-semibold">학생 정보</h3>
                            <p className="text-xs text-muted-foreground">정보를 수정해보세요</p>
                        </div>

                        {/* 학생 정보 */}
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
                                학생 추가
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
