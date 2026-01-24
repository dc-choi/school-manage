import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Select = forwardRef(function Select({ label, error, options, placeholder, className = '', id, ...props }, ref) {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { htmlFor: selectId, className: "mb-1 block text-sm font-medium text-gray-700", children: label })), _jsxs("select", { ref: ref, id: selectId, className: `
                    w-full rounded-md border px-3 py-2 text-sm
                    transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0
                    ${error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'}
                    disabled:cursor-not-allowed disabled:bg-gray-100
                    ${className}
                `, ...props, children: [placeholder && (_jsx("option", { value: "", disabled: true, children: placeholder })), options.map((option) => (_jsx("option", { value: option.value, children: option.label }, option.value)))] }), error && _jsx("p", { className: "mt-1 text-sm text-red-500", children: error })] }));
});
