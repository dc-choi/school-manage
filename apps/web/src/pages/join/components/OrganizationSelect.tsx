import { ORGANIZATION_TYPE } from '@school/trpc/shared';
import { Loader2, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

const ORG_TYPE_LABELS: Record<string, string> = {
    ELEMENTARY: '초등부',
    MIDDLE_HIGH: '중고등부',
    YOUNG_ADULT: '청년',
};

interface OrganizationSelectProps {
    churchId: string;
}

export function OrganizationSelect({ churchId }: OrganizationSelectProps) {
    const navigate = useNavigate();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgType, setNewOrgType] = useState<'ELEMENTARY' | 'MIDDLE_HIGH' | 'YOUNG_ADULT'>(
        ORGANIZATION_TYPE.MIDDLE_HIGH
    );
    const [createError, setCreateError] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);

    const { data, isLoading, error } = trpc.organization.list.useQuery({ churchId });

    const joinMutation = trpc.organization.requestJoin.useMutation({
        onSuccess: () => {
            toast.success('합류 요청을 보냈습니다. 승인을 기다려주세요.');
            navigate('/pending');
        },
        onError: (err) => {
            setJoinError(extractErrorMessage(err));
        },
    });

    const createMutation = trpc.organization.create.useMutation({
        onSuccess: () => {
            setDialogOpen(false);
            setNewOrgName('');
            setNewOrgType(ORGANIZATION_TYPE.MIDDLE_HIGH);
            setCreateError(null);
            toast.success('단체가 생성되었습니다.');
            // 새로고침으로 AuthProvider 초기화 (새 organizationId 반영)
            window.location.href = '/';
        },
        onError: (err) => {
            setCreateError(extractErrorMessage(err));
        },
    });

    const handleJoin = (organizationId: string) => {
        setJoinError(null);
        joinMutation.mutate({ organizationId });
    };

    const handleCreate = () => {
        if (!newOrgName.trim()) return;
        setCreateError(null);
        createMutation.mutate({ churchId, name: newOrgName.trim(), type: newOrgType });
    };

    const organizations = data?.organizations ?? [];
    const isMutating = joinMutation.isPending || createMutation.isPending;

    return (
        <div className="space-y-4">
            {joinError ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {joinError}
                </div>
            ) : null}

            {/* 단체 목록 */}
            <div className="min-h-[120px]">
                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-6 w-6 animate-spin" aria-label="단체 목록 불러오는 중" />
                    </div>
                ) : error ? (
                    <div className="text-center p-8 text-destructive">단체 목록을 불러오지 못했습니다.</div>
                ) : organizations.length === 0 ? (
                    <div className="text-center p-8 text-muted-foreground">
                        등록된 단체가 없습니다. 새로 만들어주세요.
                    </div>
                ) : (
                    <ul className="space-y-1" role="listbox" aria-label="단체 목록">
                        {organizations.map((org) => (
                            <li key={org.id} role="option" aria-selected={false}>
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between rounded-md px-3 py-3 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
                                    onClick={() => handleJoin(org.id)}
                                    disabled={isMutating}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{org.name}</span>
                                    </div>
                                    <Badge variant="secondary">
                                        <Users className="h-3 w-3" aria-hidden="true" />
                                        {org.memberCount}명
                                    </Badge>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* 새로 만들기 */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                    setDialogOpen(true);
                    setCreateError(null);
                    setNewOrgName('');
                    setNewOrgType(ORGANIZATION_TYPE.MIDDLE_HIGH);
                }}
                disabled={isMutating}
            >
                <Plus className="h-4 w-4" aria-hidden="true" />
                새로 만들기
            </Button>

            {/* 단체 생성 다이얼로그 */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>단체 만들기</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {createError ? (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {createError}
                            </div>
                        ) : null}
                        <div className="space-y-2">
                            <Label htmlFor="new-org-name">단체 이름</Label>
                            <Input
                                id="new-org-name"
                                type="text"
                                value={newOrgName}
                                onChange={(e) => setNewOrgName(e.target.value)}
                                placeholder="단체 이름을 입력하세요…"
                                spellCheck={false}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreate();
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-org-type">단체 유형</Label>
                            <Select value={newOrgType} onValueChange={(v) => setNewOrgType(v as typeof newOrgType)}>
                                <SelectTrigger id="new-org-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ORG_TYPE_LABELS).map(([value, label]) => (
                                        <SelectItem key={value} value={value}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            disabled={createMutation.isPending}
                        >
                            취소
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreate}
                            disabled={!newOrgName.trim() || createMutation.isPending}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                                    생성 중...
                                </>
                            ) : (
                                '만들기'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
