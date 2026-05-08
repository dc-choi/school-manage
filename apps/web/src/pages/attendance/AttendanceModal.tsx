import type { AttendanceData, StudentAttendanceDetail } from '@school/shared';
import { Check, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { type SortKey, sortStudents } from '~/features/attendance/utils/sortStudents';
import { analytics } from '~/lib/analytics';
import { extractErrorMessage } from '~/lib/error';
import { markFirstAttendanceDone } from '~/lib/pwa';
import { cn } from '~/lib/utils';

interface StudentAttendance {
    id: string;
    societyName: string;
    catholicName?: string;
    mass: boolean;
    catechism: boolean;
}

interface AttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    holyday: string | null;
    students: StudentAttendanceDetail[];
    isLoading?: boolean;
    onSave: (data: AttendanceData[]) => Promise<void>;
    year: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
    { value: 'registration', label: '등록 순' },
    { value: 'name', label: '가나다 순' },
];

const SORT_STORAGE_KEY = 'attendance_modal_sort';

const isValidSortKey = (value: string): value is SortKey => value === 'registration' || value === 'name';

/**
 * 출석 상태 기호
 * ◎ = 출석 (미사+교리)
 * ○ = 미사만
 * △ = 교리만
 * - = 결석
 */
function getStatusSymbol(mass: boolean, catechism: boolean): string {
    if (mass && catechism) return '◎';
    if (mass && !catechism) return '○';
    if (!mass && catechism) return '△';
    return '-';
}

/**
 * content 값을 미사/교리 체크로 변환
 */
function parseContent(content: string): { mass: boolean; catechism: boolean } {
    switch (content) {
        case '◎':
            return { mass: true, catechism: true };
        case '○':
            return { mass: true, catechism: false };
        case '△':
            return { mass: false, catechism: true };
        case '-':
        default:
            return { mass: false, catechism: false };
    }
}

export function AttendanceModal({
    isOpen,
    onClose,
    date,
    holyday,
    students,
    isLoading = false,
    onSave,
    year,
}: AttendanceModalProps) {
    const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [sortKey, setSortKey] = useState<SortKey>('registration');

    const sortSelectId = useId();

    const [, monthStr, dayStr] = date.split('-');
    const month = Number.parseInt(monthStr, 10);
    const day = Number.parseInt(dayStr, 10);

    const dateObj = new Date(date);
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];

    // 모달 오픈 시 학생 목록 초기화 + sortKey 복원
    useEffect(() => {
        if (isOpen && students.length > 0) {
            const initialData = students.map((student) => {
                const { mass, catechism } = parseContent(student.content);
                return {
                    id: student.id,
                    societyName: student.societyName,
                    catholicName: student.catholicName,
                    mass,
                    catechism,
                };
            });
            setStudentAttendance(initialData);
            setSaveStatus('idle');

            if (typeof window !== 'undefined') {
                const stored = window.sessionStorage.getItem(SORT_STORAGE_KEY);
                if (stored && isValidSortKey(stored)) {
                    setSortKey(stored);
                }
            }
        }
    }, [isOpen, students]);

    const sortedStudentAttendance = useMemo(
        () => sortStudents(studentAttendance, sortKey),
        [studentAttendance, sortKey]
    );

    const handleSortChange = (value: string) => {
        if (!isValidSortKey(value)) return;
        setSortKey(value);
        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(SORT_STORAGE_KEY, value);
        }
        analytics.trackAttendanceSortClicked(value);
    };

    const handleCheckChange = useCallback(
        async (studentId: string, field: 'mass' | 'catechism', checked: boolean) => {
            setStudentAttendance((prev) => prev.map((s) => (s.id === studentId ? { ...s, [field]: checked } : s)));

            const student = studentAttendance.find((s) => s.id === studentId);
            if (!student) return;

            const newMass = field === 'mass' ? checked : student.mass;
            const newCatechism = field === 'catechism' ? checked : student.catechism;
            const content = getStatusSymbol(newMass, newCatechism);

            setSaveStatus('saving');

            try {
                const data: AttendanceData = {
                    id: studentId,
                    month,
                    day,
                    data: content,
                };

                // 서버가 content로 자동 분기: ◎/○/△ → upsert, '-' → DELETE
                await onSave([data]);

                setSaveStatus('saved');
                markFirstAttendanceDone();
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                toast.error(extractErrorMessage(error));
                setSaveStatus('error');
            }
        },
        [studentAttendance, month, day, onSave]
    );

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {year}년 {month}월 {day}일 {dayOfWeek}요일
                    </DialogTitle>
                    {holyday && <p className="text-sm text-red-600">{holyday}</p>}
                </DialogHeader>

                {isLoading && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                        <span className="ml-2">로딩 중...</span>
                    </div>
                )}
                {!isLoading && students.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">학생이 없습니다.</p>
                )}
                {!isLoading && students.length > 0 && (
                    <div className="space-y-4">
                        {/* 정렬 토글 */}
                        <div className="flex items-end gap-2">
                            <div className="space-y-1">
                                <Label htmlFor={sortSelectId} className="text-xs">
                                    정렬
                                </Label>
                                <Select value={sortKey} onValueChange={handleSortChange}>
                                    <SelectTrigger id={sortSelectId} className="h-8 w-32">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SORT_OPTIONS.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>
                                                {o.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* 테이블 헤더 */}
                        <div className="grid grid-cols-[1fr_44px_44px_40px] sm:grid-cols-[1fr_60px_60px_50px] gap-2 border-b pb-2 text-sm font-medium">
                            <div>이름</div>
                            <div className="text-center">미사</div>
                            <div className="text-center">교리</div>
                            <div className="text-center">상태</div>
                        </div>

                        {/* 학생 목록 */}
                        {sortedStudentAttendance.map((student, index) => {
                            const massId = `attendance-mass-${student.id}`;
                            const catechismId = `attendance-catechism-${student.id}`;
                            return (
                                <div key={student.id}>
                                    {index > 0 && <div className="border-t border-border" />}
                                    <div className="grid grid-cols-[1fr_44px_44px_40px] sm:grid-cols-[1fr_60px_60px_50px] items-center gap-2 py-2">
                                        <div className="min-w-0">
                                            <span className="block truncate text-sm font-normal">
                                                {student.societyName}
                                            </span>
                                            {student.catholicName && (
                                                <span className="block truncate text-xs text-muted-foreground">
                                                    {student.catholicName}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex justify-center">
                                            <Checkbox
                                                id={massId}
                                                aria-label={`${student.societyName} 미사 출석`}
                                                checked={student.mass}
                                                onCheckedChange={(checked) =>
                                                    handleCheckChange(student.id, 'mass', checked as boolean)
                                                }
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <Checkbox
                                                id={catechismId}
                                                aria-label={`${student.societyName} 교리 출석`}
                                                checked={student.catechism}
                                                onCheckedChange={(checked) =>
                                                    handleCheckChange(student.id, 'catechism', checked as boolean)
                                                }
                                            />
                                        </div>
                                        <div
                                            className={cn(
                                                'text-center text-lg tabular-nums',
                                                student.mass && student.catechism && 'text-green-700',
                                                (student.mass || student.catechism) &&
                                                    !(student.mass && student.catechism) &&
                                                    'text-yellow-700',
                                                !student.mass && !student.catechism && 'text-muted-foreground'
                                            )}
                                        >
                                            {getStatusSymbol(student.mass, student.catechism)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* 저장 상태 인디케이터 */}
                        <div aria-live="polite" className="flex items-center justify-end gap-2 border-t pt-4 text-sm">
                            {saveStatus === 'saving' && (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    <span>저장 중...</span>
                                </>
                            )}
                            {saveStatus === 'saved' && (
                                <>
                                    <Check className="h-4 w-4 text-green-700" aria-hidden="true" />
                                    <span className="text-green-700">저장 완료</span>
                                </>
                            )}
                            {saveStatus === 'error' && (
                                <>
                                    <X className="h-4 w-4 text-red-700" aria-hidden="true" />
                                    <span className="text-red-700">저장 실패</span>
                                    <Button variant="outline" size="sm" onClick={() => setSaveStatus('idle')}>
                                        재시도
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
