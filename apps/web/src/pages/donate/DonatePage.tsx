import { Helmet } from '@dr.pogodin/react-helmet';
import { ArrowLeft, Heart } from 'lucide-react';
import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { analytics } from '~/lib/analytics';
import { DONATION_KAKAOPAY_URL, hasDonationLink } from '~/lib/donation';

export function DonatePage() {
    const navigate = useNavigate();

    useEffect(() => {
        if (hasDonationLink) {
            analytics.trackDonatePageViewed();
        }
    }, []);

    if (!hasDonationLink) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Helmet>
                <title>후원하기 | 주일학교 출석부</title>
                <meta name="description" content="주일학교 출석부를 후원해주세요. 후원금은 서버 운영비로 사용됩니다." />
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
                        <Button variant="outline" asChild>
                            <a
                                href={DONATION_KAKAOPAY_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => analytics.trackDonationLinkClick('donate')}
                            >
                                카카오페이로 후원하기
                            </a>
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
