import { type FormEvent, useEffect, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { trpc } from '~/lib/trpc';

export function NameChangeForm() {
    const utils = trpc.useUtils();
    const { data: accountData } = trpc.account.get.useQuery();

    const [displayName, setDisplayName] = useState('');
    const [nameInitialized, setNameInitialized] = useState(false);
    const [nameError, setNameError] = useState<string | null>(null);
    const [nameSuccess, setNameSuccess] = useState(false);

    useEffect(() => {
        if (accountData && !nameInitialized) {
            setDisplayName(accountData.displayName);
            setNameInitialized(true);
        }
    }, [accountData, nameInitialized]);

    const updateProfileMutation = trpc.account.updateProfile.useMutation({
        onSuccess: () => {
            utils.account.get.invalidate();
        },
    });

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

    return (
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
                            placeholder="이름을 입력하세요…"
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
    );
}
