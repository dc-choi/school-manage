import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '~/components/ui/button';
export function CalendarHeader({ year, month, onPrevMonth, onNextMonth }) {
    return (_jsxs("div", { className: "flex items-center justify-center gap-6", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: onPrevMonth, "aria-label": "\uC774\uC804 \uC6D4", className: "h-10 w-10 rounded-full", children: _jsx(ChevronLeft, { className: "h-5 w-5" }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Calendar, { className: "h-6 w-6 text-primary" }), _jsxs("h2", { className: "text-2xl font-bold tracking-tight", children: [year, "\uB144 ", month, "\uC6D4"] })] }), _jsx(Button, { variant: "outline", size: "icon", onClick: onNextMonth, "aria-label": "\uB2E4\uC74C \uC6D4", className: "h-10 w-10 rounded-full", children: _jsx(ChevronRight, { className: "h-5 w-5" }) })] }));
}
