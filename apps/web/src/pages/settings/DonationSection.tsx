import { Heart } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { analytics } from '~/lib/analytics';
import { DONATION_KAKAOPAY_URL, hasDonationLink } from '~/lib/donation';

export function DonationSection() {
    if (!hasDonationLink) return null;

    return (
        <Card id="donation">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
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
                        onClick={() => analytics.trackDonationLinkClick('settings')}
                    >
                        카카오페이로 후원하기
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
}
