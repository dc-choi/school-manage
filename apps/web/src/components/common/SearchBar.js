import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function SearchBar({ placeholder = '검색...', onSearch, initialValue = '' }) {
    const [query, setQuery] = useState(initialValue);
    const handleChange = (e) => {
        setQuery(e.target.value);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(query.trim());
    };
    return (_jsxs("form", { onSubmit: handleSubmit, className: "flex w-full max-w-md", children: [_jsx("input", { type: "text", value: query, onChange: handleChange, placeholder: placeholder, className: "flex-1 rounded-l-md border border-r-0 border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" }), _jsx("button", { type: "submit", className: "rounded-r-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2", children: "\uAC80\uC0C9" })] }));
}
