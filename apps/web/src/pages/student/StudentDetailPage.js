import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatDateKR } from '@school/utils';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useGroups } from '~/features/group';
import { useStudent, useStudents } from '~/features/student/hooks/useStudents';
function EditableField({ label, value, onSave, type = 'text', disabled, placeholder }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    useEffect(() => {
        setEditValue(value);
    }, [value]);
    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };
    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter')
            handleSave();
        if (e.key === 'Escape')
            handleCancel();
    };
    return (_jsxs("div", { className: "flex items-center border-b py-4 last:border-b-0", children: [_jsx("dt", { className: "w-32 shrink-0 text-xl font-medium text-muted-foreground", children: label }), _jsx("dd", { className: "flex-1 text-xl", children: isEditing ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { value: editValue, onChange: (e) => setEditValue(e.target.value), onKeyDown: handleKeyDown, type: type, placeholder: placeholder, autoFocus: true }), _jsx(Button, { onClick: handleSave, className: "min-w-24", children: "\uC800\uC7A5" }), _jsx(Button, { variant: "outline", onClick: handleCancel, className: "min-w-24", children: "\uCDE8\uC18C" })] })) : (_jsx("span", { className: `rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`, onClick: () => !disabled && setIsEditing(true), title: disabled ? undefined : '클릭하여 수정', children: value || '-' })) })] }));
}
function ContactField({ label, value, onSave, disabled }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    // 숫자로 저장된 값을 11자리 문자열로 변환 (앞에 0 붙이기)
    const displayValue = value ? String(value).padStart(11, '0') : '';
    const formattedValue = displayValue
        ? `${displayValue.slice(0, 3)}-${displayValue.slice(3, 7)}-${displayValue.slice(7)}`
        : '-';
    useEffect(() => {
        setEditValue(displayValue);
    }, [displayValue]);
    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };
    const handleCancel = () => {
        setEditValue(displayValue);
        setIsEditing(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter')
            handleSave();
        if (e.key === 'Escape')
            handleCancel();
    };
    return (_jsxs("div", { className: "flex items-center border-b py-4 last:border-b-0", children: [_jsx("dt", { className: "w-32 shrink-0 text-xl font-medium text-muted-foreground", children: label }), _jsx("dd", { className: "flex-1 text-xl", children: isEditing ? (_jsxs("div", { className: "flex flex-col gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { value: editValue, onChange: (e) => setEditValue(e.target.value.replace(/[^0-9]/g, '')), onKeyDown: handleKeyDown, placeholder: "01012345678", autoFocus: true }), _jsx(Button, { onClick: handleSave, className: "min-w-24", children: "\uC800\uC7A5" }), _jsx(Button, { variant: "outline", onClick: handleCancel, className: "min-w-24", children: "\uCDE8\uC18C" })] }), _jsx("p", { className: "text-base text-muted-foreground", children: "- \uC5C6\uC774 \uC22B\uC790\uB9CC \uC785\uB825\uD558\uC138\uC694" })] })) : (_jsx("span", { className: `rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`, onClick: () => !disabled && setIsEditing(true), title: disabled ? undefined : '클릭하여 수정', children: formattedValue })) })] }));
}
function GenderSelectField({ label, value, onSave, disabled }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value ?? '');
    useEffect(() => {
        setEditValue(value ?? '');
    }, [value]);
    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };
    const handleCancel = () => {
        setEditValue(value ?? '');
        setIsEditing(false);
    };
    const displayValue = value === 'M' ? '남' : value === 'F' ? '여' : '-';
    return (_jsxs("div", { className: "flex items-center border-b py-4 last:border-b-0", children: [_jsx("dt", { className: "w-32 shrink-0 text-xl font-medium text-muted-foreground", children: label }), _jsx("dd", { className: "flex-1 text-xl", children: isEditing ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Select, { value: editValue, onValueChange: setEditValue, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, { placeholder: "\uC131\uBCC4 \uC120\uD0DD" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "M", children: "\uB0A8" }), _jsx(SelectItem, { value: "F", children: "\uC5EC" })] })] }), _jsx(Button, { onClick: handleSave, className: "min-w-24", children: "\uC800\uC7A5" }), _jsx(Button, { variant: "outline", onClick: handleCancel, className: "min-w-24", children: "\uCDE8\uC18C" })] })) : (_jsx("span", { className: `rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`, onClick: () => !disabled && setIsEditing(true), title: disabled ? undefined : '클릭하여 수정', children: displayValue })) })] }));
}
function GroupSelectField({ label, value, groupName, groups, onSave, disabled }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(value);
    useEffect(() => {
        setEditValue(value);
    }, [value]);
    const handleSave = () => {
        onSave(editValue);
        setIsEditing(false);
    };
    const handleCancel = () => {
        setEditValue(value);
        setIsEditing(false);
    };
    return (_jsxs("div", { className: "flex items-center border-b py-4 last:border-b-0", children: [_jsx("dt", { className: "w-32 shrink-0 text-xl font-medium text-muted-foreground", children: label }), _jsx("dd", { className: "flex-1 text-xl", children: isEditing ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Select, { value: editValue, onValueChange: setEditValue, children: [_jsx(SelectTrigger, { className: "w-48", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: groups.map((g) => (_jsx(SelectItem, { value: g.id, children: g.name }, g.id))) })] }), _jsx(Button, { onClick: handleSave, className: "min-w-24", children: "\uC800\uC7A5" }), _jsx(Button, { variant: "outline", onClick: handleCancel, className: "min-w-24", children: "\uCDE8\uC18C" })] })) : (_jsx("span", { className: `rounded px-2 py-1 ${disabled ? '' : 'cursor-pointer hover:bg-muted/50'}`, onClick: () => !disabled && setIsEditing(true), title: disabled ? undefined : '클릭하여 수정', children: groupName || '-' })) })] }));
}
export function StudentDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: student, isLoading, error } = useStudent(id ?? '');
    const { update, isUpdating } = useStudents();
    const { groups } = useGroups();
    const isDeleted = !!student?.deletedAt;
    const handleUpdate = async (field, value) => {
        if (!id || !student)
            return;
        try {
            await update({
                id,
                societyName: field === 'societyName' ? value : student.societyName,
                catholicName: field === 'catholicName' ? value || undefined : student.catholicName,
                gender: field === 'gender' ? value : student.gender,
                age: field === 'age' ? (value ? parseInt(value) : undefined) : student.age,
                contact: field === 'contact' ? (value ? parseInt(value) : undefined) : student.contact,
                groupId: field === 'groupId' ? value : student.groupId,
                baptizedAt: field === 'baptizedAt' ? value || undefined : student.baptizedAt,
                description: field === 'description' ? value || undefined : student.description,
            });
        }
        catch (e) {
            console.error('Failed to update student:', e);
        }
    };
    // 그룹 이름 찾기
    const groupName = groups.find((g) => g.id === student?.groupId)?.name ?? student?.groupId ?? '';
    if (error) {
        return (_jsx(MainLayout, { title: "\uD559\uC0DD \uC0C1\uC138", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "text-center text-xl text-destructive", children: "\uD559\uC0DD \uC815\uBCF4\uB97C \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." }), _jsx("div", { className: "mt-4 flex justify-center", children: _jsx(Button, { size: "lg", onClick: () => navigate('/students'), children: "\uBAA9\uB85D\uC73C\uB85C" }) })] }) }) }));
    }
    return (_jsx(MainLayout, { title: "\uD559\uC0DD \uC0C1\uC138", children: _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsx(CardHeader, { children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { children: _jsxs(CardTitle, { className: "text-2xl", children: [isLoading ? '로딩 중...' : student?.societyName, student?.catholicName && (_jsxs("span", { className: "ml-2 text-lg font-normal text-muted-foreground", children: ["(", student.catholicName, ")"] }))] }) }), isDeleted && (_jsx(Badge, { variant: "destructive", className: "ml-2", children: "\uC0AD\uC81C\uB428" })), isUpdating && (_jsx(Badge, { variant: "outline", className: "ml-2", children: "\uC800\uC7A5 \uC911..." }))] }), _jsx(Button, { variant: "outline", size: "lg", className: "flex-1 sm:flex-none", onClick: () => navigate('/students'), children: "\uBAA9\uB85D\uC73C\uB85C" })] }) }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { className: "text-xl", children: "\uAE30\uBCF8 \uC815\uBCF4" }), !isDeleted && (_jsx("p", { className: "text-base text-muted-foreground", children: "\uAC01 \uD56D\uBAA9\uC744 \uD074\uB9AD\uD558\uC5EC \uC218\uC815\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." }))] }), _jsx(CardContent, { children: isLoading ? (_jsx("p", { className: "text-center text-xl text-muted-foreground", children: "\uB85C\uB529 \uC911..." })) : (_jsxs("dl", { className: "space-y-0", children: [_jsx(EditableField, { label: "\uC774\uB984", value: student?.societyName ?? '', onSave: (v) => handleUpdate('societyName', v), disabled: isDeleted }), _jsx(EditableField, { label: "\uC138\uB840\uBA85", value: student?.catholicName ?? '', onSave: (v) => handleUpdate('catholicName', v), disabled: isDeleted }), _jsx(GenderSelectField, { label: "\uC131\uBCC4", value: student?.gender, onSave: (v) => handleUpdate('gender', v), disabled: isDeleted }), _jsx(EditableField, { label: "\uB098\uC774", value: student?.age?.toString() ?? '', onSave: (v) => handleUpdate('age', v), type: "number", disabled: isDeleted }), _jsx(ContactField, { label: "\uC5F0\uB77D\uCC98", value: student?.contact, onSave: (v) => handleUpdate('contact', v), disabled: isDeleted }), _jsx(GroupSelectField, { label: "\uADF8\uB8F9", value: student?.groupId ?? '', groupName: groupName, groups: groups, onSave: (v) => handleUpdate('groupId', v), disabled: isDeleted }), _jsx(EditableField, { label: "\uC138\uB840\uC77C", value: student?.baptizedAt ?? '', onSave: (v) => handleUpdate('baptizedAt', v), disabled: isDeleted }), _jsx(EditableField, { label: "\uBE44\uACE0", value: student?.description ?? '', onSave: (v) => handleUpdate('description', v), disabled: isDeleted }), isDeleted && (_jsxs("div", { className: "flex items-center border-b py-4 last:border-b-0", children: [_jsx("dt", { className: "w-32 shrink-0 text-xl font-medium text-muted-foreground", children: "\uC0AD\uC81C\uC77C" }), _jsx("dd", { className: "text-xl text-destructive", children: formatDateKR(student.deletedAt) })] }))] })) })] })] }) }));
}
