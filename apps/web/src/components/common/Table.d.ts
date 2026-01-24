import type { ReactNode } from 'react';
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
export declare function Table<T>({ columns, data, keyExtractor, isLoading, emptyMessage, onRowClick, }: TableProps<T>): import("react/jsx-runtime").JSX.Element;
export {};
