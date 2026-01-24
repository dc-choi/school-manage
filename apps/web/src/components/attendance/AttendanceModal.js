import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { Check, Loader2, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Label } from '~/components/ui/label';
import { cn } from '~/lib/utils';
/**
 * 출석 상태 기호
 * ◎ = 출석 (미사+교리)
 * ○ = 미사만
 * △ = 교리만
 * - = 결석
 */
function getStatusSymbol(mass, catechism) {
    if (mass && catechism)
        return '◎';
    if (mass && !catechism)
        return '○';
    if (!mass && catechism)
        return '△';
    return '-';
}
/**
 * content 값을 미사/교리 체크로 변환
 * ◎ = 출석 (미사+교리)
 * ○ = 미사만
 * △ = 교리만
 * - = 결석
 */
function parseContent(content) {
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
function toContent(mass, catechism) {
    if (mass && catechism)
        return '◎';
    if (mass && !catechism)
        return '○';
    if (!mass && catechism)
        return '△';
    return '-';
}
export function AttendanceModal({ isOpen, onClose, date, holyday, students, isLoading = false, onSave, year, }) {
    const [studentAttendance, setStudentAttendance] = useState([]);
    const [saveStatus, setSaveStatus] = useState('idle');
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
                    mass,
                    catechism,
                };
            });
            setStudentAttendance(initialData);
            setSaveStatus('idle');
        }
    }, [isOpen, students]);
    // 체크박스 변경 핸들러 (자동 저장)
    const handleCheckChange = useCallback(async (studentId, field, checked) => {
        // 로컬 상태 업데이트
        setStudentAttendance((prev) => prev.map((s) => (s.id === studentId ? { ...s, [field]: checked } : s)));
        // 즉시 저장
        const student = studentAttendance.find((s) => s.id === studentId);
        if (!student)
            return;
        const newMass = field === 'mass' ? checked : student.mass;
        const newCatechism = field === 'catechism' ? checked : student.catechism;
        const content = toContent(newMass, newCatechism);
        setSaveStatus('saving');
        try {
            const data = {
                id: studentId,
                month,
                day,
                data: content,
            };
            // 결석('-')이면 삭제, 그 외(◎, ○, △)는 저장
            await onSave([data], content !== '-');
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
        catch (error) {
            console.error('저장 실패:', error);
            setSaveStatus('error');
        }
    }, [studentAttendance, month, day, onSave]);
    return (_jsx(Dialog, { open: isOpen, onOpenChange: (open) => !open && onClose(), children: _jsxs(DialogContent, { className: "max-h-[80vh] overflow-y-auto sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsxs(DialogTitle, { children: [year, "\uB144 ", month, "\uC6D4 ", day, "\uC77C ", dayOfWeek, "\uC694\uC77C"] }), holyday && _jsx("p", { className: "text-sm text-red-600", children: holyday })] }), isLoading ? (_jsxs("div", { className: "flex items-center justify-center py-8", children: [_jsx(Loader2, { className: "h-6 w-6 animate-spin" }), _jsx("span", { className: "ml-2", children: "\uB85C\uB529 \uC911..." })] })) : students.length === 0 ? (_jsx("p", { className: "py-8 text-center text-muted-foreground", children: "\uD559\uC0DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-[1fr_60px_60px_50px] gap-2 border-b pb-2 text-sm font-medium", children: [_jsx("div", { children: "\uD559\uC0DD\uBA85" }), _jsx("div", { className: "text-center", children: "\uBBF8\uC0AC" }), _jsx("div", { className: "text-center", children: "\uAD50\uB9AC" }), _jsx("div", { className: "text-center", children: "\uC0C1\uD0DC" })] }), studentAttendance.map((student) => (_jsxs("div", { className: "grid grid-cols-[1fr_60px_60px_50px] items-center gap-2", children: [_jsx(Label, { className: "font-normal", children: student.societyName }), _jsx("div", { className: "flex justify-center", children: _jsx(Checkbox, { checked: student.mass, onCheckedChange: (checked) => handleCheckChange(student.id, 'mass', checked) }) }), _jsx("div", { className: "flex justify-center", children: _jsx(Checkbox, { checked: student.catechism, onCheckedChange: (checked) => handleCheckChange(student.id, 'catechism', checked) }) }), _jsx("div", { className: cn('text-center text-lg', student.mass && student.catechism && 'text-green-600', (student.mass || student.catechism) &&
                                        !(student.mass && student.catechism) &&
                                        'text-yellow-600', !student.mass && !student.catechism && 'text-muted-foreground'), children: getStatusSymbol(student.mass, student.catechism) })] }, student.id))), _jsxs("div", { className: "flex items-center justify-end gap-2 border-t pt-4 text-sm", children: [saveStatus === 'saving' && (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), _jsx("span", { children: "\uC800\uC7A5 \uC911..." })] })), saveStatus === 'saved' && (_jsxs(_Fragment, { children: [_jsx(Check, { className: "h-4 w-4 text-green-600" }), _jsx("span", { className: "text-green-600", children: "\uC800\uC7A5 \uC644\uB8CC" })] })), saveStatus === 'error' && (_jsxs(_Fragment, { children: [_jsx(X, { className: "h-4 w-4 text-red-600" }), _jsx("span", { className: "text-red-600", children: "\uC800\uC7A5 \uC2E4\uD328" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setSaveStatus('idle'), children: "\uC7AC\uC2DC\uB3C4" })] }))] })] }))] }) }));
}
