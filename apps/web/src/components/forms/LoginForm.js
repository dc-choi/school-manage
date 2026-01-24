import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
export function LoginForm({ onSubmit, error, isLoading }) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const handleSubmit = async (e) => {
        e.preventDefault();
        await onSubmit(name, password);
    };
    return (_jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "text-center", children: [_jsx(CardTitle, { className: "text-2xl", children: "\uB85C\uADF8\uC778" }), _jsx(CardDescription, { children: "\uC8FC\uC77C\uD559\uAD50 \uAD00\uB9AC \uC2DC\uC2A4\uD15C" })] }), _jsx(CardContent, { children: _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [error && (_jsx("div", { className: "rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive", children: error })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "name", children: "\uC774\uB984" }), _jsx(Input, { id: "name", type: "text", value: name, onChange: (e) => setName(e.target.value), required: true, placeholder: "\uC774\uB984\uC744 \uC785\uB825\uD558\uC138\uC694" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "\uBE44\uBC00\uBC88\uD638" }), _jsx(Input, { id: "password", type: "password", value: password, onChange: (e) => setPassword(e.target.value), required: true, placeholder: "\uBE44\uBC00\uBC88\uD638\uB97C \uC785\uB825\uD558\uC138\uC694" })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? '로그인 중...' : '로그인' })] }) })] }));
}
