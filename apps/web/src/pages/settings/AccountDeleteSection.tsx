import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/features/auth';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

export function AccountDeleteSection() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const deleteAccountMutation = trpc.account.deleteAccount.useMutation();

    const handleDelete = async () => {
        setDeleteError(null);

        if (!deletePassword) {
            setDeleteError('비밀번호를 입력하세요.');
            return;
        }

        try {
            await deleteAccountMutation.mutateAsync({ password: deletePassword });
            logout();
            navigate('/login');
        } catch (err) {
            setDeleteError(extractErrorMessage(err));
        }
    };

    return (
        <Card className="border-destructive/50">
            <CardHeader>
                <CardTitle className="text-destructive">위험 영역</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                    계정을 삭제하면 모든 데이터(학년, 학생, 출석 기록)가 삭제됩니다.
                </p>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive">계정 삭제</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>정말로 계정을 삭제하시겠습니까?</AlertDialogTitle>
                            <AlertDialogDescription>
                                모든 데이터(학년, 학생, 출석 기록)가 삭제됩니다. 삭제 후 2년 이내에 동일한 아이디와
                                비밀번호로 로그인하면 계정을 복원할 수 있습니다.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2 px-1">
                            {deleteError && (
                                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                    {deleteError}
                                </div>
                            )}
                            <Label htmlFor="deletePassword">확인을 위해 비밀번호를 입력하세요</Label>
                            <Input
                                id="deletePassword"
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                placeholder="비밀번호…"
                                autoComplete="current-password"
                            />
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel
                                onClick={() => {
                                    setDeletePassword('');
                                    setDeleteError(null);
                                }}
                            >
                                취소
                            </AlertDialogCancel>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleteAccountMutation.isPending}
                            >
                                {deleteAccountMutation.isPending ? '삭제 중...' : '삭제'}
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
