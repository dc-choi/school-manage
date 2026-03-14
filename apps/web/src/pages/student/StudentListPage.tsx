import { GraduatedStudentsModal } from './GraduatedStudentsModal';
import { RegistrationModal } from './RegistrationModal';
import { formatContact } from '@school/utils';
import { Upload } from 'lucide-react';
import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { useAuth } from '~/features/auth';
import { useGroups } from '~/features/group/hooks/useGroups';
import { useCheckboxSelection, useStudents } from '~/features/student';
import { StudentImportModal } from '~/features/student/components/StudentImportModal';
import { extractErrorMessage } from '~/lib/error';

const GRADUATION_AGE_LABEL: Record<string, string> = {
    ELEMENTARY: '14살 이상만 졸업 대상입니다.',
    MIDDLE_HIGH: '20살 이상만 졸업 대상입니다.',
    YOUNG_ADULT: '나이 제한 없이 전원 졸업 처리됩니다.',
};

export function StudentListPage() {
    const navigate = useNavigate();
    const { organizationType } = useAuth();
    const [searchInput, setSearchInput] = useState('');
    const [searchOptionInput, setSearchOptionInput] = useState<'all' | 'societyName' | 'catholicName' | 'baptizedAt'>(
        'all'
    );
    const [bulkAction, setBulkAction] = useState<'delete' | 'graduate' | null>(null);
    const [graduatedModalOpen, setGraduatedModalOpen] = useState(false);
    const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);

    // 그룹 목록 (엑셀 Import 학년 매칭용)
    const { groups } = useGroups();

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
            try {
                await bulkDelete(Array.from(selectedIds));
                clearSelection();
                setBulkAction(null);
            } catch (err) {
                toast.error(extractErrorMessage(err));
            }
        }
    };

    const handleGraduate = async () => {
        if (selectedIds.size > 0) {
            try {
                const result = await graduate(Array.from(selectedIds));
                clearSelection();
                setBulkAction(null);

                if (result.skipped.length > 0) {
                    const criteria = organizationType ? GRADUATION_AGE_LABEL[organizationType] : '';
                    toast.warning(`${result.graduatedCount}명 졸업 처리, ${result.skipped.length}명 제외`, {
                        description: (
                            <>
                                {criteria}
                                <br />
                                {result.skipped.map((s) => (
                                    <Fragment key={s.id}>
                                        <br />
                                        {s.societyName} ({s.reason})
                                    </Fragment>
                                ))}
                            </>
                        ),
                        duration: 8000,
                    });
                } else {
                    toast.success(`${result.graduatedCount}명 졸업 처리되었습니다.`);
                }
            } catch (err) {
                toast.error(extractErrorMessage(err));
            }
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
        {
            key: 'groups',
            header: '학년&부서',
            render: (row: (typeof students)[0]) =>
                row.groups?.length ? row.groups.map((g) => g.name).join(', ') : '-',
        },
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
        {
            key: 'isRegistered',
            header: '등록',
            render: (row: (typeof students)[0]) =>
                row.isRegistered ? (
                    <span className="font-medium text-green-600">등록</span>
                ) : (
                    <span className="text-muted-foreground">미등록</span>
                ),
        },
        { key: 'contact', header: '연락처', render: (row: (typeof students)[0]) => formatContact(row.contact) },
        { key: 'baptizedAt', header: '축일', render: (row: (typeof students)[0]) => row.baptizedAt ?? '-' },
    ];

    return (
        <MainLayout title="학생 목록">
            <div className="flex h-[calc(100vh-6.5rem)] flex-col gap-3 md:h-[calc(100vh-7.5rem)]">
                {/* 컨트롤 영역 */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Select
                            value={searchOptionInput}
                            onValueChange={(value) => setSearchOptionInput(value as typeof searchOptionInput)}
                        >
                            <SelectTrigger className="h-9 w-full sm:w-24">
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
                                className="h-9 flex-1 sm:w-48"
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <Button variant="outline" size="sm" onClick={handleSearch}>
                                검색
                            </Button>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {isSomeSelected ? (
                            <>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setBulkAction('graduate')}
                                    disabled={isGraduating}
                                >
                                    졸업 처리 ({selectedIds.size})
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setBulkAction('delete')}
                                    disabled={isBulkDeleting}
                                >
                                    선택 삭제 ({selectedIds.size})
                                </Button>
                            </>
                        ) : null}
                        <Button variant="outline" size="sm" onClick={() => setRegistrationModalOpen(true)}>
                            등록 관리
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setGraduatedModalOpen(true)}>
                            졸업생 ({graduatedTotal})
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
                            <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                            학생 일괄 등록
                        </Button>
                        <Button size="sm" onClick={() => navigate('/students/new')}>
                            학생 추가
                        </Button>
                    </div>
                </div>

                {/* 테이블 영역 */}
                <Table
                    columns={columns}
                    data={students}
                    keyExtractor={(row) => row.id}
                    isLoading={isLoading}
                    emptyMessage="등록된 학생이 없습니다. 학생을 등록하면 출석 체크를 시작할 수 있어요."
                    onRowClick={(row) => navigate(`/students/${row.id}`)}
                    className="min-h-0 flex-1"
                />

                {/* 페이지네이션 */}
                {totalPage > 1 ? (
                    <Pagination currentPage={currentPage} totalPages={totalPage} onPageChange={setPage} />
                ) : null}
            </div>

            {/* 일괄 삭제 확인 다이얼로그 */}
            <AlertDialog open={bulkAction === 'delete'} onOpenChange={(open) => !open && setBulkAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>학생 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생을 삭제하시겠습니까?
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
                        {organizationType ? (
                            <p className="text-sm text-muted-foreground">
                                {GRADUATION_AGE_LABEL[organizationType]} 나이 미달 학생은 자동으로 제외됩니다.
                            </p>
                        ) : null}
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생을 졸업 처리하시겠습니까? 졸업 처리된 학생은
                            &apos;졸업생&apos; 버튼에서 확인할 수 있습니다.
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

            <RegistrationModal open={registrationModalOpen} onOpenChange={setRegistrationModalOpen} />

            <StudentImportModal
                open={importModalOpen}
                onOpenChange={setImportModalOpen}
                groups={groups.filter((g) => g.type === 'GRADE').map((g) => ({ id: g.id, name: g.name }))}
                onImportSuccess={() => setImportModalOpen(false)}
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
