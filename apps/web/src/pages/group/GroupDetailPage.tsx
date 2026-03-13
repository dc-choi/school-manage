import { GROUP_TYPE, type GroupType } from '@school/shared';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Table } from '~/components/common';
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
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { useGroups } from '~/features/group';
import { useCheckboxSelection } from '~/features/student';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

function formatPhoneNumber(contact: string | undefined): string {
    if (!contact) return '-';
    const str = String(contact).padStart(11, '0');
    return `${str.slice(0, 3)}-${str.slice(3, 7)}-${str.slice(7)}`;
}

const TYPE_LABEL: Record<string, string> = {
    [GROUP_TYPE.GRADE]: '학년',
    [GROUP_TYPE.DEPARTMENT]: '부서',
};

export function GroupDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const {
        getQuery,
        update,
        isUpdating,
        bulkAddStudents,
        isBulkAddingStudents,
        bulkRemoveStudents,
        isBulkRemovingStudents,
    } = useGroups();
    const { data: group, isLoading, error } = getQuery(id ?? '');

    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [editedType, setEditedType] = useState<GroupType>(GROUP_TYPE.GRADE);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showBulkRemoveConfirm, setShowBulkRemoveConfirm] = useState(false);

    // 추가 다이얼로그: 체크박스 선택
    const [addSelectedIds, setAddSelectedIds] = useState<Set<string>>(new Set());

    // 테이블: 체크박스 선택 (제거용)
    const students = group?.students ?? [];
    const { selectedIds, selectAll, selectOne, clearSelection, isAllSelected, isSomeSelected } =
        useCheckboxSelection(students);

    // 학생 검색 (전체 학생 목록)
    const { data: searchResult } = trpc.student.list.useQuery(
        { searchWord: searchQuery, searchOption: 'societyName' },
        { enabled: showAddDialog && searchQuery.length > 0 }
    );

    // 이미 소속된 학생 ID Set
    const memberIds = new Set(group?.students.map((s) => s.id) ?? []);

    // 검색 결과에서 이미 소속된 학생 제외
    const availableStudents = searchResult?.students.filter((s) => !memberIds.has(s.id)) ?? [];

    useEffect(() => {
        if (group?.name) {
            setEditedName(group.name);
        }
        if (group?.type) {
            setEditedType(group.type as GroupType);
        }
    }, [group?.name, group?.type]);

    const handleSave = async () => {
        if (!id || !editedName.trim()) return;
        try {
            await update({ id, name: editedName.trim(), type: editedType });
            setIsEditing(false);
        } catch (e) {
            toast.error(extractErrorMessage(e));
        }
    };

    const handleCancel = () => {
        setEditedName(group?.name ?? '');
        setEditedType((group?.type as GroupType) ?? GROUP_TYPE.GRADE);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    const toggleAddSelect = (studentId: string, checked: boolean) => {
        setAddSelectedIds((prev) => {
            const next = new Set(prev);
            if (checked) next.add(studentId);
            else next.delete(studentId);
            return next;
        });
    };

    const handleBulkAdd = async () => {
        if (!id || addSelectedIds.size === 0) return;
        try {
            const { addedCount } = await bulkAddStudents(id, Array.from(addSelectedIds));
            toast.success(`${addedCount}명의 학생을 추가했습니다.`);
            setAddSelectedIds(new Set());
            setSearchQuery('');
        } catch (e) {
            toast.error(extractErrorMessage(e));
        }
    };

    const handleBulkRemove = async () => {
        if (!id || selectedIds.size === 0) return;
        try {
            const { removedCount } = await bulkRemoveStudents(id, Array.from(selectedIds));
            toast.success(`${removedCount}명의 학생을 제거했습니다.`);
            clearSelection();
            setShowBulkRemoveConfirm(false);
        } catch (e) {
            toast.error(extractErrorMessage(e));
        }
    };

    if (error) {
        return (
            <MainLayout title="학년&부서 상세">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-destructive">학년&부서를 불러오는데 실패했습니다.</p>
                        <div className="mt-4 flex justify-center">
                            <Button size="lg" onClick={() => navigate(-1)}>
                                목록으로
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </MainLayout>
        );
    }

    type StudentRow = NonNullable<typeof group>['students'][0];

    const columns = [
        {
            key: 'select',
            header: <Checkbox checked={isAllSelected} onCheckedChange={selectAll} aria-label="전체 선택" />,
            className: 'w-10',
            render: (row: StudentRow) => (
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
            key: 'age',
            header: '나이',
            render: (row: StudentRow) => (row.age ? `${row.age}세` : '-'),
        },
        {
            key: 'contact',
            header: '연락처',
            render: (row: StudentRow) => formatPhoneNumber(row.contact),
        },
    ];

    return (
        <MainLayout title="학년&부서 상세">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <Input
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="text-2xl font-bold"
                                            autoFocus
                                        />
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={editedType}
                                                onValueChange={(v) => setEditedType(v as GroupType)}
                                            >
                                                <SelectTrigger className="w-28">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value={GROUP_TYPE.GRADE}>학년</SelectItem>
                                                    <SelectItem value={GROUP_TYPE.DEPARTMENT}>부서</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <div className="flex-1" />
                                            <Button variant="outline" onClick={handleCancel} className="min-w-24">
                                                취소
                                            </Button>
                                            <Button
                                                onClick={handleSave}
                                                disabled={isUpdating || !editedName.trim()}
                                                className="min-w-24"
                                            >
                                                {isUpdating ? '저장 중...' : '저장'}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        className="w-full cursor-pointer rounded-md p-1 text-left hover:bg-muted/50"
                                        onClick={() => group && setIsEditing(true)}
                                        title="클릭하여 수정"
                                    >
                                        <CardTitle className="text-2xl">
                                            {isLoading ? '로딩 중...' : group?.name}
                                        </CardTitle>
                                        {group?.type ? (
                                            <div className="mt-1 flex items-center gap-2">
                                                <Badge
                                                    variant={group.type === GROUP_TYPE.GRADE ? 'default' : 'secondary'}
                                                >
                                                    {TYPE_LABEL[group.type] ?? group.type}
                                                </Badge>
                                                <CardDescription>클릭하여 수정</CardDescription>
                                            </div>
                                        ) : (
                                            <CardDescription>클릭하여 수정</CardDescription>
                                        )}
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className="flex-1 sm:flex-none"
                                    onClick={() => navigate(-1)}
                                >
                                    목록으로
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>학생 목록</CardTitle>
                                <CardDescription>
                                    {isLoading
                                        ? '로딩 중...'
                                        : `총 ${group?.students.length ?? 0}명의 학생이 있습니다.`}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                {isSomeSelected ? (
                                    <Button variant="destructive" onClick={() => setShowBulkRemoveConfirm(true)}>
                                        선택 제거 ({selectedIds.size})
                                    </Button>
                                ) : null}
                                <Button onClick={() => setShowAddDialog(true)}>학생 추가</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table
                            columns={columns}
                            data={students}
                            keyExtractor={(row) => row.id}
                            isLoading={isLoading}
                            emptyMessage="등록된 학생이 없습니다."
                        />
                    </CardContent>
                </Card>
            </div>

            {/* 학생 추가 다이얼로그 (체크박스 다중 선택) */}
            <Dialog
                open={showAddDialog}
                onOpenChange={(open) => {
                    setShowAddDialog(open);
                    if (!open) {
                        setSearchQuery('');
                        setAddSelectedIds(new Set());
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>학생 추가</DialogTitle>
                        <DialogDescription>이름을 검색하여 추가할 학생을 선택하세요.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Search className="mt-2.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="학생 이름 검색…"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {searchQuery.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">이름을 입력하세요.</p>
                            ) : availableStudents.length === 0 ? (
                                <p className="py-4 text-center text-sm text-muted-foreground">검색 결과가 없습니다.</p>
                            ) : (
                                <ul className="space-y-1">
                                    {availableStudents.map((s) => (
                                        <li key={s.id}>
                                            <label className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
                                                <Checkbox
                                                    checked={addSelectedIds.has(s.id)}
                                                    onCheckedChange={(checked) => toggleAddSelect(s.id, !!checked)}
                                                />
                                                <span>
                                                    {s.societyName}
                                                    {s.groups?.length ? (
                                                        <span className="ml-2 text-sm text-muted-foreground">
                                                            ({s.groups.map((g) => g.name).join(', ')})
                                                        </span>
                                                    ) : null}
                                                </span>
                                            </label>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        {addSelectedIds.size > 0 ? (
                            <div className="flex justify-end">
                                <Button onClick={handleBulkAdd} disabled={isBulkAddingStudents}>
                                    {isBulkAddingStudents ? '추가 중...' : `${addSelectedIds.size}명 추가`}
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </DialogContent>
            </Dialog>

            {/* 일괄 제거 확인 다이얼로그 */}
            <AlertDialog open={showBulkRemoveConfirm} onOpenChange={setShowBulkRemoveConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>학생 제거</AlertDialogTitle>
                        <AlertDialogDescription>
                            선택한 {selectedIds.size}명의 학생을 이 학년&부서에서 제거하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkRemove} disabled={isBulkRemovingStudents}>
                            {isBulkRemovingStudents ? '제거 중...' : '제거'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MainLayout>
    );
}
