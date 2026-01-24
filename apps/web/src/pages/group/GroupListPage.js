import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';
import { useGroups } from '~/features/group';
export function GroupListPage() {
    const navigate = useNavigate();
    const { groups, isLoading, bulkDelete, isBulkDeleting } = useGroups();
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
    const handleBulkDelete = async () => {
        if (selectedIds.size > 0) {
            await bulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
            setShowBulkDeleteDialog(false);
        }
    };
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(new Set(groups.map((g) => g.id)));
        }
        else {
            setSelectedIds(new Set());
        }
    };
    const handleSelectOne = (id, checked) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        }
        else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };
    const isAllSelected = groups.length > 0 && selectedIds.size === groups.length;
    const isSomeSelected = selectedIds.size > 0 && selectedIds.size < groups.length;
    const selectedGroups = groups.filter((g) => selectedIds.has(g.id));
    if (isLoading) {
        return (_jsx(MainLayout, { title: "\uADF8\uB8F9 \uBAA9\uB85D", children: _jsx(Card, { className: "flex h-40 items-center justify-center", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" }) }) }));
    }
    return (_jsxs(MainLayout, { title: "\uADF8\uB8F9 \uBAA9\uB85D", children: [_jsxs("div", { className: "mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between", children: [_jsx("div", { className: "flex gap-2", children: selectedIds.size > 0 && (_jsxs(Button, { variant: "destructive", onClick: () => setShowBulkDeleteDialog(true), disabled: isBulkDeleting, children: ["\uC120\uD0DD \uC0AD\uC81C (", selectedIds.size, ")"] })) }), _jsx(Button, { onClick: () => navigate('/groups/new'), className: "w-full sm:w-auto", children: "\uADF8\uB8F9 \uCD94\uAC00" })] }), _jsx(Card, { children: _jsxs(UITable, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-12", children: _jsx(Checkbox, { checked: isAllSelected, ref: (el) => {
                                                if (el)
                                                    el.indeterminate = isSomeSelected;
                                            }, onCheckedChange: handleSelectAll, "aria-label": "\uC804\uCCB4 \uC120\uD0DD" }) }), _jsx(TableHead, { children: "\uADF8\uB8F9\uBA85" }), _jsx(TableHead, { className: "w-24 text-center", children: "\uD559\uC0DD \uC218" })] }) }), _jsx(TableBody, { children: groups.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 3, className: "h-24 text-center text-muted-foreground", children: "\uB4F1\uB85D\uB41C \uADF8\uB8F9\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." }) })) : (groups.map((row) => (_jsxs(TableRow, { onClick: () => navigate(`/groups/${row.id}`), className: "cursor-pointer hover:bg-muted/50", "data-selected": selectedIds.has(row.id) ? 'true' : undefined, children: [_jsx(TableCell, { onClick: (e) => e.stopPropagation(), children: _jsx(Checkbox, { checked: selectedIds.has(row.id), onCheckedChange: (checked) => handleSelectOne(row.id, checked), "aria-label": `${row.name} 선택` }) }), _jsx(TableCell, { children: row.name }), _jsxs(TableCell, { className: "text-center", children: [row.studentCount, "\uBA85"] })] }, row.id)))) })] }) }), _jsx(AlertDialog, { open: showBulkDeleteDialog, onOpenChange: setShowBulkDeleteDialog, children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\uADF8\uB8F9 \uC77C\uAD04 \uC0AD\uC81C" }), _jsxs(AlertDialogDescription, { children: ["\uB2E4\uC74C ", selectedIds.size, "\uAC1C\uC758 \uADF8\uB8F9\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uC774 \uC791\uC5C5\uC740 \uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.", _jsx("ul", { className: "mt-2 list-inside list-disc text-sm", children: selectedGroups.map((g) => (_jsx("li", { children: g.name }, g.id))) })] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "\uCDE8\uC18C" }), _jsx(AlertDialogAction, { onClick: handleBulkDelete, disabled: isBulkDeleting, children: isBulkDeleting ? '삭제 중...' : `${selectedIds.size}개 삭제` })] })] }) })] }));
}
