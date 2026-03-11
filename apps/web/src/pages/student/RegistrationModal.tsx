import { useState } from 'react';
import { toast } from 'sonner';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useCheckboxSelection, useStudents } from '~/features/student';
import { extractErrorMessage } from '~/lib/error';

interface RegistrationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function RegistrationModal({ open, onOpenChange }: RegistrationModalProps) {
    const {
        students,
        totalPage,
        currentPage,
        isLoading,
        setPage,
        registrationSummary,
        registrationFilter,
        changeRegistrationFilter,
        registrationYear,
        bulkRegister,
        isBulkRegistering,
        bulkCancelRegistration,
        isBulkCancellingRegistration,
    } = useStudents({
        initialDeleteFilter: 'active',
        initialGraduatedFilter: 'active',
    });

    const { selectedIds, selectAll, selectOne, clearSelection, isAllSelected, isSomeSelected } =
        useCheckboxSelection(students);

    const [confirmAction, setConfirmAction] = useState<'register' | 'cancelRegistration' | null>(null);

    const handleBulkRegister = async () => {
        if (selectedIds.size > 0) {
            try {
                await bulkRegister(Array.from(selectedIds));
                clearSelection();
                setConfirmAction(null);
            } catch (err) {
                toast.error(extractErrorMessage(err));
            }
        }
    };

    const handleBulkCancelRegistration = async () => {
        if (selectedIds.size > 0) {
            try {
                await bulkCancelRegistration(Array.from(selectedIds));
                clearSelection();
                setConfirmAction(null);
            } catch (err) {
                toast.error(extractErrorMessage(err));
            }
        }
    };

    type StudentItem = (typeof students)[number];

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
        { key: 'groupName', header: '학년' },
        {
            key: 'isRegistered',
            header: '등록',
            render: (row: StudentItem) =>
                row.isRegistered ? (
                    <span className="font-medium text-green-600">등록</span>
                ) : (
                    <span className="text-muted-foreground">미등록</span>
                ),
        },
    ];

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{registrationYear}년 등록 관리</DialogTitle>
                        <DialogDescription>학생을 선택하여 등록 또는 등록 취소할 수 있습니다.</DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <div className="mb-4 flex flex-wrap items-center gap-2">
                            {isSomeSelected ? (
                                <>
                                    <Button onClick={() => setConfirmAction('register')} disabled={isBulkRegistering}>
                                        등록 ({selectedIds.size})
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmAction('cancelRegistration')}
                                        disabled={isBulkCancellingRegistration}
                                    >
                                        등록 취소 ({selectedIds.size})
                                    </Button>
                                </>
                            ) : null}
                            <Select
                                value={registrationFilter}
                                onValueChange={(value) =>
                                    changeRegistrationFilter(value as 'all' | 'registered' | 'unregistered')
                                }
                            >
                                <SelectTrigger className="w-28" aria-label="등록 필터">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    <SelectItem value="registered">등록</SelectItem>
                                    <SelectItem value="unregistered">미등록</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {registrationSummary ? (
                            <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
                                등록 {registrationSummary.registeredCount}명 / 미등록{' '}
                                {registrationSummary.unregisteredCount}명
                            </p>
                        ) : null}
                        <Table
                            columns={columns}
                            data={students}
                            keyExtractor={(row) => row.id}
                            isLoading={isLoading}
                            emptyMessage="학생이 없습니다."
                        />
                        {totalPage > 1 ? (
                            <div className="mt-4">
                                <Pagination currentPage={currentPage} totalPages={totalPage} onPageChange={setPage} />
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 일괄 등록 확인 */}
            <AlertDialog open={confirmAction === 'register'} onOpenChange={(open) => !open && setConfirmAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>학생 등록</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생을 {registrationYear}년도에 등록하시겠습니까? 이미 등록된
                            학생은 건너뜁니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkRegister} disabled={isBulkRegistering}>
                            {isBulkRegistering ? '등록 중...' : '등록'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 등록 취소 확인 */}
            <AlertDialog
                open={confirmAction === 'cancelRegistration'}
                onOpenChange={(open) => !open && setConfirmAction(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>등록 취소</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생의 {registrationYear}년도 등록을 취소하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleBulkCancelRegistration}
                            disabled={isBulkCancellingRegistration}
                        >
                            {isBulkCancellingRegistration ? '취소 중...' : '등록 취소'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
