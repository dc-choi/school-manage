import { FadeInSection } from './FadeInSection';
import { HeroPreview } from './HeroPreview';
import { InteractiveDemo } from './InteractiveDemo';
import { LandingNav } from './LandingNav';
import { ScrollDownHint } from './ScrollDownHint';
import { UseCaseCards } from './UseCaseCards';
import { WhyChooseUsSection } from './WhyChooseUsSection';
import { Helmet } from '@dr.pogodin/react-helmet';
import { formatSocialProof } from '@school/shared';
import { BarChart3, BookOpen, Calendar, ClipboardCheck, Heart, Music, Shield, Sparkles, Users } from 'lucide-react';
import { useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Footer } from '~/components/layout/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/features/auth';
import { useLiturgicalTheme } from '~/hooks/useLiturgicalTheme';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

const FEATURES = [
    {
        icon: ClipboardCheck,
        title: '출석 체크',
        description: '폰에서 탭 한 번이면 출석 체크 끝.',
    },
    {
        icon: Users,
        title: '구성원과 축일 관리',
        description: '구성원 정보와 축일을 한곳에서 기록하고 바로 검색.',
    },
    {
        icon: BarChart3,
        title: '통계 자동 계산',
        description: '출석률, 출석상 순위까지 자동으로 정리돼요.',
    },
    {
        icon: Calendar,
        title: '달력으로 한눈에',
        description: '우리 모임 구성원이 언제 왔는지 한눈에 보여요.',
    },
];

const TARGET_GROUPS = [
    { icon: BookOpen, title: '주일학교', description: '매주 학생 출석을 한 곳에서' },
    { icon: Sparkles, title: '청년', description: '청년 모임 참석 기록을 간편하게' },
    { icon: Heart, title: '레지오', description: '주회 출석과 활동을 빠르게' },
    { icon: Shield, title: '군종', description: '장병들의 미사 참여를 한눈에' },
    { icon: Music, title: '성가대', description: '연습 출석을 카톡 대신 한 곳에서' },
];

const FAQ_ITEMS = [
    {
        question: '비용이 드나요?',
        answer: '지금 제공되는 모든 기능을 비용 없이 사용할 수 있어요. 핵심 기능은 앞으로도 그대로 유지됩니다.',
    },
    {
        question: '개인정보는 안전한가요?',
        answer: '개인정보 처리방침에 따라 최소한의 정보만 수집하고, 제3자에게 제공하지 않아요.',
    },
    {
        question: '선생님이 여러 명인데, 각각 가입해야 하나요?',
        answer: '각자 가입한 뒤 같은 본당/모임에 합류하면 돼요. 관리자가 승인하면 바로 함께 쓸 수 있어요.',
    },
    {
        question: '가입하면 뭘 먼저 해야 하나요?',
        answer: '가입 후 ① 학년(그룹)을 만들고 ② 학생(멤버)을 등록하면 ③ 출석 체크를 시작할 수 있어요. 3분이면 충분해요.',
    },
    {
        question: '스마트폰에서도 쓸 수 있나요?',
        answer: '네, 웹 기반이라 스마트폰, 태블릿, PC 어디서든 사용할 수 있어요. 앱 설치는 필요 없어요.',
    },
    {
        question: '가톨릭 주일학교만 쓸 수 있나요?',
        answer: '주일학교, 청년, 레지오, 군종, 성가대 등 가톨릭 모임 운영에 사용할 수 있어요.',
    },
    {
        question: '기존에 쓰던 출석 데이터를 옮길 수 있나요?',
        answer: '현재는 직접 입력 방식이에요. 대량 등록 기능은 준비 중입니다.',
    },
];

export function LandingPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
    useLiturgicalTheme();
    const { data: countData } = trpc.account.count.useQuery(undefined, {
        retry: false,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        analytics.trackLandingView();
        analytics.trackLandingSectionView('hero');
    }, []);

    if (isAuthenticated && !isAuthLoading) {
        return <Navigate to="/" replace />;
    }

    const handleHeroCtaClick = () => {
        analytics.trackLandingCtaClick('hero');
        navigate('/signup');
    };

    const handleBottomCtaClick = () => {
        analytics.trackLandingCtaClick('bottom');
        navigate('/signup');
    };

    const handleLoginClick = () => {
        analytics.trackLandingLoginClick();
    };

    const faqJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': FAQ_ITEMS.map((item) => ({
            '@type': 'Question',
            'name': item.question,
            'acceptedAnswer': {
                '@type': 'Answer',
                'text': item.answer,
            },
        })),
    };

    return (
        <div className="min-h-screen bg-background">
            <Helmet>
                <title>주일학교 출석부</title>
                <meta
                    name="description"
                    content="주일학교 출석부 — 가톨릭 모임을 위한 출석 관리 도구. 주일학교, 청년, 레지오, 군종, 성가대까지 한곳에서."
                />
                <link rel="canonical" href="https://weekly-school.site/landing" />
                <meta property="og:title" content="주일학교 출석부" />
                <meta
                    property="og:description"
                    content="주일학교 출석부 — 가톨릭 모임을 위한 출석 관리 도구. 주일학교, 청년, 레지오, 군종, 성가대까지 한곳에서."
                />
                <meta property="og:url" content="https://weekly-school.site/landing" />
                <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
            </Helmet>
            <LandingNav />
            <main className="break-keep">
                {/* ① Hero — 첫 화면은 즉시 표시 */}
                <section
                    id="hero"
                    className="flex min-h-[calc(100dvh-3.5rem)] flex-col bg-gradient-to-b from-primary/8 to-background px-6 pb-6"
                >
                    <div className="flex flex-1 items-center">
                        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
                            <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
                                <h1 className="text-4xl font-bold leading-snug tracking-tight text-balance sm:text-5xl lg:text-6xl">
                                    매주 주일,
                                    <br />
                                    이거 하나면 됩니다
                                </h1>
                                <p className="text-xl text-muted-foreground sm:text-2xl">
                                    <span className="font-semibold text-foreground">출석, 축일, 구성원 현황</span>까지.
                                    <br />
                                    가톨릭 모임을 위한 주간 도구.
                                </p>
                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <Button size="lg" className="px-8 py-6 text-lg" onClick={handleHeroCtaClick}>
                                        시작하기
                                    </Button>
                                    <Button variant="ghost" size="lg" className="px-6 py-6 text-base" asChild>
                                        <a href="#demo">데모 체험</a>
                                    </Button>
                                </div>
                            </div>
                            <HeroPreview className="hidden h-auto w-full max-w-sm justify-self-center lg:block" />
                        </div>
                    </div>
                    <ScrollDownHint targetId="social-proof" />
                </section>

                {/* ② Social Proof — 사회적 신뢰 (countData + 모임 유형 5카드) */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('social-proof')}>
                    <section
                        id="social-proof"
                        className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 text-center"
                    >
                        {countData && countData.churchCount > 0 ? (
                            <div className="flex flex-col items-center gap-2 text-lg font-medium text-balance sm:flex-row sm:gap-3 sm:text-2xl">
                                <Users className="h-7 w-7 shrink-0 text-primary" aria-hidden="true" />
                                <span>{formatSocialProof(countData)}</span>
                            </div>
                        ) : null}
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">
                            이런 가톨릭 모임에서 사용 중
                        </h2>
                        <div className="grid w-full max-w-6xl grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-5">
                            {TARGET_GROUPS.map((g) => (
                                <div key={g.title} className="flex flex-col items-center gap-3">
                                    <g.icon className="h-10 w-10 text-primary" aria-hidden="true" />
                                    <h3 className="text-lg font-semibold">{g.title}</h3>
                                    <p className="text-sm text-muted-foreground text-balance">{g.description}</p>
                                </div>
                            ))}
                        </div>
                        <ScrollDownHint targetId="features" />
                    </section>
                </FadeInSection>

                {/* ③ Features — 솔루션 */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('features')}>
                    <section
                        id="features"
                        className="flex min-h-screen flex-col items-center justify-center gap-12 bg-muted/30 px-6 text-center"
                    >
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">
                            종이와 엑셀 대신, 이렇게 바뀌어요
                        </h2>
                        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2">
                            {FEATURES.map((feature) => (
                                <div key={feature.title} className="flex flex-col items-center gap-4 text-center">
                                    <feature.icon
                                        className="h-10 w-10 text-primary lg:h-12 lg:w-12"
                                        aria-hidden="true"
                                    />
                                    <h3 className="text-xl font-semibold sm:text-2xl">{feature.title}</h3>
                                    <p className="text-base text-muted-foreground sm:text-lg">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                        <ScrollDownHint targetId="why-choose-us" />
                    </section>
                </FadeInSection>

                {/* ④ Why Choose Us — 차별화 강점 */}
                <WhyChooseUsSection />

                {/* ⑤ Interactive Demo */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('demo')}>
                    <section
                        id="demo"
                        className="flex min-h-screen flex-col items-center justify-center gap-8 bg-muted/30 px-6 text-center"
                    >
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">직접 체험해보세요</h2>
                        <p className="text-base text-muted-foreground sm:text-lg">출석 체크하면 바로 반영돼요</p>
                        <p className="text-base text-muted-foreground sm:text-base">실제 데이터는 아니에요!</p>
                        <InteractiveDemo />
                        <ScrollDownHint targetId="reviews" />
                    </section>
                </FadeInSection>

                {/* ⑥ Reviews — 사용 사례 카드 (안 B) */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('reviews')}>
                    <section
                        id="reviews"
                        className="flex min-h-screen flex-col items-center justify-center gap-10 overflow-x-clip px-6"
                    >
                        <div className="flex flex-col items-center gap-3 text-center">
                            <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">
                                이런 본당이 이렇게 씁니다
                            </h2>
                            <p className="text-base text-muted-foreground sm:text-lg">
                                실제 사용자 피드백을 바탕으로 정리한 사용 사례
                            </p>
                        </div>
                        <div className="w-full max-w-6xl">
                            <UseCaseCards />
                        </div>
                        <ScrollDownHint targetId="faq" />
                    </section>
                </FadeInSection>

                {/* ⑦ FAQ */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('faq')}>
                    <section id="faq" className="px-6 py-20">
                        <h2 className="mb-8 text-center text-3xl font-bold">자주 묻는 질문</h2>
                        <Accordion
                            type="single"
                            collapsible
                            className="mx-auto max-w-2xl"
                            onValueChange={(value) => {
                                if (value) {
                                    const item = FAQ_ITEMS[Number(value)];
                                    if (item) {
                                        analytics.trackLandingFaqClick(item.question);
                                    }
                                }
                            }}
                        >
                            {FAQ_ITEMS.map((item, index) => (
                                <AccordionItem key={item.question} value={String(index)}>
                                    <AccordionTrigger>{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">{item.answer}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>
                </FadeInSection>

                {/* ⑧ 마무리 CTA */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('cta')}>
                    <section
                        id="cta"
                        className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-t from-primary/8 to-background px-6 text-center"
                    >
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">
                            이번 주일부터 함께 시작해요
                        </h2>
                        <p className="text-lg text-muted-foreground sm:text-xl">
                            바로 시작할 수 있어요. 30초면 충분해요.
                        </p>
                        <Button size="lg" className="px-8 py-6 text-lg" onClick={handleBottomCtaClick}>
                            지금 시작해보기
                        </Button>
                        <Button variant="ghost" className="text-base sm:text-lg" asChild>
                            <Link to="/login" onClick={handleLoginClick}>
                                이미 계정이 있으신가요?
                            </Link>
                        </Button>
                    </section>
                </FadeInSection>
            </main>

            <Footer />
        </div>
    );
}
