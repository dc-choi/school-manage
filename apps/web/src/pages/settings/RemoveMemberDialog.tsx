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
import { Button } from '~/components/ui/button';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

interface RemoveMemberDialogProps {
    target: { id: string; name: string } | null;
    onClose: () => void;
}

export function RemoveMemberDialog({ target, onClose }: RemoveMemberDialogProps) {
    const utils = trpc.useUtils();
    const [error, setError] = useState<string | null>(null);
    const mutation = trpc.organization.removeMember.useMutation({
        onSuccess: () => {
            toast.success('멤버가 제거되었습니다');
            utils.organization.members.invalidate();
        },
    });

    const handleConfirm = async () => {
        if (!target) return;
        setError(null);
        try {
            await mutation.mutateAsync({ targetAccountId: target.id });
            onClose();
        } catch (err) {
            setError(extractErrorMessage(err));
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open && !mutation.isPending) {
            onClose();
            setError(null);
        }
    };

    return (
        <AlertDialog open={!!target} onOpenChange={handleOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>멤버를 제거하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {target?.name}님을 조직에서 제거합니다. 이 사용자는 다른 모임에 다시 합류 요청할 수 있습니다.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {error ? (
                    <div
                        role="alert"
                        className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                    >
                        {error}
                    </div>
                ) : null}
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={mutation.isPending}>취소</AlertDialogCancel>
                    <AlertDialogAction asChild>
                        <Button variant="destructive" onClick={handleConfirm} disabled={mutation.isPending}>
                            {mutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    제거 중...
                                </>
                            ) : (
                                '제거'
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
