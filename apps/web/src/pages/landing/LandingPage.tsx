import { FadeInSection } from './FadeInSection';
import { InteractiveDemo } from './InteractiveDemo';
import { ScrollDownHint } from './ScrollDownHint';
import { BarChart3, Calendar, ClipboardCheck, Users } from 'lucide-react';
import { useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '~/components/ui/accordion';
import { Button } from '~/components/ui/button';
import { useAuth } from '~/features/auth';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

const PAIN_POINTS = [
    {
        quote: '출석부 어디 뒀더라...',
        desc: '매주 종이 출석부 찾는 것부터 시작하는 주일',
    },
    {
        quote: '작년 명단이 어디 갔지...?',
        desc: '기록이 여기저기 흩어져 있으면 매번 처음부터 정리하게 돼요',
    },
    {
        quote: '이번 달 축일이 누구더라...?',
        desc: '축일 따로 찾고, 연락처 따로 확인하고... 매번 반복',
    },
];

const FAQ_ITEMS = [
    {
        question: '정말 무료인가요?',
        answer: '네, 모든 기능을 무료로 사용할 수 있어요. 지금 제공되는 핵심 기능은 앞으로도 무료로 유지됩니다.',
    },
    {
        question: '개인정보는 안전한가요?',
        answer: '개인정보 처리방침에 따라 최소한의 정보만 수집하고, 제3자에게 제공하지 않아요.',
    },
    {
        question: '선생님이 여러 명인데, 각각 가입해야 하나요?',
        answer: '아니요. 모임 하나당 계정 하나를 만들고, 선생님들이 같은 계정을 공유하시면 돼요.',
    },
    {
        question: '가입하면 뭘 먼저 해야 하나요?',
        answer: '가입 후 ① 학년(반)을 만들고 ② 학생을 등록하면 ③ 출석 체크를 시작할 수 있어요. 3분이면 충분해요.',
    },
    {
        question: '스마트폰에서도 쓸 수 있나요?',
        answer: '네, 웹 기반이라 스마트폰, 태블릿, PC 어디서든 사용할 수 있어요. 앱 설치는 필요 없어요.',
    },
    {
        question: '가톨릭 주일학교만 쓸 수 있나요?',
        answer: '주일학교 운영에 최적화되어 있지만, 출석 관리가 필요한 모임이면 어디든 사용할 수 있어요.',
    },
    {
        question: '기존에 쓰던 출석 데이터를 옮길 수 있나요?',
        answer: '현재는 직접 입력 방식이에요. 대량 등록 기능은 준비 중입니다.',
    },
];

const FEATURES = [
    {
        icon: ClipboardCheck,
        title: '출석 체크',
        description: '폰에서 탭 한 번이면 출석 체크 끝.',
    },
    {
        icon: Users,
        title: '학생·축일 관리',
        description: '학생 정보와 축일을 한곳에서 기록하고 바로 검색.',
    },
    {
        icon: BarChart3,
        title: '통계 자동 계산',
        description: '출석률, 출석상 순위까지 자동으로 정리돼요.',
    },
    {
        icon: Calendar,
        title: '달력으로 한눈에',
        description: '우리 반 아이들이 언제 왔는지 한눈에 보여요.',
    },
];

export function LandingPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();
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

    const handleBottomCtaClick = () => {
        analytics.trackLandingCtaClick('bottom');
        navigate('/signup');
    };

    const handleLoginClick = () => {
        analytics.trackLandingLoginClick();
    };

    return (
        <div className="min-h-screen bg-background">
            <main className="break-keep">
                {/* ① Hero — 첫 화면은 즉시 표시 */}
                <section className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b from-primary/8 to-background px-6 text-center">
                    <h1 className="text-4xl font-bold leading-snug tracking-tight text-balance sm:text-5xl lg:text-7xl">
                        매주 일요일,
                        <br />
                        이거 하나면 됩니다
                    </h1>
                    <p className="text-2xl text-muted-foreground sm:text-3xl">
                        <span className="font-semibold text-foreground">출석, 축일, 학생 현황</span>까지.
                        <br />
                        주일학교 교리교사를 위한 주간 도구.
                    </p>
                    <ScrollDownHint targetId="pain-points" />
                </section>

                {/* ② Pain Points — 공감 */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('pain-points')}>
                    <section
                        id="pain-points"
                        className="flex min-h-screen flex-col items-center justify-center gap-10 px-6 text-center"
                    >
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">
                            혹시 이런 주일, 보내고 계신가요?
                        </h2>
                        <div className="flex flex-col gap-10">
                            {PAIN_POINTS.map((point) => (
                                <div key={point.quote} className="flex flex-col gap-2">
                                    <p className="text-xl font-medium sm:text-2xl">&ldquo;{point.quote}&rdquo;</p>
                                    <p className="text-base text-muted-foreground sm:text-lg">{point.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-xl sm:text-2xl">
                            우리 다 겪어봤습니다.
                            <br />
                            <span className="font-semibold">그래서 만들었어요.</span>
                        </p>
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
                                    <feature.icon className="h-10 w-10 text-primary lg:h-12 lg:w-12" />
                                    <h3 className="text-xl font-semibold sm:text-2xl">{feature.title}</h3>
                                    <p className="text-base text-muted-foreground sm:text-lg">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                        <ScrollDownHint targetId="screenshot" />
                    </section>
                </FadeInSection>

                {/* ④ 인터랙티브 데모 */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('demo')}>
                    <section
                        id="screenshot"
                        className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center"
                    >
                        <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">직접 체험해보세요</h2>
                        <p className="text-base text-muted-foreground sm:text-lg">출석 체크하면 바로 반영돼요</p>
                        <p className="text-base text-muted-foreground sm:text-base">실제 데이터는 아니에요!</p>
                        <InteractiveDemo />
                        <ScrollDownHint targetId="cta" />
                    </section>
                </FadeInSection>

                {/* ⑤ Social Proof + Final CTA */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('cta')}>
                    <section
                        id="cta"
                        className="flex min-h-screen flex-col items-center justify-center gap-10 bg-gradient-to-t from-primary/8 to-background px-6 text-center"
                    >
                        {countData && countData.count > 0 && (
                            <div className="flex flex-col items-center gap-2 text-lg font-medium text-balance sm:flex-row sm:gap-3 sm:text-2xl">
                                <Users className="h-7 w-7 shrink-0 text-primary" />
                                <span>{countData.count}개 단체가 이미 사용하고 있어요</span>
                            </div>
                        )}
                        <p className="text-lg text-muted-foreground sm:text-xl">
                            무료로 시작할 수 있어요. 30초면 충분해요.
                            <br />
                            이번 주일부터 써보세요.
                        </p>
                        <Button size="lg" className="px-8 py-6 text-lg" onClick={handleBottomCtaClick}>
                            지금 시작해보기
                        </Button>
                        <Button variant="ghost" className="text-base sm:text-lg" asChild onClick={handleLoginClick}>
                            <Link to="/login">이미 계정이 있으신가요?</Link>
                        </Button>
                    </section>
                </FadeInSection>

                {/* ⑥ FAQ */}
                <FadeInSection onVisible={() => analytics.trackLandingSectionView('faq')}>
                    <section className="py-20 px-6">
                        <h2 className="text-3xl font-bold text-center mb-8">자주 묻는 질문</h2>
                        <Accordion
                            type="single"
                            collapsible
                            className="max-w-2xl mx-auto"
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
                                <AccordionItem key={index} value={String(index)}>
                                    <AccordionTrigger>{item.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <p className="text-muted-foreground">{item.answer}</p>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </section>
                </FadeInSection>
            </main>

            {/* Footer */}
            <footer className="px-6 py-12 text-center text-sm text-muted-foreground">
                &copy; 2022–{new Date().getFullYear()} 주일학교 출석부
            </footer>
        </div>
    );
}
