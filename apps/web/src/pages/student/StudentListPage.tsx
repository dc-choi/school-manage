import { formatContact } from '@school/utils';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pagination, Table } from '~/components/common';
import { MainLayout } from '~/components/layout';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useStudents } from '~/features/student';

export function StudentListPage() {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [searchOptionInput, setSearchOptionInput] = useState<'all' | 'name' | 'catholicName'>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkAction, setBulkAction] = useState<'delete' | 'restore' | 'graduate' | 'cancelGraduation' | null>(null);
    const [deletedModalOpen, setDeletedModalOpen] = useState(false);
    const [deletedSelectedIds, setDeletedSelectedIds] = useState<Set<string>>(new Set());
    const [graduatedModalOpen, setGraduatedModalOpen] = useState(false);
    const [graduatedSelectedIds, setGraduatedSelectedIds] = useState<Set<string>>(new Set());

    // 재학생 목록
    const {
        students,
        totalPage,
        currentPage,
        isLoading,
        setPage,
        search,
        bulkDelete,
        isBulkDeleting,
        graduate,
        isGraduating,
    } = useStudents({ initialDeleteFilter: 'active', initialGraduatedFilter: 'active' });

    // 삭제된 학생 목록
    const {
        students: deletedStudents,
        isLoading: isDeletedLoading,
        restore,
        isRestoring,
    } = useStudents({ initialDeleteFilter: 'deleted' });

    // 졸업생 목록
    const {
        students: graduatedStudents,
        isLoading: isGraduatedLoading,
        cancelGraduation,
        isCancellingGraduation,
    } = useStudents({ initialDeleteFilter: 'active', initialGraduatedFilter: 'graduated' });

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

    const handleGraduatedSelectAll = (checked: boolean) => {
        if (checked) {
            setGraduatedSelectedIds(new Set(graduatedStudents.map((s) => s.id)));
        } else {
            setGraduatedSelectedIds(new Set());
        }
    };

    const handleGraduatedSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(graduatedSelectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setGraduatedSelectedIds(newSet);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(students.map((s) => s.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    const handleDeletedSelectAll = (checked: boolean) => {
        if (checked) {
            setDeletedSelectedIds(new Set(deletedStudents.map((s) => s.id)));
        } else {
            setDeletedSelectedIds(new Set());
        }
    };

    const handleDeletedSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(deletedSelectedIds);
        if (checked) {
            newSet.add(id);
        } else {
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
            header: (
                <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="전체 선택"
                />
            ),
            className: 'w-10',
            render: (row: (typeof students)[0]) => (
                <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={(checked) => handleSelectOne(row.id, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${row.societyName} 선택`}
                />
            ),
        },
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        { key: 'groupName', header: '그룹' },
        {
            key: 'gender',
            header: '성별',
            render: (row: (typeof students)[0]) => {
                if (row.gender === 'M') return '남';
                if (row.gender === 'F') return '여';
                return '-';
            },
        },
        { key: 'age', header: '나이', render: (row: (typeof students)[0]) => row.age ?? '-' },
        { key: 'contact', header: '연락처', render: (row: (typeof students)[0]) => formatContact(row.contact) },
    ];

    const graduatedColumns = [
        {
            key: 'select',
            header: (
                <Checkbox
                    checked={isAllGraduatedSelected}
                    onCheckedChange={handleGraduatedSelectAll}
                    aria-label="전체 선택"
                />
            ),
            className: 'w-10',
            render: (row: (typeof graduatedStudents)[0]) => (
                <Checkbox
                    checked={graduatedSelectedIds.has(row.id)}
                    onCheckedChange={(checked) => handleGraduatedSelectOne(row.id, !!checked)}
                    aria-label={`${row.societyName} 선택`}
                />
            ),
        },
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        { key: 'groupName', header: '그룹' },
        { key: 'contact', header: '연락처', render: (row: (typeof graduatedStudents)[0]) => formatContact(row.contact) },
        {
            key: 'graduatedAt',
            header: '졸업일',
            render: (row: (typeof graduatedStudents)[0]) =>
                row.graduatedAt ? new Date(row.graduatedAt).toLocaleDateString('ko-KR') : '-',
        },
    ];

    const deletedColumns = [
        {
            key: 'select',
            header: (
                <Checkbox
                    checked={isAllDeletedSelected}
                    onCheckedChange={handleDeletedSelectAll}
                    aria-label="전체 선택"
                />
            ),
            className: 'w-10',
            render: (row: (typeof deletedStudents)[0]) => (
                <Checkbox
                    checked={deletedSelectedIds.has(row.id)}
                    onCheckedChange={(checked) => handleDeletedSelectOne(row.id, !!checked)}
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
            render: (row: (typeof deletedStudents)[0]) =>
                row.deletedAt ? new Date(row.deletedAt).toLocaleDateString('ko-KR') : '-',
        },
    ];

    return (
        <MainLayout title="학생 목록">
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                        value={searchOptionInput}
                        onValueChange={(value) => setSearchOptionInput(value as typeof searchOptionInput)}
                    >
                        <SelectTrigger className="w-full sm:w-24">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체</SelectItem>
                            <SelectItem value="name">이름</SelectItem>
                            <SelectItem value="catholicName">세례명</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="검색어 입력"
                            className="flex-1 sm:w-48"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button variant="outline" onClick={handleSearch}>
                            검색
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* 재학생 선택 시 - 졸업 처리 버튼 */}
                    {isSomeSelected && (
                        <Button
                            variant="secondary"
                            onClick={() => setBulkAction('graduate')}
                            disabled={isGraduating}
                        >
                            졸업 처리 ({selectedIds.size})
                        </Button>
                    )}
                    {/* 삭제 버튼 */}
                    {isSomeSelected && (
                        <Button
                            variant="destructive"
                            onClick={() => setBulkAction('delete')}
                            disabled={isBulkDeleting}
                        >
                            선택 삭제 ({selectedIds.size})
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setGraduatedModalOpen(true)}>
                        졸업생 ({graduatedStudents.length})
                    </Button>
                    <Button variant="destructive" onClick={() => setDeletedModalOpen(true)}>
                        삭제된 학생 ({deletedStudents.length})
                    </Button>
                    <Button onClick={() => navigate('/students/new')}>
                        학생 추가
                    </Button>
                </div>
            </div>

            <Table
                columns={columns}
                data={students}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                emptyMessage="등록된 학생이 없습니다."
                onRowClick={(row) => navigate(`/students/${row.id}`)}
            />

            {totalPage > 1 && (
                <div className="mt-4">
                    <Pagination currentPage={currentPage} totalPages={totalPage} onPageChange={setPage} />
                </div>
            )}

            {/* 일괄 삭제 확인 다이얼로그 */}
            <AlertDialog open={bulkAction === 'delete'} onOpenChange={(open) => !open && setBulkAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>학생 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생을 삭제하시겠습니까?
                            삭제된 학생은 &apos;삭제된 학생&apos; 버튼에서 복구할 수 있습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting}>
                            {isBulkDeleting ? '삭제 중...' : '삭제'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 삭제된 학생 모달 */}
            <Dialog open={deletedModalOpen} onOpenChange={setDeletedModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>삭제된 학생 관리</DialogTitle>
                        <DialogDescription>
                            삭제된 학생을 선택하여 복구할 수 있습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {isSomeDeletedSelected && (
                            <div className="mb-4">
                                <Button
                                    size="lg"
                                    onClick={() => setBulkAction('restore')}
                                    disabled={isRestoring}
                                >
                                    선택 복구 ({deletedSelectedIds.size})
                                </Button>
                            </div>
                        )}
                        <Table
                            columns={deletedColumns}
                            data={deletedStudents}
                            keyExtractor={(row) => row.id}
                            isLoading={isDeletedLoading}
                            emptyMessage="삭제된 학생이 없습니다."
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* 졸업생 관리 모달 */}
            <Dialog open={graduatedModalOpen} onOpenChange={setGraduatedModalOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>졸업생 관리</DialogTitle>
                        <DialogDescription>
                            졸업생을 선택하여 졸업을 취소할 수 있습니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {isSomeGraduatedSelected && (
                            <div className="mb-4">
                                <Button
                                    size="lg"
                                    onClick={() => setBulkAction('cancelGraduation')}
                                    disabled={isCancellingGraduation}
                                >
                                    졸업 취소 ({graduatedSelectedIds.size})
                                </Button>
                            </div>
                        )}
                        <Table
                            columns={graduatedColumns}
                            data={graduatedStudents}
                            keyExtractor={(row) => row.id}
                            isLoading={isGraduatedLoading}
                            emptyMessage="졸업생이 없습니다."
                        />
                    </div>
                </DialogContent>
            </Dialog>

            {/* 복구 확인 다이얼로그 */}
            <AlertDialog open={bulkAction === 'restore'} onOpenChange={(open) => !open && setBulkAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>학생 복구</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {deletedSelectedIds.size}명의 학생을 복구하시겠습니까?
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

            {/* 졸업 처리 확인 다이얼로그 */}
            <AlertDialog open={bulkAction === 'graduate'} onOpenChange={(open) => !open && setBulkAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>졸업 처리</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생을 졸업 처리하시겠습니까?
                            졸업 처리된 학생은 &apos;졸업생&apos; 필터에서 확인할 수 있습니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleGraduate} disabled={isGraduating}>
                            {isGraduating ? '처리 중...' : '졸업 처리'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* 졸업 취소 확인 다이얼로그 */}
            <AlertDialog open={bulkAction === 'cancelGraduation'} onOpenChange={(open) => !open && setBulkAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>졸업 취소</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {graduatedSelectedIds.size}명의 학생의 졸업을 취소하시겠습니까?
                            재학생으로 복원됩니다.
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
        </MainLayout>
    );
}
