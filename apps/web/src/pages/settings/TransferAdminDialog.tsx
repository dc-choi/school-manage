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

interface TransferAdminDialogProps {
    target: { id: string; name: string } | null;
    onClose: () => void;
}

export function TransferAdminDialog({ target, onClose }: TransferAdminDialogProps) {
    const utils = trpc.useUtils();
    const [error, setError] = useState<string | null>(null);
    const mutation = trpc.organization.transferAdmin.useMutation({
        onSuccess: () => {
            toast.success('관리자가 양도되었습니다');
            utils.account.get.invalidate();
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
                    <AlertDialogTitle>관리자를 양도하시겠습니까?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {target?.name}님에게 관리자 권한을 양도합니다. 양도 후 선생님 역할로 전환됩니다.
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
                                    양도 중...
                                </>
                            ) : (
                                '양도'
                            )}
                        </Button>
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
