import { type FormEvent, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/features/auth';
import { trpc } from '~/lib/trpc';

export function ResetPasswordPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resetMutation = trpc.auth.resetPassword.useMutation();

    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (isAuthenticated && !isAuthLoading) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError('아이디를 입력하세요.');
            return;
        }
        if (!email.trim()) {
            setError('이메일을 입력하세요.');
            return;
        }

        try {
            const result = await resetMutation.mutateAsync({ name: name.trim(), email: email.trim() });
            if (result.emailFailed) {
                setError('이메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.');
                return;
            }
            setIsSubmitted(true);
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('요청 처리 중 오류가 발생했습니다.');
            }
        }
    };

    return (
        <AuthLayout>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">비밀번호 찾기</CardTitle>
                </CardHeader>
                <CardContent>
                    {isSubmitted ? (
                        <div className="space-y-4 text-center">
                            <p className="text-sm text-muted-foreground">임시 비밀번호가 이메일로 발송되었습니다.</p>
                            <p className="text-sm text-muted-foreground">로그인 후 반드시 비밀번호를 변경해 주세요.</p>
                            <Button className="w-full" asChild>
                                <Link to="/login">로그인으로 돌아가기</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="name">아이디</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="아이디를 입력하세요"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">이메일</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="임시 비밀번호를 받을 이메일"
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={resetMutation.isPending}>
                                {resetMutation.isPending ? '발송 중...' : '임시 비밀번호 발송'}
                            </Button>
                        </form>
                    )}
                </CardContent>
                {!isSubmitted && (
                    <CardFooter className="justify-center">
                        <Button variant="ghost" asChild>
                            <Link to="/login">로그인으로 돌아가기</Link>
                        </Button>
                    </CardFooter>
                )}
            </Card>
        </AuthLayout>
    );
}
