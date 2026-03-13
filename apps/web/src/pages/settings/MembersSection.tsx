import { ROLE } from '@school/shared';
import { formatDateKR } from '@school/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useAuth } from '~/features/auth';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

export function MembersSection() {
    const { role } = useAuth();
    const utils = trpc.useUtils();
    const { data, isLoading } = trpc.organization.members.useQuery();
    const transferMutation = trpc.organization.transferAdmin.useMutation({
        onSuccess: () => {
            toast.success('관리자가 양도되었습니다');
            utils.account.get.invalidate();
            utils.organization.members.invalidate();
        },
    });

    const [transferTarget, setTransferTarget] = useState<{ id: string; name: string } | null>(null);
    const [transferError, setTransferError] = useState<string | null>(null);

    if (isLoading) return null;

    const members = data?.members ?? [];
    if (members.length <= 1) return null;

    const isAdmin = role === ROLE.ADMIN;

    const handleTransfer = async () => {
        if (!transferTarget) return;
        setTransferError(null);

        try {
            await transferMutation.mutateAsync({ targetAccountId: transferTarget.id });
            setTransferTarget(null);
        } catch (err) {
            setTransferError(extractErrorMessage(err));
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle>멤버 목록</CardTitle>
                        <Badge>{members.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {members.map((member) => (
                            <li key={member.id} className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium">{member.displayName}</p>
                                        <Badge variant={member.role === ROLE.ADMIN ? 'default' : 'secondary'}>
                                            {member.role === ROLE.ADMIN ? '관리자' : '선생님'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDateKR(member.joinedAt)} 합류
                                    </p>
                                </div>
                                {isAdmin && member.role === ROLE.TEACHER ? (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setTransferTarget({ id: member.id, name: member.displayName })}
                                        disabled={transferMutation.isPending}
                                        aria-label={`${member.displayName}에게 관리자 양도`}
                                    >
                                        양도
                                    </Button>
                                ) : null}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <AlertDialog open={!!transferTarget} onOpenChange={() => setTransferTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>관리자를 양도하시겠습니까?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {transferTarget?.name}님에게 관리자 권한을 양도합니다. 양도 후 선생님 역할로 전환됩니다.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    {transferError ? (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {transferError}
                        </div>
                    ) : null}
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={() => {
                                setTransferError(null);
                            }}
                        >
                            취소
                        </AlertDialogCancel>
                        <Button variant="destructive" onClick={handleTransfer} disabled={transferMutation.isPending}>
                            {transferMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    양도 중...
                                </>
                            ) : (
                                '양도'
                            )}
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
