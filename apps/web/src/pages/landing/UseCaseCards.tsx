interface UseCase {
    tag: string;
    text: string;
}

const USE_CASES: UseCase[] = [
    { tag: '주일학교 운영', text: '매주 학생 70명 출석을 폰 한 대로. 종이 출석부 정리는 끝' },
    { tag: '다중 교사 협업', text: '교리교사 여럿이 같은 모임을 공유. 누가 무엇을 입력했는지 한곳에' },
    { tag: '통계 자동 정리', text: '출석률과 마지막 출석일을 따로 계산할 필요 없어요' },
    { tag: '모바일 즉시 사용', text: '앱 설치 없이 폰에서 탭 한 번. 새 교사도 바로 시작' },
];

export function UseCaseCards() {
    return (
        <ul className="-mx-6 flex w-[calc(100%+3rem)] gap-4 overflow-x-auto px-6 pb-2 snap-x snap-mandatory sm:mx-0 sm:w-full sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
            {USE_CASES.map((useCase) => (
                <li
                    key={useCase.tag}
                    className="min-w-[80%] shrink-0 snap-start rounded-2xl border bg-card p-5 text-left shadow-sm sm:min-w-0 sm:shrink"
                >
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">{useCase.tag}</p>
                    <p className="mt-3 text-base leading-relaxed text-foreground sm:text-lg">{useCase.text}</p>
                </li>
            ))}
        </ul>
    );
}
