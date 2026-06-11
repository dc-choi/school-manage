import {
    type AttendanceData,
    type AttendanceSymbol,
    type StudentAttendanceDetail,
    getOrganizationLabels,
} from '@school/shared';
import { josa } from '@school/utils';
import { Check, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { type SortKey, sortStudents } from '~/features/attendance/utils/sortStudents';
import { useAuth } from '~/features/auth';
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
 * (빈 문자열) = 결석
 */
function getStatusSymbol(mass: boolean, catechism: boolean): AttendanceSymbol {
    if (mass && catechism) return '◎';
    if (mass && !catechism) return '○';
    if (!mass && catechism) return '△';
    return '';
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
        case '':
            return { mass: false, catechism: false };
        default:
            // 운영 DB 잔존 '-' 또는 비예상 토큰은 결석으로 흡수 — dev 환경에서만 경고
            if (import.meta.env.DEV) {
                console.warn(`[parseContent] unknown content token: "${content}"`);
            }
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
    const { organizationType } = useAuth();
    const labels = useMemo(() => getOrganizationLabels(organizationType), [organizationType]);
    const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const [sortKey, setSortKey] = useState<SortKey>('registration');
    const idleTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const saveChainRef = useRef<Promise<unknown>>(Promise.resolve());
    // 렌더 타이밍과 무관하게 항상 최신인 체크 상태 미러 — 렌더 전 연속 클릭의 stale closure 방지
    const studentAttendanceRef = useRef<StudentAttendance[]>([]);
    // 모달 세션(오픈 단위) in-flight 카운터 — 재오픈 시 새 객체로 교체되어
    // 이전 세션의 늦은 완료가 새 세션의 동기화 게이트/인디케이터를 오염시키지 않는다
    const saveSessionRef = useRef({ pending: 0 });
    // 저장 실패한 학생 목록 — '재시도'가 현재 체크 상태 기준으로 재전송
    const failedStudentIdsRef = useRef<Set<string>>(new Set());

    const syncStudentAttendance = useCallback((next: StudentAttendance[]) => {
        studentAttendanceRef.current = next;
        setStudentAttendance(next);
    }, []);

    const sortSelectId = useId();

    const [, monthStr, dayStr] = date.split('-');
    const month = Number.parseInt(monthStr, 10);
    const day = Number.parseInt(dayStr, 10);

    const dateObj = new Date(date);
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];

    // 모달 오픈 시 1회: 저장 상태 초기화 + sortKey 복원
    // (students 의존을 두면 저장 후 dayDetail 재조회마다 재실행되어
    //  '저장 완료' 인디케이터가 idle로 즉시 덮여 표시되지 않는다)
    useEffect(() => {
        if (isOpen) {
            // 새 저장 세션 시작 — 이전 세션의 in-flight 저장/실패 목록과 분리
            saveSessionRef.current = { pending: 0 };
            failedStudentIdsRef.current = new Set();
            setSaveStatus('idle');

            if (typeof window !== 'undefined') {
                const stored = window.sessionStorage.getItem(SORT_STORAGE_KEY);
                if (stored && isValidSortKey(stored)) {
                    setSortKey(stored);
                }
            }
        }
    }, [isOpen]);

    // 언마운트 시 잔여 idle 타이머 정리
    useEffect(() => {
        return () => clearTimeout(idleTimerRef.current);
    }, []);

    // 서버 상태 동기화: 오픈 시 + 저장 후 dayDetail 재조회마다
    // 단, 저장이 진행 중일 때는 건너뛴다 — 직전 저장의 서버 스냅샷이 사용자가
    // 연속 입력 중인 로컬 체크 상태를 되돌리면(controlled checkbox 역전)
    // 다음 클릭의 토글 방향이 뒤집혀 마지막 상태가 유실된다
    useEffect(() => {
        if (saveSessionRef.current.pending > 0) return;
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
            syncStudentAttendance(initialData);
        }
    }, [isOpen, students, syncStudentAttendance]);

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

    /** 학생의 현재 체크 상태를 직렬 체인으로 저장. 에러는 내부에서 처리(인디케이터 + 토스트 + 재시도 목록). */
    const performSave = useCallback(
        async (studentId: string) => {
            const student = studentAttendanceRef.current.find((s) => s.id === studentId);
            if (!student) return;

            const content = getStatusSymbol(student.mass, student.catechism);
            const session = saveSessionRef.current;

            // 이전 저장의 idle 타이머가 진행 중인 'saving'/'error' 표시를 덮지 않도록 시작 시점에 정리
            clearTimeout(idleTimerRef.current);
            setSaveStatus('saving');
            session.pending += 1;

            try {
                const data: AttendanceData = {
                    id: studentId,
                    month,
                    day,
                    data: content,
                };

                // 클릭 순서대로 직렬 전송 — 병렬 요청의 커밋 순서 역전(last-write-lost) 방지.
                // 앞 저장이 실패해도 체인은 계속 진행한다.
                // 서버가 content로 자동 분기: ◎/○/△ → upsert, '' → DELETE
                const savePromise = saveChainRef.current.then(
                    () => onSave([data]),
                    () => onSave([data])
                );
                saveChainRef.current = savePromise;
                await savePromise;

                markFirstAttendanceDone();
                failedStudentIdsRef.current.delete(studentId);
                // 마지막 저장까지 끝났을 때만 '저장 완료' — 중간 완료가 진행 중 표시를 가리지 않도록.
                // 세션이 바뀌었으면(모달 재오픈) 이전 세션의 늦은 완료는 인디케이터를 건드리지 않는다.
                if (session === saveSessionRef.current && session.pending === 1) {
                    setSaveStatus('saved');
                    idleTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
                }
            } catch (error) {
                toast.error(extractErrorMessage(error));
                if (session === saveSessionRef.current) {
                    failedStudentIdsRef.current.add(studentId);
                    setSaveStatus('error');
                }
            } finally {
                session.pending -= 1;
            }
        },
        [month, day, onSave]
    );

    const handleCheckChange = useCallback(
        async (studentId: string, field: 'mass' | 'catechism', checked: boolean) => {
            // ref 미러를 동기 갱신한 뒤 그 값으로 저장 — 렌더 전 연속 클릭에도 stale 없음
            syncStudentAttendance(
                studentAttendanceRef.current.map((s) => (s.id === studentId ? { ...s, [field]: checked } : s))
            );
            await performSave(studentId);
        },
        [performSave, syncStudentAttendance]
    );

    /** 실패분을 현재 체크 상태 기준으로 재전송. performSave가 에러를 내부 처리하므로 floating 안전. */
    const handleRetry = () => {
        const failedIds = [...failedStudentIdsRef.current];
        failedStudentIdsRef.current = new Set();

        if (failedIds.length === 0) {
            setSaveStatus('idle');

            return;
        }

        for (const id of failedIds) {
            void performSave(id);
        }
    };

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
                    <p className="py-8 text-center text-muted-foreground">{josa(labels.member, '이/가')} 없습니다.</p>
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
                                    <Button variant="outline" size="sm" onClick={handleRetry}>
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
