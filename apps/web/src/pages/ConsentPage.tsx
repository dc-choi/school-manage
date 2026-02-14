import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { PrivacyPolicyDialog } from '~/components/common/PrivacyPolicyDialog';
import { AuthLayout } from '~/components/layout';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '~/components/ui/alert-dialog';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/features/auth';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

export function ConsentPage() {
    const { isAuthenticated, isLoading, privacyAgreedAt, logout } = useAuth();
    const navigate = useNavigate();
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const utils = trpc.useUtils();
    const agreePrivacyMutation = trpc.account.agreePrivacy.useMutation();

    // GA4: 동의 UI 노출
    useEffect(() => {
        if (isAuthenticated && !privacyAgreedAt) {
            analytics.trackPrivacyConsentShown('consent');
        }
    }, [isAuthenticated, privacyAgreedAt]);

    // 미인증 → 로그인
    if (!isLoading && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 이미 동의 완료 → 대시보드
    if (!isLoading && privacyAgreedAt) {
        return <Navigate to="/" replace />;
    }

    const handleAgree = async () => {
        setError(null);
        try {
            await agreePrivacyMutation.mutateAsync();
            analytics.trackPrivacyConsentAgreed('consent');
            await utils.account.get.invalidate();
            navigate('/');
        } catch {
            setError('동의 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
    };

    const handleDecline = () => {
        analytics.trackPrivacyConsentDeclined();
        logout();
        navigate('/login');
    };

    return (
        <AuthLayout>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">개인정보 수집·이용 동의</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    {/* 동의 체크박스 */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="privacy-consent"
                            checked={agreed}
                            onCheckedChange={(checked) => setAgreed(checked === true)}
                        />
                        <Label htmlFor="privacy-consent" className="cursor-pointer text-sm">
                            개인정보 수집·이용에 동의합니다
                        </Label>
                    </div>
                    <PrivacyPolicyDialog>
                        <button type="button" className="text-xs text-muted-foreground underline hover:text-foreground">
                            개인정보 처리방침 보기
                        </button>
                    </PrivacyPolicyDialog>

                    <Button
                        className="w-full"
                        disabled={!agreed || agreePrivacyMutation.isPending}
                        onClick={handleAgree}
                    >
                        {agreePrivacyMutation.isPending ? '처리 중...' : '동의하고 계속하기'}
                    </Button>
                </CardContent>
                <CardFooter className="justify-center">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" className="text-sm text-muted-foreground">
                                동의하지 않습니다
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>서비스 이용 불가</AlertDialogTitle>
                                <AlertDialogDescription>
                                    동의하지 않으면 서비스를 이용할 수 없습니다. 로그아웃하시겠습니까?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>취소</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDecline}>로그아웃</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            </Card>
        </AuthLayout>
    );
}
