import { Helmet } from '@dr.pogodin/react-helmet';
import { ArrowLeft, Check, Copy, Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { analytics } from '~/lib/analytics';
import { DONATION_BANK, hasDonationLink } from '~/lib/donation';

export function DonatePage() {
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (hasDonationLink) {
            analytics.trackDonatePageViewed();
        }
    }, []);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(DONATION_BANK.accountNumber);
        analytics.trackDonationLinkClick('donate');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!hasDonationLink) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Helmet>
                <title>주일학교 출석부</title>
                <meta
                    name="description"
                    content="주일학교 출석부 — 가톨릭(천주교) 주일학교 교리교사를 위한 출석 관리 도구."
                />
                <link rel="canonical" href="https://weekly-school.site/donate" />
            </Helmet>
            <div className="w-full max-w-md space-y-6">
                <h1 className="text-center text-xl font-bold tracking-tight">주일학교 출석부</h1>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Heart className="h-5 w-5" aria-hidden="true" />
                            후원하기
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            이 서비스는 교리교사가 만든 봉사 프로젝트입니다. 후원금은 서버 운영비로 사용됩니다.
                        </p>
                        <div className="space-y-2 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">은행</span>
                                <span className="text-sm font-medium">{DONATION_BANK.bankName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">계좌번호</span>
                                <span className="text-sm font-medium tabular-nums">{DONATION_BANK.accountNumber}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">예금주</span>
                                <span className="text-sm font-medium">{DONATION_BANK.accountHolder}</span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full" onClick={handleCopy}>
                            {copied ? (
                                <Check className="h-4 w-4" aria-hidden="true" />
                            ) : (
                                <Copy className="h-4 w-4" aria-hidden="true" />
                            )}
                            {copied ? '복사됨' : '계좌번호 복사'}
                        </Button>
                    </CardContent>
                </Card>

                <div className="flex justify-center">
                    <Button variant="ghost" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        돌아가기
                    </Button>
                </div>
            </div>
        </div>
    );
}
