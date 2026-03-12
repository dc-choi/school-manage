import { ChurchSelect } from './components/ChurchSelect';
import { OrganizationSelect } from './components/OrganizationSelect';
import { ParishSelect } from './components/ParishSelect';
import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { useAuth } from '~/features/auth';

const STEP_TITLES = ['교구 선택', '본당 선택', '단체 선택'] as const;

export function JoinPage() {
    const { isAuthenticated, isLoading, organizationId, logout } = useAuth();
    const [step, setStep] = useState(1);
    const [parishId, setParishId] = useState<string | null>(null);
    const [churchId, setChurchId] = useState<string | null>(null);

    // 미인증 -> 로그인
    if (!isLoading && !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 이미 단체에 소속된 경우 -> 대시보드
    if (!isLoading && organizationId) {
        return <Navigate to="/" replace />;
    }

    const handleParishSelect = (id: string) => {
        setParishId(id);
        // 교구가 바뀌면 본당 선택 초기화
        setChurchId(null);
        setStep(2);
    };

    const handleChurchSelect = (id: string) => {
        setChurchId(id);
        setStep(3);
    };

    const handleBack = () => {
        if (step === 2) {
            setStep(1);
        } else if (step === 3) {
            setChurchId(null);
            setStep(2);
        }
    };

    return (
        <AuthLayout>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="text-sm text-muted-foreground" aria-label={`3단계 중 ${step}단계`}>
                        단계 {step}/3
                    </div>
                    <CardTitle className="text-2xl">{STEP_TITLES[step - 1]}</CardTitle>
                </CardHeader>
                <CardContent>
                    {step === 1 ? (
                        <ParishSelect value={parishId} onChange={handleParishSelect} />
                    ) : step === 2 && parishId ? (
                        <ChurchSelect parishId={parishId} value={churchId} onChange={handleChurchSelect} />
                    ) : step === 3 && churchId ? (
                        <OrganizationSelect churchId={churchId} />
                    ) : null}
                </CardContent>
                {step > 1 && (
                    <CardFooter>
                        <Button type="button" variant="ghost" onClick={handleBack}>
                            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                            이전
                        </Button>
                    </CardFooter>
                )}
            </Card>
            <div className="mt-4 text-center">
                <Button variant="link" onClick={logout}>
                    로그아웃
                </Button>
            </div>
        </AuthLayout>
    );
}
