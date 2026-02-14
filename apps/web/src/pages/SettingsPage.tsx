import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '~/components/layout';
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
import { trpc } from '~/lib/trpc';

export function SettingsPage() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const utils = trpc.useUtils();

    // 계정 정보 조회
    const { data: accountData } = trpc.account.get.useQuery();

    // 이름 변경 상태
    const [displayName, setDisplayName] = useState('');
    const [nameInitialized, setNameInitialized] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [nameSuccess, setNameSuccess] = useState(false);

    // 비밀번호 변경 상태
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);

    // 계정 삭제 상태
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // accountData 로딩 시 displayName 초기화
    useEffect(() => {
        if (accountData && !nameInitialized) {
            setDisplayName(accountData.displayName);
            setNameInitialized(true);
        }
    }, [accountData, nameInitialized]);

    // Mutations
    const updateProfileMutation = trpc.account.updateProfile.useMutation({
        onSuccess: () => {
            utils.account.get.invalidate();
        },
    });
    const changePasswordMutation = trpc.account.changePassword.useMutation();
    const deleteAccountMutation = trpc.account.deleteAccount.useMutation();

    // 이름 변경
    const handleNameChange = async (e: FormEvent) => {
        e.preventDefault();
        setNameError(null);
        setNameSuccess(false);

        const trimmed = displayName.trim();
        if (trimmed.length < 2 || trimmed.length > 20) {
            setNameError('이름은 2자 이상 20자 이하여야 합니다.');
            return;
        }

        try {
            await updateProfileMutation.mutateAsync({ displayName: trimmed });
            setNameSuccess(true);
        } catch (err) {
            setNameError(err instanceof Error ? err.message : '이름 변경에 실패했습니다.');
        }
    };

    // 비밀번호 변경
    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordError(null);

        if (!currentPassword) {
            setPasswordError('현재 비밀번호를 입력하세요.');
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError('새 비밀번호는 8자 이상이어야 합니다.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            await changePasswordMutation.mutateAsync({ currentPassword, newPassword });
            logout();
            navigate('/login');
        } catch (err) {
            if (err instanceof Error && err.message.includes('일치하지 않습니다')) {
                setPasswordError('현재 비밀번호가 일치하지 않습니다.');
            } else {
                setPasswordError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
            }
        }
    };

    // 계정 삭제
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
            if (err instanceof Error && err.message.includes('일치하지 않습니다')) {
                setDeleteError('비밀번호가 일치하지 않습니다.');
            } else {
                setDeleteError(err instanceof Error ? err.message : '계정 삭제에 실패했습니다.');
            }
        }
    };

    return (
        <MainLayout title="계정 설정">
            <div className="mx-auto max-w-2xl space-y-6">
                {/* 이름 변경 */}
                <Card>
                    <CardHeader>
                        <CardTitle>이름 변경</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleNameChange} className="space-y-4">
                            {nameError && (
                                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                    {nameError}
                                </div>
                            )}
                            {nameSuccess && (
                                <div className="rounded-md border border-green-500/50 bg-green-50 p-3 text-sm text-green-600">
                                    이름이 변경되었습니다.
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="displayName">이름</Label>
                                <Input
                                    id="displayName"
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={updateProfileMutation.isPending}>
                                    {updateProfileMutation.isPending ? '저장 중...' : '저장'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* 비밀번호 변경 */}
                <Card>
                    <CardHeader>
                        <CardTitle>비밀번호 변경</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            {passwordError && (
                                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                    {passwordError}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">현재 비밀번호</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="현재 비밀번호를 입력하세요"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">새 비밀번호</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="8자 이상 입력하세요"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="새 비밀번호를 다시 입력하세요"
                                />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={changePasswordMutation.isPending}>
                                    {changePasswordMutation.isPending ? '변경 중...' : '변경하기'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* 위험 영역 */}
                <Card className="border-destructive/50">
                    <CardHeader>
                        <CardTitle className="text-destructive">위험 영역</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            계정을 삭제하면 모든 데이터(그룹, 멤버, 출석 기록)가 삭제됩니다.
                        </p>
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive">계정 삭제</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>정말로 계정을 삭제하시겠습니까?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        모든 데이터(그룹, 멤버, 출석 기록)가 삭제됩니다. 삭제 후 2년 이내에 동일한
                                        아이디와 비밀번호로 로그인하면 계정을 복원할 수 있습니다.
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
                                        placeholder="비밀번호"
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
            </div>
        </MainLayout>
    );
}
