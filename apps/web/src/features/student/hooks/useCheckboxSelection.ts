import { useState } from 'react';

export const useCheckboxSelection = <T extends { id: string }>(items: T[]) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const selectAll = (checked: boolean) => {
        setSelectedIds(checked ? new Set(items.map((item) => item.id)) : new Set());
    };

    const selectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    const clearSelection = () => setSelectedIds(new Set());

    const isAllSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));
    const isSomeSelected = selectedIds.size > 0;

    return { selectedIds, selectAll, selectOne, clearSelection, isAllSelected, isSomeSelected };
};
