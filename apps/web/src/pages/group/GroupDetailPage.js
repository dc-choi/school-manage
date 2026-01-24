import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Table } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useGroups } from '~/features/group';
function formatPhoneNumber(contact) {
    if (!contact)
        return '-';
    // 숫자로 저장되면서 앞의 0이 사라진 경우 (1012341234 → 01012341234)
    const str = String(contact).padStart(11, '0');
    return `${str.slice(0, 3)}-${str.slice(3, 7)}-${str.slice(7)}`;
}
export function GroupDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getQuery, update, isUpdating } = useGroups();
    const { data: group, isLoading, error } = getQuery(id ?? '');
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    // 그룹 데이터가 로드되면 editedName 초기화
    useEffect(() => {
        if (group?.name) {
            setEditedName(group.name);
        }
    }, [group?.name]);
    const handleSave = async () => {
        if (!id || !editedName.trim())
            return;
        try {
            await update({ id, name: editedName.trim() });
            setIsEditing(false);
        }
        catch (e) {
            console.error('Failed to update group:', e);
        }
    };
    const handleCancel = () => {
        setEditedName(group?.name ?? '');
        setIsEditing(false);
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        }
        else if (e.key === 'Escape') {
            handleCancel();
        }
    };
    if (error) {
        return (_jsx(MainLayout, { title: "\uADF8\uB8F9 \uC0C1\uC138", children: _jsx(Card, { children: _jsxs(CardContent, { className: "pt-6", children: [_jsx("p", { className: "text-center text-destructive", children: "\uADF8\uB8F9\uC744 \uBD88\uB7EC\uC624\uB294\uB370 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4." }), _jsx("div", { className: "mt-4 flex justify-center", children: _jsx(Button, { size: "lg", onClick: () => navigate('/groups'), children: "\uBAA9\uB85D\uC73C\uB85C" }) })] }) }) }));
    }
    const columns = [
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        {
            key: 'age',
            header: '나이',
            render: (row) => (row.age ? `${row.age}세` : '-'),
        },
        {
            key: 'contact',
            header: '연락처',
            render: (row) => formatPhoneNumber(row.contact),
        },
    ];
    return (_jsx(MainLayout, { title: "\uADF8\uB8F9 \uC0C1\uC138", children: _jsxs("div", { className: "space-y-6", children: [_jsx(Card, { children: _jsx(CardHeader, { children: _jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsx("div", { className: "flex-1", children: isEditing ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { value: editedName, onChange: (e) => setEditedName(e.target.value), onKeyDown: handleKeyDown, className: "text-2xl font-bold", autoFocus: true }), _jsx(Button, { onClick: handleSave, disabled: isUpdating || !editedName.trim(), className: "min-w-24", children: isUpdating ? '저장 중...' : '저장' }), _jsx(Button, { variant: "outline", onClick: handleCancel, className: "min-w-24", children: "\uCDE8\uC18C" })] })) : (_jsxs("div", { className: "cursor-pointer rounded-md p-1 hover:bg-muted/50", onClick: () => group && setIsEditing(true), title: "\uD074\uB9AD\uD558\uC5EC \uC218\uC815", children: [_jsx(CardTitle, { className: "text-2xl", children: isLoading ? '로딩 중...' : group?.name }), _jsx(CardDescription, { children: "\uADF8\uB8F9 \uC815\uBCF4 (\uD074\uB9AD\uD558\uC5EC \uC218\uC815)" })] })) }), _jsx("div", { className: "flex gap-3", children: _jsx(Button, { variant: "outline", size: "lg", className: "flex-1 sm:flex-none", onClick: () => navigate('/groups'), children: "\uBAA9\uB85D\uC73C\uB85C" }) })] }) }) }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "\uD559\uC0DD \uBAA9\uB85D" }), _jsx(CardDescription, { children: isLoading
                                        ? '로딩 중...'
                                        : `총 ${group?.students.length ?? 0}명의 학생이 있습니다.` })] }), _jsx(CardContent, { children: _jsx(Table, { columns: columns, data: group?.students ?? [], keyExtractor: (row) => row.id, isLoading: isLoading, emptyMessage: "\uB4F1\uB85D\uB41C \uD559\uC0DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." }) })] })] }) }));
}
