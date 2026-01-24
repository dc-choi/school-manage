import { jsx as _jsx } from "react/jsx-runtime";
export function LoadingSpinner({ size = 'md' }) {
    const sizeClass = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    }[size];
    return (_jsx("div", { className: "flex items-center justify-center p-4", children: _jsx("div", { className: `${sizeClass} rounded-full border-2 border-muted border-t-primary animate-spin` }) }));
}
