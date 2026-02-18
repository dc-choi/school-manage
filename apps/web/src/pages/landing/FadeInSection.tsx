import { type ReactNode, useEffect, useRef, useState } from 'react';
import { cn } from '~/lib/utils';

export function FadeInSection({
    children,
    className,
    onVisible,
}: {
    children: ReactNode;
    className?: string;
    onVisible?: () => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const tracked = useRef(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
                if (entry.isIntersecting && !tracked.current) {
                    tracked.current = true;
                    onVisible?.();
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [onVisible]);

    return (
        <div
            ref={ref}
            className={cn(
                'transition-all duration-1000 ease-out',
                isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-20 scale-95 opacity-0',
                className
            )}
        >
            {children}
        </div>
    );
}
