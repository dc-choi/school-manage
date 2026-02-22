import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Table } from '~/components/common';
import { MainLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useGroups } from '~/features/group';
import { extractErrorMessage } from '~/lib/error';

function formatPhoneNumber(contact: number | undefined): string {
    if (!contact) return '-';
    // 숫자로 저장되면서 앞의 0이 사라진 경우 (1012341234 → 01012341234)
    const str = String(contact).padStart(11, '0');
    return `${str.slice(0, 3)}-${str.slice(3, 7)}-${str.slice(7)}`;
}

export function GroupDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { getQuery, update, isUpdating } = useGroups();
    const { data: group, isLoading, error } = getQuery(id ?? '');

    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState('');

    // 그룹 데이터가 로드되면 editedName 초기화
    useEffect(() => {
        if (group?.name) {
            setEditedName(group.name);
        }
    }, [group?.name]);

    const handleSave = async () => {
        if (!id || !editedName.trim()) return;
        try {
            await update({ id, name: editedName.trim() });
            setIsEditing(false);
        } catch (e) {
            toast.error(extractErrorMessage(e));
        }
    };

    const handleCancel = () => {
        setEditedName(group?.name ?? '');
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (error) {
        return (
            <MainLayout title="학년 상세">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-center text-destructive">학년을 불러오는데 실패했습니다.</p>
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

    const columns = [
        { key: 'societyName', header: '이름' },
        { key: 'catholicName', header: '세례명' },
        {
            key: 'age',
            header: '나이',
            render: (row: NonNullable<typeof group>['students'][0]) => (row.age ? `${row.age}세` : '-'),
        },
        {
            key: 'contact',
            header: '연락처',
            render: (row: NonNullable<typeof group>['students'][0]) => formatPhoneNumber(row.contact),
        },
    ];

    return (
        <MainLayout title="학년 상세">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex-1">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            className="text-2xl font-bold"
                                            autoFocus
                                        />
                                        <Button
                                            onClick={handleSave}
                                            disabled={isUpdating || !editedName.trim()}
                                            className="min-w-24"
                                        >
                                            {isUpdating ? '저장 중...' : '저장'}
                                        </Button>
                                        <Button variant="outline" onClick={handleCancel} className="min-w-24">
                                            취소
                                        </Button>
                                    </div>
                                ) : (
                                    <div
                                        className="cursor-pointer rounded-md p-1 hover:bg-muted/50"
                                        onClick={() => group && setIsEditing(true)}
                                        title="클릭하여 수정"
                                    >
                                        <CardTitle className="text-2xl">
                                            {isLoading ? '로딩 중...' : group?.name}
                                        </CardTitle>
                                        <CardDescription>학년 정보 (클릭하여 수정)</CardDescription>
                                    </div>
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
                        <CardTitle>학생 목록</CardTitle>
                        <CardDescription>
                            {isLoading ? '로딩 중...' : `총 ${group?.students.length ?? 0}명의 학생이 있습니다.`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table
                            columns={columns}
                            data={group?.students ?? []}
                            keyExtractor={(row) => row.id}
                            isLoading={isLoading}
                            emptyMessage="등록된 학생이 없습니다."
                        />
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    );
}
