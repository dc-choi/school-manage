import { ChevronDown } from 'lucide-react';

export function ScrollDownHint({ targetId }: { targetId: string }) {
    return (
        <button
            type="button"
            className="mt-12 flex flex-col items-center gap-3 text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
                document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
            }}
        >
            <span className="text-base">아래로 스크롤해보세요</span>
            <ChevronDown className="h-7 w-7 animate-bounce" />
        </button>
    );
}
