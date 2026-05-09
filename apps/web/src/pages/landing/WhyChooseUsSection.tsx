import { FadeInSection } from './FadeInSection';
import { ScrollDownHint } from './ScrollDownHint';
import { Calendar, FileText, Smartphone, Sparkles } from 'lucide-react';
import { analytics } from '~/lib/analytics';

const WHY_CHOOSE_US = [
    {
        icon: Calendar,
        title: '주간 도구로 설계',
        description: '매주 주일 한 번만 열면 됩니다',
    },
    {
        icon: Sparkles,
        title: '가톨릭에 특화',
        description: '축일, 세례명, 교구 구조까지 한곳에',
    },
    {
        icon: FileText,
        title: '종이와 엑셀 대신',
        description: '흩어진 명단과 기록을 하나로 모읍니다',
    },
    {
        icon: Smartphone,
        title: '모바일에서 즉시',
        description: '앱 설치 없이 폰에서 탭 한 번',
    },
];

export function WhyChooseUsSection() {
    return (
        <FadeInSection onVisible={() => analytics.trackLandingSectionView('why-choose-us')}>
            <section
                id="why-choose-us"
                className="flex min-h-screen flex-col items-center justify-center gap-12 px-6 text-center"
            >
                <h2 className="text-2xl font-bold text-balance sm:text-4xl lg:text-5xl">왜 이 도구를 쓸까요?</h2>
                <div className="grid w-full max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {WHY_CHOOSE_US.map((item) => (
                        <div key={item.title} className="flex flex-col items-center gap-3">
                            <item.icon className="h-9 w-9 text-primary" aria-hidden="true" />
                            <h3 className="text-lg font-semibold sm:text-xl">{item.title}</h3>
                            <p className="text-sm text-muted-foreground text-balance sm:text-base">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
                <ScrollDownHint targetId="demo" />
            </section>
        </FadeInSection>
    );
}
