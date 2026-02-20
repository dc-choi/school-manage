import { DeletedStudentsModal } from './DeletedStudentsModal';
import { GraduatedStudentsModal } from './GraduatedStudentsModal';
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
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useCheckboxSelection, useStudents } from '~/features/student';

export function StudentListPage() {
    const navigate = useNavigate();
    const [searchInput, setSearchInput] = useState('');
    const [searchOptionInput, setSearchOptionInput] = useState<'all' | 'societyName' | 'catholicName' | 'baptizedAt'>(
        'all'
    );
    const [bulkAction, setBulkAction] = useState<'delete' | 'graduate' | null>(null);
    const [deletedModalOpen, setDeletedModalOpen] = useState(false);
    const [graduatedModalOpen, setGraduatedModalOpen] = useState(false);

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
    } = useStudents({ initialDeleteFilter: 'active', initialGraduatedFilter: 'active', syncPageWithUrl: true });

    // 삭제된 학생 목록
    const {
        students: deletedStudents,
        total: deletedTotal,
        totalPage: deletedTotalPage,
        currentPage: deletedCurrentPage,
        setPage: setDeletedPage,
        isLoading: isDeletedLoading,
        restore,
        isRestoring,
    } = useStudents({ initialDeleteFilter: 'deleted' });

    // 졸업생 목록
    const {
        students: graduatedStudents,
        total: graduatedTotal,
        totalPage: graduatedTotalPage,
        currentPage: graduatedCurrentPage,
        setPage: setGraduatedPage,
        isLoading: isGraduatedLoading,
        cancelGraduation,
        isCancellingGraduation,
    } = useStudents({ initialDeleteFilter: 'active', initialGraduatedFilter: 'graduated' });

    const { selectedIds, selectAll, selectOne, clearSelection, isAllSelected, isSomeSelected } =
        useCheckboxSelection(students);

    const handleSearch = () => {
        search(searchOptionInput, searchInput);
        clearSelection();
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size > 0) {
            await bulkDelete(Array.from(selectedIds));
            clearSelection();
            setBulkAction(null);
        }
    };

    const handleGraduate = async () => {
        if (selectedIds.size > 0) {
            await graduate(Array.from(selectedIds));
            clearSelection();
            setBulkAction(null);
        }
    };

    const columns = [
        {
            key: 'select',
            header: <Checkbox checked={isAllSelected} onCheckedChange={selectAll} aria-label="전체 선택" />,
            className: 'w-10',
            render: (row: (typeof students)[0]) => (
                <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={(checked) => selectOne(row.id, !!checked)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`${row.societyName} 선택`}
                />
            ),
        },
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        { key: 'groupName', header: '학년' },
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
        { key: 'baptizedAt', header: '축일', render: (row: (typeof students)[0]) => row.baptizedAt ?? '-' },
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
                            <SelectItem value="societyName">이름</SelectItem>
                            <SelectItem value="catholicName">세례명</SelectItem>
                            <SelectItem value="baptizedAt">축일</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                        <Input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="검색어 입력…"
                            className="flex-1 sm:w-48"
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button variant="outline" onClick={handleSearch}>
                            검색
                        </Button>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {isSomeSelected && (
                        <Button variant="secondary" onClick={() => setBulkAction('graduate')} disabled={isGraduating}>
                            졸업 처리 ({selectedIds.size})
                        </Button>
                    )}
                    {isSomeSelected && (
                        <Button variant="destructive" onClick={() => setBulkAction('delete')} disabled={isBulkDeleting}>
                            선택 삭제 ({selectedIds.size})
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setGraduatedModalOpen(true)}>
                        졸업생 ({graduatedTotal})
                    </Button>
                    <Button variant="destructive" onClick={() => setDeletedModalOpen(true)}>
                        삭제된 학생 ({deletedTotal})
                    </Button>
                    <Button onClick={() => navigate('/students/new')}>학생 추가</Button>
                </div>
            </div>

            <Table
                columns={columns}
                data={students}
                keyExtractor={(row) => row.id}
                isLoading={isLoading}
                emptyMessage="등록된 학생이 없습니다. 학생을 등록하면 출석 체크를 시작할 수 있어요."
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
                            선택한 {selectedIds.size}명의 학생을 삭제하시겠습니까? 삭제된 학생은 &apos;삭제된 학생&apos;
                            버튼에서 복구할 수 있습니다.
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

            {/* 졸업 처리 확인 다이얼로그 */}
            <AlertDialog open={bulkAction === 'graduate'} onOpenChange={(open) => !open && setBulkAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>졸업 처리</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생을 졸업 처리하시겠습니까? 졸업 처리된 학생은
                            &apos;졸업생&apos; 필터에서 확인할 수 있습니다.
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

            <DeletedStudentsModal
                open={deletedModalOpen}
                onOpenChange={setDeletedModalOpen}
                students={deletedStudents}
                totalPage={deletedTotalPage}
                currentPage={deletedCurrentPage}
                isLoading={isDeletedLoading}
                onPageChange={setDeletedPage}
                onRestore={restore}
                isRestoring={isRestoring}
            />

            <GraduatedStudentsModal
                open={graduatedModalOpen}
                onOpenChange={setGraduatedModalOpen}
                students={graduatedStudents}
                totalPage={graduatedTotalPage}
                currentPage={graduatedCurrentPage}
                isLoading={isGraduatedLoading}
                onPageChange={setGraduatedPage}
                onCancelGraduation={cancelGraduation}
                isCancellingGraduation={isCancellingGraduation}
            />
        </MainLayout>
    );
}
