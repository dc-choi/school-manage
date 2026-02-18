import { formatDateKR } from '@school/utils';
import { useState } from 'react';
import { Pagination, Table } from '~/components/common';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { useCheckboxSelection } from '~/features/student';
import type { useStudents } from '~/features/student';

type StudentItem = ReturnType<typeof useStudents>['students'][number];

interface DeletedStudentsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: StudentItem[];
    totalPage: number;
    currentPage: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onRestore: (ids: string[]) => Promise<unknown>;
    isRestoring: boolean;
}

export function DeletedStudentsModal({
    open,
    onOpenChange,
    students,
    totalPage,
    currentPage,
    isLoading,
    onPageChange,
    onRestore,
    isRestoring,
}: DeletedStudentsModalProps) {
    const { selectedIds, selectAll, selectOne, clearSelection, isAllSelected, isSomeSelected } =
        useCheckboxSelection(students);
    const [confirmRestore, setConfirmRestore] = useState(false);

    const handleRestore = async () => {
        if (selectedIds.size > 0) {
            await onRestore(Array.from(selectedIds));
            clearSelection();
            setConfirmRestore(false);
        }
    };

    const columns = [
        {
            key: 'select',
            header: <Checkbox checked={isAllSelected} onCheckedChange={selectAll} aria-label="전체 선택" />,
            className: 'w-10',
            render: (row: StudentItem) => (
                <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={(checked) => selectOne(row.id, !!checked)}
                    aria-label={`${row.societyName} 선택`}
                />
            ),
        },
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        { key: 'groupName', header: '그룹' },
        {
            key: 'deletedAt',
            header: '삭제일',
            render: (row: StudentItem) => formatDateKR(row.deletedAt),
        },
    ];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>삭제된 멤버 관리</DialogTitle>
                        <DialogDescription>삭제된 멤버를 선택하여 복구할 수 있습니다.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {isSomeSelected && (
                            <div className="mb-4">
                                <Button size="lg" onClick={() => setConfirmRestore(true)} disabled={isRestoring}>
                                    선택 복구 ({selectedIds.size})
                                </Button>
                            </div>
                        )}
                        <Table
                            columns={columns}
                            data={students}
                            keyExtractor={(row) => row.id}
                            isLoading={isLoading}
                            emptyMessage="삭제된 멤버가 없습니다."
                        />
                        {totalPage > 1 && (
                            <div className="mt-4">
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPage}
                                    onPageChange={onPageChange}
                                />
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={confirmRestore} onOpenChange={setConfirmRestore}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>멤버 복구</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 멤버를 복구하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRestore} disabled={isRestoring}>
                            {isRestoring ? '복구 중...' : '복구'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
