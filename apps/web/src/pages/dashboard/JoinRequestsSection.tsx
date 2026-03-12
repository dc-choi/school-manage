import { formatDateKR } from '@school/utils';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
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
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { trpc } from '~/lib/trpc';

export function JoinRequestsSection() {
    const utils = trpc.useUtils();
    const { data, isLoading } = trpc.organization.pendingRequests.useQuery();
    const approveMutation = trpc.organization.approveJoin.useMutation({
        onSuccess: () => {
            toast.success('승인되었습니다');
            utils.organization.pendingRequests.invalidate();
        },
    });
    const rejectMutation = trpc.organization.rejectJoin.useMutation({
        onSuccess: () => {
            toast.success('거절되었습니다');
            utils.organization.pendingRequests.invalidate();
        },
    });

    const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

    if (isLoading) return null;

    const requests = data?.requests ?? [];
    if (requests.length === 0) return null;

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">합류 요청</CardTitle>
                        <Badge>{requests.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {requests.map((req) => (
                            <li key={req.id} className="flex items-center justify-between rounded-md border p-3">
                                <div>
                                    <p className="font-medium">{req.accountDisplayName}</p>
                                    <p className="text-sm text-muted-foreground">{formatDateKR(req.createdAt)} 요청</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => approveMutation.mutate({ joinRequestId: req.id })}
                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                        aria-label={`${req.accountDisplayName} 승인`}
                                    >
                                        {approveMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            '승인'
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setRejectTarget({ id: req.id, name: req.accountDisplayName })}
                                        disabled={approveMutation.isPending || rejectMutation.isPending}
                                        aria-label={`${req.accountDisplayName} 거절`}
                                    >
                                        거절
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

            <AlertDialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>합류 요청 거절</AlertDialogTitle>
                        <AlertDialogDescription>
                            {rejectTarget?.name}님의 합류 요청을 거절하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (rejectTarget) {
                                    rejectMutation.mutate({ joinRequestId: rejectTarget.id });
                                    setRejectTarget(null);
                                }
                            }}
                        >
                            거절
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
