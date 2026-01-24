import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from '~/components/ui/card';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';
export function Table({ columns, data, keyExtractor, isLoading = false, emptyMessage = '데이터가 없습니다.', onRowClick, }) {
    if (isLoading) {
        return (_jsx(Card, { className: "flex h-40 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" }) }));
    }
    return (_jsx(Card, { children: _jsxs(UITable, { children: [_jsx(TableHeader, { children: _jsx(TableRow, { children: columns.map((column) => (_jsx(TableHead, { className: column.className, children: column.header }, column.key))) }) }), _jsx(TableBody, { children: data.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: columns.length, className: "h-24 text-center text-muted-foreground", children: emptyMessage }) })) : (data.map((row) => (_jsx(TableRow, { onClick: () => onRowClick?.(row), className: onRowClick ? 'cursor-pointer' : '', children: columns.map((column) => (_jsx(TableCell, { className: column.className, children: column.render
                                ? column.render(row)
                                : (row[column.key]?.toString() ?? '-') }, column.key))) }, keyExtractor(row))))) })] }) }));
}
