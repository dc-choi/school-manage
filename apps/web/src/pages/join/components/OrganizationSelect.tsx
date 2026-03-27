import { ORGANIZATION_TYPE } from '@school/shared';
import { Loader2, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Pagination } from '~/components/common/Pagination';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

const ORG_TYPE_LABELS: Record<string, { label: string; desc: string }> = {
    ELEMENTARY: { label: '초등부', desc: '만 14세 졸업' },
    MIDDLE_HIGH: { label: '중고등부', desc: '만 20세 졸업' },
    YOUNG_ADULT: { label: '청년', desc: '졸업 없음' },
};

interface OrganizationSelectProps {
    churchId: string;
}

export function OrganizationSelect({ churchId }: OrganizationSelectProps) {
    const navigate = useNavigate();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgType, setNewOrgType] = useState<'' | 'ELEMENTARY' | 'MIDDLE_HIGH' | 'YOUNG_ADULT'>('');
    const [createError, setCreateError] = useState<string | null>(null);
    const [joinError, setJoinError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    const { data, isLoading, error } = trpc.organization.list.useQuery({ churchId, page });

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
            setNewOrgType('');
            setCreateError(null);
            toast.success('단체가 생성되었습니다.');
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
        if (!newOrgName.trim() || !newOrgType) return;
        setCreateError(null);
        createMutation.mutate({ churchId, name: newOrgName.trim(), type: newOrgType });
    };

    const organizations = data?.organizations ?? [];
    const isMutating = joinMutation.isPending || createMutation.isPending;

    // F3: 이름-타입 불일치 경고 (파생 계산)
    const trimmedName = newOrgName.trim();
    const mismatchWarning = (() => {
        if (!trimmedName || !newOrgType) return null;
        if (trimmedName.includes('초등') && newOrgType !== ORGANIZATION_TYPE.ELEMENTARY)
            return "이름에 '초등'이 포함되어 있습니다. 초등부가 맞는지 확인해주세요.";
        if (trimmedName.includes('중고등') && newOrgType !== ORGANIZATION_TYPE.MIDDLE_HIGH)
            return "이름에 '중고등'이 포함되어 있습니다. 중고등부가 맞는지 확인해주세요.";
        if (trimmedName.includes('청년') && newOrgType !== ORGANIZATION_TYPE.YOUNG_ADULT)
            return "이름에 '청년'이 포함되어 있습니다. 청년이 맞는지 확인해주세요.";
        return null;
    })();

    // F4: 동일 이름 모임 차단 (파생 계산)
    const duplicateName = trimmedName.length > 0 && organizations.some((org) => org.name === trimmedName);

    return (
        <div className="space-y-4">
            {joinError ? (
                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                    {joinError}
                </div>
            ) : null}

            {/* 단체 목록 */}
            <div className="min-h-[120px] max-h-[280px] overflow-y-auto">
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
                    <ul className="space-y-1" role="list" aria-label="단체 목록">
                        {organizations.map((org) => (
                            <li key={org.id} role="listitem">
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

            {data?.totalPage ? (
                <Pagination currentPage={page} totalPages={data.totalPage} onPageChange={setPage} />
            ) : null}

            <p className="text-sm text-muted-foreground">
                단체는 본당 내 초등부, 중고등부, 청년부 등의 조직 단위입니다. 먼저 목록에서 단체를 찾아보세요. 이미
                등록된 단체가 있을 수 있습니다.
            </p>

            {/* 새로 만들기 */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                    setDialogOpen(true);
                    setCreateError(null);
                    setNewOrgName('');
                    setNewOrgType('');
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
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            단체는 본당 내 초등부, 중고등부, 청년부 등의 조직 단위입니다. 먼저 목록에서 단체를
                            찾아보세요. 이미 등록된 단체가 있을 수 있습니다.
                        </div>
                        {createError ? (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {createError}
                            </div>
                        ) : null}
                        {duplicateName ? (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                이미 &apos;{trimmedName}&apos;이(가) 있습니다. 목록에서 선택하세요.
                            </div>
                        ) : null}
                        {mismatchWarning ? (
                            <div className="rounded-md border border-yellow-500/50 bg-yellow-50 p-3 text-sm text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400">
                                {mismatchWarning}
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
                            <Select
                                value={newOrgType}
                                onValueChange={(v) => setNewOrgType(v as 'ELEMENTARY' | 'MIDDLE_HIGH' | 'YOUNG_ADULT')}
                            >
                                <SelectTrigger id="new-org-type">
                                    <SelectValue placeholder="단체 유형을 선택하세요…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ORG_TYPE_LABELS).map(([value, { label, desc }]) => (
                                        <SelectItem key={value} value={value}>
                                            <div>
                                                <div className="font-medium">{label}</div>
                                                <div className="text-xs text-muted-foreground">{desc}</div>
                                            </div>
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
                            disabled={!trimmedName || !newOrgType || duplicateName || createMutation.isPending}
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
