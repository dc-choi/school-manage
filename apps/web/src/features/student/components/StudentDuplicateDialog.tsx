import type { ExistingStudentBrief } from '@school/shared';
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

interface StudentDuplicateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    existing: ExistingStudentBrief | null;
    onForce: () => void;
    onCancel: () => void;
    loading?: boolean;
}

const formatRegisteredDate = (iso: string): string => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

export function StudentDuplicateDialog({
    open,
    onOpenChange,
    existing,
    onForce,
    onCancel,
    loading = false,
}: StudentDuplicateDialogProps) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>이미 등록된 학생입니다</AlertDialogTitle>
                    <AlertDialogDescription>
                        같은 이름과 세례명의 학생이 이미 등록되어 있습니다. 그래도 등록할까요?
                    </AlertDialogDescription>
                </AlertDialogHeader>

                {existing ? (
                    <dl className="space-y-2 rounded-md border p-3 text-base">
                        <div className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">이름</dt>
                            <dd className="font-medium">{existing.societyName}</dd>
                        </div>
                        {existing.catholicName ? (
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">세례명</dt>
                                <dd>{existing.catholicName}</dd>
                            </div>
                        ) : null}
                        {existing.groupNames.length > 0 ? (
                            <div className="flex justify-between gap-3">
                                <dt className="text-muted-foreground">소속</dt>
                                <dd className="text-right">{existing.groupNames.join(' · ')}</dd>
                            </div>
                        ) : null}
                        <div className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">등록일</dt>
                            <dd>{formatRegisteredDate(existing.createdAt)}</dd>
                        </div>
                    </dl>
                ) : null}

                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onCancel} disabled={loading}>
                        취소
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onForce}
                        disabled={loading}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {loading ? '등록 중...' : '그래도 등록'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
