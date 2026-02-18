import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Card } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { TableBody, TableCell, TableHead, TableHeader, TableRow, Table as UITable } from '~/components/ui/table';
import { useGroups } from '~/features/group';

export function GroupListPage() {
    const navigate = useNavigate();
    const { groups, isLoading, bulkDelete, isBulkDeleting } = useGroups();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

    const handleBulkDelete = async () => {
        if (selectedIds.size > 0) {
            await bulkDelete(Array.from(selectedIds));
            setSelectedIds(new Set());
            setShowBulkDeleteDialog(false);
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(new Set(groups.map((g) => g.id)));
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

    const isAllSelected = groups.length > 0 && selectedIds.size === groups.length;
    const isSomeSelected = selectedIds.size > 0 && selectedIds.size < groups.length;
    const selectedGroups = groups.filter((g) => selectedIds.has(g.id));

    if (isLoading) {
        return (
            <MainLayout title="그룹 목록">
                <Card className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </Card>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="그룹 목록">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
                <div className="flex gap-2">
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
                    그룹 추가
                </Button>
            </div>

            <Card>
                <UITable>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={isAllSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = isSomeSelected;
                                    }}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="전체 선택"
                                />
                            </TableHead>
                            <TableHead>그룹명</TableHead>
                            <TableHead className="w-24 text-center">인원</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groups.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    등록된 그룹이 없습니다.
                                    <br />
                                    그룹을 만들면 멤버를 등록할 수 있어요.
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
                        <AlertDialogTitle>그룹 일괄 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            다음 {selectedIds.size}개의 그룹을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
