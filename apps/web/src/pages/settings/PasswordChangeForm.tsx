import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/features/auth';
import { extractErrorMessage } from '~/lib/error';
import { trpc } from '~/lib/trpc';

export function PasswordChangeForm() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState<string | null>(null);

    const changePasswordMutation = trpc.account.changePassword.useMutation();

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
            setPasswordError(extractErrorMessage(err));
        }
    };

    return (
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
                            placeholder="현재 비밀번호를 입력하세요…"
                            autoComplete="current-password"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">새 비밀번호</Label>
                        <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="8자 이상 입력하세요…"
                            autoComplete="new-password"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="새 비밀번호를 다시 입력하세요…"
                            autoComplete="new-password"
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
    );
}
