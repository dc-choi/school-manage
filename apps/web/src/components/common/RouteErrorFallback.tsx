import { useNavigate, useRouteError } from 'react-router-dom';
import { MainLayout } from '~/components/layout';

export function RouteErrorFallback() {
    const error = useRouteError();
    const navigate = useNavigate();

    console.error('[RouteErrorFallback]', error);

    return (
        <MainLayout>
            <div className="flex items-center justify-center py-20">
                <div className="space-y-4 text-center">
                    <h2 className="text-2xl font-bold">페이지를 표시할 수 없습니다</h2>
                    <p className="text-muted-foreground">예상치 못한 문제가 발생했습니다.</p>
                    <div className="flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
                        >
                            홈으로
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            새로고침
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
