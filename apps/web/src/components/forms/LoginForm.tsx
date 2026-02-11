import { BarChart3, ClipboardCheck, Users } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

interface LoginFormProps {
    onSubmit: (name: string, password: string) => Promise<void>;
    error?: string | null;
    isLoading?: boolean;
}

export function LoginForm({ onSubmit, error, isLoading }: LoginFormProps) {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        await onSubmit(name, password);
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">로그인</CardTitle>
                <CardDescription>모임의 출석과 멤버를 한곳에서 관리하세요</CardDescription>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        <span>간편한 출석 체크와 자동 저장</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>그룹별 멤버 관리</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>출석 통계</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">이름</Label>
                        <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="이름을 입력하세요"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">비밀번호</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="비밀번호를 입력하세요"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? '로그인 중...' : '로그인'}
                    </Button>

                    <div className="text-center">
                        계정이 없으신가요?{' '}
                        <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                            회원가입
                        </Link>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
