import { formatContact, formatDateKR } from '@school/utils';
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

interface GraduatedStudentsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    students: StudentItem[];
    totalPage: number;
    currentPage: number;
    isLoading: boolean;
    onPageChange: (page: number) => void;
    onCancelGraduation: (ids: string[]) => Promise<unknown>;
    isCancellingGraduation: boolean;
}

export function GraduatedStudentsModal({
    open,
    onOpenChange,
    students,
    totalPage,
    currentPage,
    isLoading,
    onPageChange,
    onCancelGraduation,
    isCancellingGraduation,
}: GraduatedStudentsModalProps) {
    const { selectedIds, selectAll, selectOne, clearSelection, isAllSelected, isSomeSelected } =
        useCheckboxSelection(students);
    const [confirmCancel, setConfirmCancel] = useState(false);

    const handleCancelGraduation = async () => {
        if (selectedIds.size > 0) {
            await onCancelGraduation(Array.from(selectedIds));
            clearSelection();
            setConfirmCancel(false);
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
        {
            key: 'contact',
            header: '연락처',
            render: (row: StudentItem) => formatContact(row.contact),
        },
        {
            key: 'graduatedAt',
            header: '졸업일',
            render: (row: StudentItem) => formatDateKR(row.graduatedAt),
        },
    ];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>졸업생 관리</DialogTitle>
                        <DialogDescription>졸업생을 선택하여 졸업을 취소할 수 있습니다.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {isSomeSelected && (
                            <div className="mb-4">
                                <Button
                                    size="lg"
                                    onClick={() => setConfirmCancel(true)}
                                    disabled={isCancellingGraduation}
                                >
                                    졸업 취소 ({selectedIds.size})
                                </Button>
                            </div>
                        )}
                        <Table
                            columns={columns}
                            data={students}
                            keyExtractor={(row) => row.id}
                            isLoading={isLoading}
                            emptyMessage="졸업생이 없습니다."
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

            <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>졸업 취소</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생의 졸업을 취소하시겠습니까? 재학생으로 복원됩니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelGraduation} disabled={isCancellingGraduation}>
                            {isCancellingGraduation ? '처리 중...' : '졸업 취소'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
