import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
export function StudentForm({ initialData, groups, onSubmit, onCancel, isSubmitting, submitLabel }) {
    const [formData, setFormData] = useState({
        societyName: initialData?.societyName ?? '',
        catholicName: initialData?.catholicName ?? '',
        gender: initialData?.gender,
        age: initialData?.age,
        contact: initialData?.contact,
        description: initialData?.description ?? '',
        groupId: initialData?.groupId ?? '',
        baptizedAt: initialData?.baptizedAt ?? '',
    });
    const [errors, setErrors] = useState({});
    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: '' }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const newErrors = {};
        if (!formData.societyName.trim()) {
            newErrors.societyName = '이름을 입력해주세요.';
        }
        if (!formData.groupId) {
            newErrors.groupId = '그룹을 선택해주세요.';
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        try {
            await onSubmit({
                ...formData,
                societyName: formData.societyName.trim(),
                catholicName: formData.catholicName?.trim() || undefined,
                description: formData.description?.trim() || undefined,
                baptizedAt: formData.baptizedAt?.trim() || undefined,
            });
        }
        catch (err) {
            setErrors({ submit: err instanceof Error ? err.message : '오류가 발생했습니다.' });
        }
    };
    return (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { children: submitLabel === '추가' ? '새 학생' : '학생 수정' }) }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [errors.submit && (_jsx("div", { className: "rounded-md border border-destructive/50 bg-destructive/10 p-3 text-base text-destructive", children: errors.submit })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "societyName", className: "text-lg", children: "\uC774\uB984 (\uC138\uB840\uBA85)" }), _jsx(Input, { id: "societyName", className: "h-12 text-lg", value: formData.societyName, onChange: (e) => handleChange('societyName', e.target.value), placeholder: "\uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694", disabled: isSubmitting }), errors.societyName && _jsx("p", { className: "text-base text-destructive", children: errors.societyName })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "catholicName", className: "text-lg", children: "\uC138\uB840\uBA85 (\uC120\uD0DD)" }), _jsx(Input, { id: "catholicName", className: "h-12 text-lg", value: formData.catholicName ?? '', onChange: (e) => handleChange('catholicName', e.target.value), placeholder: "\uC138\uB840\uBA85\uC744 \uC785\uB825\uD558\uC138\uC694", disabled: isSubmitting })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "groupId", className: "text-lg", children: "\uADF8\uB8F9" }), _jsxs(Select, { value: formData.groupId, onValueChange: (value) => handleChange('groupId', value), disabled: isSubmitting, children: [_jsx(SelectTrigger, { id: "groupId", className: "h-12 text-lg", children: _jsx(SelectValue, { placeholder: "\uADF8\uB8F9\uC744 \uC120\uD0DD\uD558\uC138\uC694" }) }), _jsx(SelectContent, { children: groups.map((g) => (_jsx(SelectItem, { value: g.id, className: "text-lg", children: g.name }, g.id))) })] }), errors.groupId && _jsx("p", { className: "text-base text-destructive", children: errors.groupId })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "gender", className: "text-lg", children: "\uC131\uBCC4 (\uC120\uD0DD)" }), _jsxs(Select, { value: formData.gender ?? '', onValueChange: (value) => handleChange('gender', value), disabled: isSubmitting, children: [_jsx(SelectTrigger, { id: "gender", className: "h-12 text-lg", children: _jsx(SelectValue, { placeholder: "\uC131\uBCC4\uC744 \uC120\uD0DD\uD558\uC138\uC694" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "M", className: "text-lg", children: "\uB0A8" }), _jsx(SelectItem, { value: "F", className: "text-lg", children: "\uC5EC" })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "age", className: "text-lg", children: "\uB098\uC774 (\uC120\uD0DD)" }), _jsx(Input, { id: "age", type: "number", className: "h-12 text-lg", value: formData.age ?? '', onChange: (e) => handleChange('age', e.target.value ? parseInt(e.target.value, 10) : undefined), placeholder: "\uB098\uC774\uB97C \uC785\uB825\uD558\uC138\uC694", disabled: isSubmitting })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "contact", className: "text-lg", children: "\uC5F0\uB77D\uCC98 (\uC120\uD0DD)" }), _jsx(Input, { id: "contact", type: "number", className: "h-12 text-lg", value: formData.contact ?? '', onChange: (e) => handleChange('contact', e.target.value ? parseInt(e.target.value, 10) : undefined), placeholder: "\uC5F0\uB77D\uCC98\uB97C \uC785\uB825\uD558\uC138\uC694 (\uC22B\uC790\uB9CC)", disabled: isSubmitting })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "baptizedAt", className: "text-lg", children: "\uC138\uB840\uC77C (\uC120\uD0DD)" }), _jsx(Input, { id: "baptizedAt", className: "h-12 text-lg", value: formData.baptizedAt ?? '', onChange: (e) => handleChange('baptizedAt', e.target.value), placeholder: "YYYY-MM-DD", disabled: isSubmitting })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "description", className: "text-lg", children: "\uBE44\uACE0 (\uC120\uD0DD)" }), _jsx(Input, { id: "description", className: "h-12 text-lg", value: formData.description ?? '', onChange: (e) => handleChange('description', e.target.value), placeholder: "\uBE44\uACE0\uB97C \uC785\uB825\uD558\uC138\uC694", disabled: isSubmitting })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", className: "min-w-24", onClick: onCancel, disabled: isSubmitting, children: "\uCDE8\uC18C" }), _jsx(Button, { type: "submit", className: "min-w-24", disabled: isSubmitting, children: isSubmitting ? '저장 중...' : submitLabel })] })] }) })] }));
}
