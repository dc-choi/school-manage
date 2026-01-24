import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
export function GroupForm({ initialData, onSubmit, onCancel, isSubmitting, submitLabel }) {
    const [name, setName] = useState(initialData?.name ?? '');
    const [error, setError] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('그룹명을 입력해주세요.');
            return;
        }
        try {
            await onSubmit({ name: name.trim() });
        }
        catch (err) {
            setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
        }
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: submitLabel === '추가' ? '새 그룹' : '그룹 수정' }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "rounded-md border border-destructive/50 bg-destructive/10 p-3 text-base text-destructive", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", className: "text-lg", children: "\uADF8\uB8F9\uBA85" }), _jsx(Input, { id: "name", className: "h-12 text-lg", value: name, onChange: (e) => setName(e.target.value), placeholder: "\uADF8\uB8F9\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694", disabled: isSubmitting })] }), _jsxs("div", { className: "flex justify-end gap-2", children: [_jsx(Button, { type: "button", variant: "outline", className: "min-w-24", onClick: onCancel, disabled: isSubmitting, children: "\uCDE8\uC18C" }), _jsx(Button, { type: "submit", className: "min-w-24", disabled: isSubmitting, children: isSubmitting ? '저장 중...' : submitLabel })] })] }) })] }));
}
