import { useNavigate } from 'react-router-dom';
import { Button } from '~/components/ui/button';
import { analytics } from '~/lib/analytics';

const ANCHORS = [
    { href: '#features', label: '기능' },
    { href: '#reviews', label: '후기' },
    { href: '#faq', label: 'FAQ' },
];

export function LandingNav() {
    const navigate = useNavigate();

    const handleStartClick = () => {
        analytics.trackLandingCtaClick('top');
        navigate('/signup');
    };

    return (
        <header
            role="banner"
            className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70"
        >
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
                <a href="#hero" className="flex items-center gap-2 font-semibold">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <span className="text-sm font-bold" aria-hidden="true">
                            출
                        </span>
                    </span>
                    <span className="text-sm sm:text-base">주일학교 출석부</span>
                </a>
                <nav aria-label="섹션 이동" className="hidden items-center gap-6 md:flex">
                    {ANCHORS.map((anchor) => (
                        <a
                            key={anchor.href}
                            href={anchor.href}
                            className="text-sm text-muted-foreground transition hover:text-foreground"
                        >
                            {anchor.label}
                        </a>
                    ))}
                </nav>
                <Button size="sm" onClick={handleStartClick}>
                    시작하기
                </Button>
            </div>
        </header>
    );
}
