import { GROUP_TYPE, type GroupType } from '@school/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
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
import { Card } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';
import { useGroups } from '~/features/group';
import { extractErrorMessage } from '~/lib/error';

const TYPE_LABEL: Record<string, string> = {
    [GROUP_TYPE.GRADE]: '학년',
    [GROUP_TYPE.DEPARTMENT]: '부서',
};

export function GroupListPage() {
    const navigate = useNavigate();
    const [typeFilter, setTypeFilter] = useState<GroupType | undefined>(undefined);
    const { groups, isLoading, bulkDelete, isBulkDeleting } = useGroups(typeFilter);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const handleBulkDelete = async () => {
        if (selectedIds.size > 0) {
            try {
                await bulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set());
                setShowBulkDeleteDialog(false);
            } catch (err) {
                toast.error(extractErrorMessage(err));
            }
        }
    };

    const selectAll = () => setSelectedIds(new Set(groups.map((g) => g.id)));
    const deselectAll = () => setSelectedIds(new Set());

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSet = new Set(selectedIds);
        if (checked) {
            newSet.add(id);
        } else {
            newSet.delete(id);
        }
        setSelectedIds(newSet);
    };

    const isAllSelected = groups.length > 0 && selectedIds.size === groups.length;
    const isSomeSelected = selectedIds.size > 0 && selectedIds.size < groups.length;
    const selectedGroups = groups.filter((g) => selectedIds.has(g.id));

    if (isLoading) {
        return (
            <MainLayout title="학년&부서 목록">
                <Card className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </Card>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="학년&부서 목록">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex gap-2">
                    <Select
                        value={typeFilter ?? 'all'}
                        onValueChange={(v) => {
                            setTypeFilter(v === 'all' ? undefined : (v as GroupType));
                            setSelectedIds(new Set());
                        }}
                    >
                        <SelectTrigger className="w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">전체</SelectItem>
                            <SelectItem value={GROUP_TYPE.GRADE}>학년</SelectItem>
                            <SelectItem value={GROUP_TYPE.DEPARTMENT}>부서</SelectItem>
                        </SelectContent>
                    </Select>
                    {selectedIds.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={() => setShowBulkDeleteDialog(true)}
                            disabled={isBulkDeleting}
                        >
                            선택 삭제 ({selectedIds.size})
                        </Button>
                    )}
                </div>
                <Button onClick={() => navigate('/groups/new')} className="w-full sm:w-auto">
                    학년&부서 추가
                </Button>
            </div>

            <Card className="overflow-x-auto">
                <UITable>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={isAllSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = isSomeSelected;
                                    }}
                                    onCheckedChange={(checked) => {
                                        if (checked) selectAll();
                                        else deselectAll();
                                    }}
                                    aria-label="전체 선택"
                                />
                            </TableHead>
                            <TableHead>이름</TableHead>
                            <TableHead className="w-20 text-center">유형</TableHead>
                            <TableHead className="w-24 text-center">인원</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                    등록된 학년&부서가 없습니다.
                                    <br />
                                    학년&부서를 만들면 학생을 등록할 수 있어요.
                                </TableCell>
                            </TableRow>
                        ) : (
                            groups.map((row) => (
                                <TableRow
                                    key={row.id}
                                    onClick={() => navigate(`/groups/${row.id}`)}
                                    className="cursor-pointer hover:bg-muted/50"
                                    data-selected={selectedIds.has(row.id) ? 'true' : undefined}
                                >
                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                        <Checkbox
                                            checked={selectedIds.has(row.id)}
                                            onCheckedChange={(checked) => handleSelectOne(row.id, checked)}
                                            aria-label={`${row.name} 선택`}
                                        />
                                    </TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={row.type === GROUP_TYPE.GRADE ? 'default' : 'secondary'}>
                                            {TYPE_LABEL[row.type] ?? row.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-center">{row.studentCount}명</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </UITable>
            </Card>

            {/* 일괄 삭제 다이얼로그 */}
            <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>학년&부서 일괄 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            다음 {selectedIds.size}개의 학년&부서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                            <ul className="mt-2 list-inside list-disc text-sm">
                                {selectedGroups.map((g) => (
                                    <li key={g.id}>{g.name}</li>
                                ))}
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkDeleting}>
                            {isBulkDeleting ? '삭제 중...' : `${selectedIds.size}개 삭제`}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </MainLayout>
    );
}
