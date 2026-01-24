import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { formatContact } from '@school/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Table } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useStudents } from '~/features/student';
export function StudentListPage() {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [searchOptionInput, setSearchOptionInput] = useState('all');
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [bulkAction, setBulkAction] = useState(null);
    const [deletedModalOpen, setDeletedModalOpen] = useState(false);
    const [deletedSelectedIds, setDeletedSelectedIds] = useState(new Set());
    const [graduatedModalOpen, setGraduatedModalOpen] = useState(false);
    const [graduatedSelectedIds, setGraduatedSelectedIds] = useState(new Set());
    // 재학생 목록
    const { students, totalPage, currentPage, isLoading, setPage, search, bulkDelete, isBulkDeleting, graduate, isGraduating, } = useStudents({ initialDeleteFilter: 'active', initialGraduatedFilter: 'active' });
    // 삭제된 학생 목록
    const { students: deletedStudents, isLoading: isDeletedLoading, restore, isRestoring, } = useStudents({ initialDeleteFilter: 'deleted' });
    // 졸업생 목록
    const { students: graduatedStudents, isLoading: isGraduatedLoading, cancelGraduation, isCancellingGraduation, } = useStudents({ initialDeleteFilter: 'active', initialGraduatedFilter: 'graduated' });
    const handleSearch = () => {
        search(searchOptionInput, searchInput);
        setSelectedIds(new Set());
    };
    const handleBulkDelete = async () => {
        if (selectedIds.size > 0) {
            await bulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
            setBulkAction(null);
        }
    };
    const handleRestore = async () => {
        if (deletedSelectedIds.size > 0) {
            await restore(Array.from(deletedSelectedIds));
            setDeletedSelectedIds(new Set());
            setBulkAction(null);
        }
    };
    const handleGraduate = async () => {
        if (selectedIds.size > 0) {
            await graduate(Array.from(selectedIds));
            setSelectedIds(new Set());
            setBulkAction(null);
        }
    };
    const handleCancelGraduation = async () => {
        if (graduatedSelectedIds.size > 0) {
            await cancelGraduation(Array.from(graduatedSelectedIds));
            setGraduatedSelectedIds(new Set());
            setBulkAction(null);
        }
    };
    const handleGraduatedSelectAll = (checked) => {
        if (checked) {
            setGraduatedSelectedIds(new Set(graduatedStudents.map((s) => s.id)));
        }
        else {
            setGraduatedSelectedIds(new Set());
        }
    };
    const handleGraduatedSelectOne = (id, checked) => {
        const newSet = new Set(graduatedSelectedIds);
        if (checked) {
            newSet.add(id);
        }
        else {
            newSet.delete(id);
        }
        setGraduatedSelectedIds(newSet);
    };
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedIds(new Set(students.map((s) => s.id)));
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
    const handleDeletedSelectAll = (checked) => {
        if (checked) {
            setDeletedSelectedIds(new Set(deletedStudents.map((s) => s.id)));
        }
        else {
            setDeletedSelectedIds(new Set());
        }
    };
    const handleDeletedSelectOne = (id, checked) => {
        const newSet = new Set(deletedSelectedIds);
        if (checked) {
            newSet.add(id);
        }
        else {
            newSet.delete(id);
        }
        setDeletedSelectedIds(newSet);
    };
    const isAllSelected = students.length > 0 && students.every((s) => selectedIds.has(s.id));
    const isSomeSelected = selectedIds.size > 0;
    const isAllDeletedSelected = deletedStudents.length > 0 && deletedStudents.every((s) => deletedSelectedIds.has(s.id));
    const isSomeDeletedSelected = deletedSelectedIds.size > 0;
    const isAllGraduatedSelected = graduatedStudents.length > 0 && graduatedStudents.every((s) => graduatedSelectedIds.has(s.id));
    const isSomeGraduatedSelected = graduatedSelectedIds.size > 0;
    const columns = [
        {
            key: 'select',
            header: (_jsx(Checkbox, { checked: isAllSelected, onCheckedChange: handleSelectAll, "aria-label": "\uC804\uCCB4 \uC120\uD0DD" })),
            className: 'w-10',
            render: (row) => (_jsx(Checkbox, { checked: selectedIds.has(row.id), onCheckedChange: (checked) => handleSelectOne(row.id, !!checked), onClick: (e) => e.stopPropagation(), "aria-label": `${row.societyName} 선택` })),
        },
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        { key: 'groupName', header: '그룹' },
        {
            key: 'gender',
            header: '성별',
            render: (row) => {
                if (row.gender === 'M')
                    return '남';
                if (row.gender === 'F')
                    return '여';
                return '-';
            },
        },
        { key: 'age', header: '나이', render: (row) => row.age ?? '-' },
        { key: 'contact', header: '연락처', render: (row) => formatContact(row.contact) },
    ];
    const graduatedColumns = [
        {
            key: 'select',
            header: (_jsx(Checkbox, { checked: isAllGraduatedSelected, onCheckedChange: handleGraduatedSelectAll, "aria-label": "\uC804\uCCB4 \uC120\uD0DD" })),
            className: 'w-10',
            render: (row) => (_jsx(Checkbox, { checked: graduatedSelectedIds.has(row.id), onCheckedChange: (checked) => handleGraduatedSelectOne(row.id, !!checked), "aria-label": `${row.societyName} 선택` })),
        },
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        { key: 'groupName', header: '그룹' },
        { key: 'contact', header: '연락처', render: (row) => formatContact(row.contact) },
        {
            key: 'graduatedAt',
            header: '졸업일',
            render: (row) => row.graduatedAt ? new Date(row.graduatedAt).toLocaleDateString('ko-KR') : '-',
        },
    ];
    const deletedColumns = [
        {
            key: 'select',
            header: (_jsx(Checkbox, { checked: isAllDeletedSelected, onCheckedChange: handleDeletedSelectAll, "aria-label": "\uC804\uCCB4 \uC120\uD0DD" })),
            className: 'w-10',
            render: (row) => (_jsx(Checkbox, { checked: deletedSelectedIds.has(row.id), onCheckedChange: (checked) => handleDeletedSelectOne(row.id, !!checked), "aria-label": `${row.societyName} 선택` })),
        },
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        { key: 'groupName', header: '그룹' },
        {
            key: 'deletedAt',
            header: '삭제일',
            render: (row) => row.deletedAt ? new Date(row.deletedAt).toLocaleDateString('ko-KR') : '-',
        },
    ];
    return (_jsxs(MainLayout, { title: "\uD559\uC0DD \uBAA9\uB85D", children: [_jsxs("div", { className: "mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [_jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [_jsxs(Select, { value: searchOptionInput, onValueChange: (value) => setSearchOptionInput(value), children: [_jsx(SelectTrigger, { className: "w-full sm:w-24", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "\uC804\uCCB4" }), _jsx(SelectItem, { value: "name", children: "\uC774\uB984" }), _jsx(SelectItem, { value: "catholicName", children: "\uC138\uB840\uBA85" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "text", value: searchInput, onChange: (e) => setSearchInput(e.target.value), placeholder: "\uAC80\uC0C9\uC5B4 \uC785\uB825", className: "flex-1 sm:w-48", onKeyDown: (e) => e.key === 'Enter' && handleSearch() }), _jsx(Button, { variant: "outline", onClick: handleSearch, children: "\uAC80\uC0C9" })] })] }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [isSomeSelected && (_jsxs(Button, { variant: "secondary", onClick: () => setBulkAction('graduate'), disabled: isGraduating, children: ["\uC878\uC5C5 \uCC98\uB9AC (", selectedIds.size, ")"] })), isSomeSelected && (_jsxs(Button, { variant: "destructive", onClick: () => setBulkAction('delete'), disabled: isBulkDeleting, children: ["\uC120\uD0DD \uC0AD\uC81C (", selectedIds.size, ")"] })), _jsxs(Button, { variant: "outline", onClick: () => setGraduatedModalOpen(true), children: ["\uC878\uC5C5\uC0DD (", graduatedStudents.length, ")"] }), _jsxs(Button, { variant: "destructive", onClick: () => setDeletedModalOpen(true), children: ["\uC0AD\uC81C\uB41C \uD559\uC0DD (", deletedStudents.length, ")"] }), _jsx(Button, { onClick: () => navigate('/students/new'), children: "\uD559\uC0DD \uCD94\uAC00" })] })] }), _jsx(Table, { columns: columns, data: students, keyExtractor: (row) => row.id, isLoading: isLoading, emptyMessage: "\uB4F1\uB85D\uB41C \uD559\uC0DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.", onRowClick: (row) => navigate(`/students/${row.id}`) }), totalPage > 1 && (_jsx("div", { className: "mt-4", children: _jsx(Pagination, { currentPage: currentPage, totalPages: totalPage, onPageChange: setPage }) })), _jsx(AlertDialog, { open: bulkAction === 'delete', onOpenChange: (open) => !open && setBulkAction(null), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\uD559\uC0DD \uC0AD\uC81C" }), _jsxs(AlertDialogDescription, { children: ["\uC120\uD0DD\uD55C ", selectedIds.size, "\uBA85\uC758 \uD559\uC0DD\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uC0AD\uC81C\uB41C \uD559\uC0DD\uC740 '\uC0AD\uC81C\uB41C \uD559\uC0DD' \uBC84\uD2BC\uC5D0\uC11C \uBCF5\uAD6C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "\uCDE8\uC18C" }), _jsx(AlertDialogAction, { onClick: handleBulkDelete, disabled: isBulkDeleting, children: isBulkDeleting ? '삭제 중...' : '삭제' })] })] }) }), _jsx(Dialog, { open: deletedModalOpen, onOpenChange: setDeletedModalOpen, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[80vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "\uC0AD\uC81C\uB41C \uD559\uC0DD \uAD00\uB9AC" }), _jsx(DialogDescription, { children: "\uC0AD\uC81C\uB41C \uD559\uC0DD\uC744 \uC120\uD0DD\uD558\uC5EC \uBCF5\uAD6C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." })] }), _jsxs("div", { className: "mt-4", children: [isSomeDeletedSelected && (_jsx("div", { className: "mb-4", children: _jsxs(Button, { size: "lg", onClick: () => setBulkAction('restore'), disabled: isRestoring, children: ["\uC120\uD0DD \uBCF5\uAD6C (", deletedSelectedIds.size, ")"] }) })), _jsx(Table, { columns: deletedColumns, data: deletedStudents, keyExtractor: (row) => row.id, isLoading: isDeletedLoading, emptyMessage: "\uC0AD\uC81C\uB41C \uD559\uC0DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." })] })] }) }), _jsx(Dialog, { open: graduatedModalOpen, onOpenChange: setGraduatedModalOpen, children: _jsxs(DialogContent, { className: "max-w-4xl max-h-[80vh] overflow-y-auto", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "\uC878\uC5C5\uC0DD \uAD00\uB9AC" }), _jsx(DialogDescription, { children: "\uC878\uC5C5\uC0DD\uC744 \uC120\uD0DD\uD558\uC5EC \uC878\uC5C5\uC744 \uCDE8\uC18C\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4." })] }), _jsxs("div", { className: "mt-4", children: [isSomeGraduatedSelected && (_jsx("div", { className: "mb-4", children: _jsxs(Button, { size: "lg", onClick: () => setBulkAction('cancelGraduation'), disabled: isCancellingGraduation, children: ["\uC878\uC5C5 \uCDE8\uC18C (", graduatedSelectedIds.size, ")"] }) })), _jsx(Table, { columns: graduatedColumns, data: graduatedStudents, keyExtractor: (row) => row.id, isLoading: isGraduatedLoading, emptyMessage: "\uC878\uC5C5\uC0DD\uC774 \uC5C6\uC2B5\uB2C8\uB2E4." })] })] }) }), _jsx(AlertDialog, { open: bulkAction === 'restore', onOpenChange: (open) => !open && setBulkAction(null), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\uD559\uC0DD \uBCF5\uAD6C" }), _jsxs(AlertDialogDescription, { children: ["\uC120\uD0DD\uD55C ", deletedSelectedIds.size, "\uBA85\uC758 \uD559\uC0DD\uC744 \uBCF5\uAD6C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C?"] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "\uCDE8\uC18C" }), _jsx(AlertDialogAction, { onClick: handleRestore, disabled: isRestoring, children: isRestoring ? '복구 중...' : '복구' })] })] }) }), _jsx(AlertDialog, { open: bulkAction === 'graduate', onOpenChange: (open) => !open && setBulkAction(null), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\uC878\uC5C5 \uCC98\uB9AC" }), _jsxs(AlertDialogDescription, { children: ["\uC120\uD0DD\uD55C ", selectedIds.size, "\uBA85\uC758 \uD559\uC0DD\uC744 \uC878\uC5C5 \uCC98\uB9AC\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uC878\uC5C5 \uCC98\uB9AC\uB41C \uD559\uC0DD\uC740 '\uC878\uC5C5\uC0DD' \uD544\uD130\uC5D0\uC11C \uD655\uC778\uD560 \uC218 \uC788\uC2B5\uB2C8\uB2E4."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "\uCDE8\uC18C" }), _jsx(AlertDialogAction, { onClick: handleGraduate, disabled: isGraduating, children: isGraduating ? '처리 중...' : '졸업 처리' })] })] }) }), _jsx(AlertDialog, { open: bulkAction === 'cancelGraduation', onOpenChange: (open) => !open && setBulkAction(null), children: _jsxs(AlertDialogContent, { children: [_jsxs(AlertDialogHeader, { children: [_jsx(AlertDialogTitle, { children: "\uC878\uC5C5 \uCDE8\uC18C" }), _jsxs(AlertDialogDescription, { children: ["\uC120\uD0DD\uD55C ", graduatedSelectedIds.size, "\uBA85\uC758 \uD559\uC0DD\uC758 \uC878\uC5C5\uC744 \uCDE8\uC18C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uC7AC\uD559\uC0DD\uC73C\uB85C \uBCF5\uC6D0\uB429\uB2C8\uB2E4."] })] }), _jsxs(AlertDialogFooter, { children: [_jsx(AlertDialogCancel, { children: "\uCDE8\uC18C" }), _jsx(AlertDialogAction, { onClick: handleCancelGraduation, disabled: isCancellingGraduation, children: isCancellingGraduation ? '처리 중...' : '졸업 취소' })] })] }) })] }));
}
