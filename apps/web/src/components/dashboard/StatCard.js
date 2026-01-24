import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';
export function StatCard({ title, value, suffix = '', description, isLoading, error }) {
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm font-medium text-muted-foreground", children: title }) }), _jsx(CardContent, { children: isLoading ? (_jsx(LoadingSpinner, {})) : error ? (_jsx("p", { className: "text-sm text-destructive", children: "\uB370\uC774\uD130 \uB85C\uB4DC \uC2E4\uD328" })) : (_jsxs(_Fragment, { children: [_jsx("p", { className: "text-2xl font-bold", children: value !== undefined ? `${value}${suffix}` : '-' }), description && _jsx("p", { className: "text-xs text-muted-foreground", children: description })] })) })] }));
}
