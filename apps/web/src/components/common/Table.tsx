import type { ReactNode } from 'react';
import { Card } from '~/components/ui/card';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';

interface Column<T> {
    key: string;
    header: ReactNode;
    render?: (row: T) => ReactNode;
    className?: string;
}

interface TableProps<T> {
    columns: Column<T>[];
    data: T[];
    keyExtractor: (row: T) => string | number;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (row: T) => void;
}

export function Table<T>({
    columns,
    data,
    keyExtractor,
    isLoading = false,
    emptyMessage = '데이터가 없습니다.',
    onRowClick,
}: TableProps<T>) {
    if (isLoading) {
        return (
            <Card className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </Card>
        );
    }

    return (
        <Card className="overflow-x-auto">
            <UITable>
                <TableHeader>
                    <TableRow>
                        {columns.map((column) => (
                            <TableHead key={column.key} className={column.className}>
                                {column.header}
                            </TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                                {emptyMessage}
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row) => (
                            <TableRow
                                key={keyExtractor(row)}
                                onClick={() => onRowClick?.(row)}
                                className={onRowClick ? 'cursor-pointer' : ''}
                            >
                                {columns.map((column) => (
                                    <TableCell key={column.key} className={column.className}>
                                        {column.render
                                            ? column.render(row)
                                            : ((row as Record<string, unknown>)[column.key]?.toString() ?? '-')}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </UITable>
        </Card>
    );
}
