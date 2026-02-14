import { Info } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { PrivacyPolicyDialog } from '~/components/common/PrivacyPolicyDialog';
import { AuthLayout } from '~/components/layout';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { useAuth } from '~/features/auth';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

export function SignupPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [idCheckResult, setIdCheckResult] = useState<{ checked: boolean; available: boolean } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingId, setIsCheckingId] = useState(false);
    const [privacyAgreed, setPrivacyAgreed] = useState(false);

    const utils = trpc.useUtils();
    const signupMutation = trpc.auth.signup.useMutation();

    // GA4: 동의 UI 노출
    useEffect(() => {
        analytics.trackPrivacyConsentShown('signup');
    }, []);

    // 이미 로그인된 경우 대시보드로 리다이렉트
    if (isAuthenticated && !isAuthLoading) {
        return <Navigate to="/" replace />;
    }

    // ID 입력 시 소문자로 변환
    const handleNameChange = (value: string) => {
        setName(value.toLowerCase());
        setIdCheckResult(null); // ID 변경 시 중복 확인 초기화
    };

    // ID 중복 확인
    const handleCheckId = useCallback(async () => {
        if (name.length < 4) {
            setError('ID는 4자 이상이어야 합니다');
            return;
        }
        if (name.length > 20) {
            setError('ID는 20자 이하여야 합니다');
            return;
        }
        if (!/^[a-z0-9]+$/.test(name)) {
            setError('ID는 영문 소문자와 숫자만 사용 가능합니다');
            return;
        }

        setError(null);
        setIsCheckingId(true);
        try {
            const result = await utils.auth.checkId.fetch({ name });
            setIdCheckResult({ checked: true, available: result.available });
            if (!result.available) {
                setError('이미 사용 중인 아이디입니다');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'ID 확인 중 오류가 발생했습니다';
            setError(message);
        } finally {
            setIsCheckingId(false);
        }
    }, [name, utils.auth.checkId]);

    // 폼 유효성 검사
    const isFormValid = () => {
        if (!name || !displayName || !password || !passwordConfirm) return false;
        if (name.length < 4 || name.length > 20) return false;
        if (!/^[a-z0-9]+$/.test(name)) return false;
        if (displayName.length < 2 || displayName.length > 20) return false;
        if (password.length < 8) return false;
        if (password !== passwordConfirm) return false;
        if (!idCheckResult?.available) return false;
        if (!privacyAgreed) return false;
        return true;
    };

    // 회원가입 제출
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        // 비밀번호 확인 검증
        if (password !== passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다');
            return;
        }

        // ID 중복 확인 여부
        if (!idCheckResult?.available) {
            setError('ID 중복 확인을 해주세요');
            return;
        }

        setIsLoading(true);
        try {
            const result = await signupMutation.mutateAsync({
                name,
                displayName,
                password,
                privacyAgreed: true as const,
            });

            // GA4 이벤트 전송
            analytics.trackSignUp();
            analytics.trackPrivacyConsentAgreed('signup');

            // 자동 로그인
            sessionStorage.setItem('token', result.accessToken);
            // 대시보드로 이동 (페이지 새로고침으로 AuthProvider 초기화)
            window.location.href = '/';
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('회원가입에 실패했습니다');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">회원가입</CardTitle>
                    <CardDescription>우리 모임 출석부, 여기서 시작해요</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 flex gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                        <Info className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>모임 하나당 계정 하나로 관리해요. 선생님이 여러 명이면 같은 계정을 공유하시면 돼요.</span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        {/* ID */}
                        <div className="space-y-2">
                            <Label htmlFor="name">아이디</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                    placeholder="4~20자, 영문 소문자/숫자"
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCheckId}
                                    disabled={isCheckingId || name.length < 4}
                                >
                                    {isCheckingId ? '확인 중...' : '중복 확인'}
                                </Button>
                            </div>
                            {idCheckResult?.checked && idCheckResult.available && (
                                <p className="text-sm text-green-600">사용 가능한 아이디입니다</p>
                            )}
                        </div>

                        {/* 이름 */}
                        <div className="space-y-2">
                            <Label htmlFor="displayName">이름</Label>
                            <Input
                                id="displayName"
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                required
                                placeholder="2~20자"
                            />
                        </div>

                        {/* 비밀번호 */}
                        <div className="space-y-2">
                            <Label htmlFor="password">비밀번호</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="8자 이상"
                            />
                        </div>

                        {/* 비밀번호 확인 */}
                        <div className="space-y-2">
                            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                            <Input
                                id="passwordConfirm"
                                type="password"
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                required
                                placeholder="비밀번호를 다시 입력하세요"
                            />
                            {passwordConfirm && password !== passwordConfirm && (
                                <p className="text-sm text-destructive">비밀번호가 일치하지 않습니다</p>
                            )}
                        </div>

                        {/* 개인정보 동의 */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="privacy-agreed"
                                    checked={privacyAgreed}
                                    onCheckedChange={(checked) => setPrivacyAgreed(checked === true)}
                                />
                                <Label htmlFor="privacy-agreed" className="cursor-pointer text-sm">
                                    개인정보 수집·이용에 동의합니다 (필수)
                                </Label>
                            </div>
                            <PrivacyPolicyDialog>
                                <button
                                    type="button"
                                    className="text-xs text-muted-foreground underline hover:text-foreground"
                                >
                                    개인정보 처리방침 보기
                                </button>
                            </PrivacyPolicyDialog>
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading || !isFormValid()}>
                            {isLoading ? '가입 중...' : '무료로 시작하기'}
                        </Button>

                        <Button variant="ghost" className="w-full" asChild>
                            <Link to="/login">이미 계정이 있으신가요?</Link>
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </AuthLayout>
    );
}
