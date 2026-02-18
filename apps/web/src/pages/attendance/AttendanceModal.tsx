import type { AttendanceData, StudentAttendanceDetail } from '@school/trpc';
import { Check, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
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
    onSave: (data: AttendanceData[], isFull: boolean) => Promise<void>;
    year: number;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

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
 * ◎ = 출석 (미사+교리)
 * ○ = 미사만
 * △ = 교리만
 * - = 결석
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

/**
 * 미사/교리 체크를 content 값으로 변환
 * ◎ = 출석 (미사+교리)
 * ○ = 미사만
 * △ = 교리만
 * - = 결석
 */
function toContent(mass: boolean, catechism: boolean): string {
    if (mass && catechism) return '◎';
    if (mass && !catechism) return '○';
    if (!mass && catechism) return '△';
    return '-';
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

    // 날짜 파싱
    const [, monthStr, dayStr] = date.split('-');
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);

    // 요일 계산
    const dateObj = new Date(date);
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];

    // 모달 오픈 시 학생 목록 초기화
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
        }
    }, [isOpen, students]);

    // 체크박스 변경 핸들러 (자동 저장)
    const handleCheckChange = useCallback(
        async (studentId: string, field: 'mass' | 'catechism', checked: boolean) => {
            // 로컬 상태 업데이트
            setStudentAttendance((prev) => prev.map((s) => (s.id === studentId ? { ...s, [field]: checked } : s)));

            // 즉시 저장
            const student = studentAttendance.find((s) => s.id === studentId);
            if (!student) return;

            const newMass = field === 'mass' ? checked : student.mass;
            const newCatechism = field === 'catechism' ? checked : student.catechism;
            const content = toContent(newMass, newCatechism);

            setSaveStatus('saving');

            try {
                const data: AttendanceData = {
                    id: studentId,
                    month,
                    day,
                    data: content,
                };

                // 결석('-')이면 삭제, 그 외(◎, ○, △)는 저장
                await onSave([data], content !== '-');

                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (error) {
                console.error('저장 실패:', error);
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

                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                        <span className="ml-2">로딩 중...</span>
                    </div>
                ) : students.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">멤버가 없습니다.</p>
                ) : (
                    <div className="space-y-4">
                        {/* 테이블 헤더 */}
                        <div className="grid grid-cols-[1fr_60px_60px_50px] gap-2 border-b pb-2 text-sm font-medium">
                            <div>이름</div>
                            <div className="text-center">미사</div>
                            <div className="text-center">교리</div>
                            <div className="text-center">상태</div>
                        </div>

                        {/* 학생 목록 */}
                        {studentAttendance.map((student, index) => (
                            <div key={student.id}>
                                {index > 0 && <div className="border-t border-border" />}
                                <div className="grid grid-cols-[1fr_60px_60px_50px] items-center gap-2 py-2">
                                    <div>
                                        <Label className="font-normal">{student.societyName}</Label>
                                        {student.catholicName && (
                                            <span className="ml-2 text-xs text-muted-foreground">
                                                ({student.catholicName})
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex justify-center">
                                        <Checkbox
                                            checked={student.mass}
                                            onCheckedChange={(checked) =>
                                                handleCheckChange(student.id, 'mass', checked as boolean)
                                            }
                                        />
                                    </div>
                                    <div className="flex justify-center">
                                        <Checkbox
                                            checked={student.catechism}
                                            onCheckedChange={(checked) =>
                                                handleCheckChange(student.id, 'catechism', checked as boolean)
                                            }
                                        />
                                    </div>
                                    <div
                                        className={cn(
                                            'text-center text-lg',
                                            student.mass && student.catechism && 'text-green-600',
                                            (student.mass || student.catechism) &&
                                                !(student.mass && student.catechism) &&
                                                'text-yellow-600',
                                            !student.mass && !student.catechism && 'text-muted-foreground'
                                        )}
                                    >
                                        {getStatusSymbol(student.mass, student.catechism)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 저장 상태 인디케이터 */}
                        <div className="flex items-center justify-end gap-2 border-t pt-4 text-sm">
                            {saveStatus === 'saving' && (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    <span>저장 중...</span>
                                </>
                            )}
                            {saveStatus === 'saved' && (
                                <>
                                    <Check className="h-4 w-4 text-green-600" />
                                    <span className="text-green-600">저장 완료</span>
                                </>
                            )}
                            {saveStatus === 'error' && (
                                <>
                                    <X className="h-4 w-4 text-red-600" />
                                    <span className="text-red-600">저장 실패</span>
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
