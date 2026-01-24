import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from '~/components/ui/button';
export function Pagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1)
        return null;
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        }
        else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            }
            else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            }
            else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };
    return (_jsxs("nav", { className: "flex items-center justify-center gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => onPageChange(currentPage - 1), disabled: currentPage === 1, className: "min-w-20", children: "\uC774\uC804" }), getPageNumbers().map((page, index) => typeof page === 'number' ? (_jsx(Button, { variant: currentPage === page ? 'default' : 'outline', onClick: () => onPageChange(page), className: "min-w-14", children: page }, index)) : (_jsx("span", { className: "px-3 py-2 text-xl text-muted-foreground", children: page }, index))), _jsx(Button, { variant: "outline", onClick: () => onPageChange(currentPage + 1), disabled: currentPage === totalPages, className: "min-w-20", children: "\uB2E4\uC74C" })] }));
}
