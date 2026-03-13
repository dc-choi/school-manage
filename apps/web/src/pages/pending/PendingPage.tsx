import { JOIN_REQUEST_STATUS } from '@school/shared';
import { Clock, Loader2, XCircle } from 'lucide-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useAuth } from '~/features/auth';
import { trpc } from '~/lib/trpc';

export function PendingPage() {
    const { organizationId, logout, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    // 주기적으로 계정 정보를 폴링하여 승인/거절 여부 확인
    const { data: accountData, isLoading: isPolling } = trpc.account.get.useQuery(undefined, {
        refetchInterval: 10_000,
    });

    const isRejected = accountData?.joinRequestStatus === JOIN_REQUEST_STATUS.REJECTED;

    // organizationId가 이미 있으면 대시보드로 리다이렉트 (이미 승인된 상태)
    useEffect(() => {
        if (organizationId) {
            navigate('/', { replace: true });
        }
    }, [organizationId, navigate]);

    // 폴링으로 승인 감지 시 새로고침하여 AuthProvider 갱신
    useEffect(() => {
        if (accountData?.organizationId) {
            window.location.href = '/';
        }
    }, [accountData?.organizationId]);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    if (isAuthLoading) {
        return (
            <AuthLayout>
                <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" aria-label="로딩 중" />
                </div>
            </AuthLayout>
        );
    }

    // 거절된 경우
    if (isRejected) {
        return (
            <AuthLayout>
                <Card className="text-center">
                    <CardHeader>
                        <div className="flex justify-center">
                            <XCircle className="h-12 w-12 text-red-600" aria-hidden="true" />
                        </div>
                        <CardTitle className="text-2xl">합류 요청이 거절되었습니다</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground">
                            관리자가 합류 요청을 거절했습니다.
                            <br />
                            다른 조직에 합류하거나 새로운 조직을 만들 수 있습니다.
                        </p>
                        <Button onClick={() => navigate('/join', { replace: true })}>다시 합류하기</Button>
                    </CardContent>
                </Card>
                <div className="mt-4 text-center">
                    <Button variant="link" onClick={handleLogout}>
                        로그아웃
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout>
            <Card className="text-center">
                <CardHeader>
                    <div className="flex justify-center">
                        <Clock className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-2xl">관리자의 승인을 기다리고 있습니다</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div aria-live="polite">
                        <p className="text-muted-foreground">
                            합류 요청이 접수되었습니다.
                            <br />
                            관리자가 승인하면 자동으로 이동합니다.
                        </p>
                        {isPolling ? null : (
                            <p className="mt-2 text-sm text-muted-foreground">승인 상태를 확인하고 있습니다...</p>
                        )}
                    </div>
                </CardContent>
            </Card>
            <div className="mt-4 text-center">
                <Button variant="link" onClick={handleLogout}>
                    로그아웃
                </Button>
            </div>
        </AuthLayout>
    );
}
