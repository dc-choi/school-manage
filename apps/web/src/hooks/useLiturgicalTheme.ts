import { useEffect } from 'react';
import { trpc } from '~/lib/trpc';

type LiturgicalColor = 'purple' | 'green' | 'white' | 'red';

interface ThemePalette {
    '--primary': string;
    '--primary-foreground': string;
    '--ring': string;
    '--chart-1': string;
    '--sidebar': string;
    '--sidebar-foreground': string;
    '--sidebar-primary': string;
    '--sidebar-primary-foreground': string;
    '--sidebar-accent': string;
    '--sidebar-accent-foreground': string;
    '--sidebar-border': string;
    '--sidebar-ring': string;
}

const LITURGICAL_PALETTES: Record<LiturgicalColor, ThemePalette> = {
    // 대림절·사순절 — 보라 (기본값과 동일, CSS fallback)
    purple: {
        '--primary': 'oklch(0.475 0.15 280)',
        '--primary-foreground': 'oklch(0.98 0.005 280)',
        '--ring': 'oklch(0.55 0.12 280)',
        '--chart-1': 'oklch(0.55 0.17 280)',
        '--sidebar': 'oklch(0.27 0.06 275)',
        '--sidebar-foreground': 'oklch(0.92 0.015 280)',
        '--sidebar-primary': 'oklch(0.82 0.12 280)',
        '--sidebar-primary-foreground': 'oklch(0.98 0.005 280)',
        '--sidebar-accent': 'oklch(0.34 0.06 275)',
        '--sidebar-accent-foreground': 'oklch(0.92 0.015 280)',
        '--sidebar-border': 'oklch(0.35 0.04 275)',
        '--sidebar-ring': 'oklch(0.55 0.12 280)',
    },
    // 연중 시기 — 초록
    green: {
        '--primary': 'oklch(0.475 0.12 155)',
        '--primary-foreground': 'oklch(0.98 0.005 155)',
        '--ring': 'oklch(0.55 0.10 155)',
        '--chart-1': 'oklch(0.55 0.14 155)',
        '--sidebar': 'oklch(0.27 0.05 150)',
        '--sidebar-foreground': 'oklch(0.92 0.01 155)',
        '--sidebar-primary': 'oklch(0.75 0.12 155)',
        '--sidebar-primary-foreground': 'oklch(0.98 0.005 155)',
        '--sidebar-accent': 'oklch(0.34 0.05 150)',
        '--sidebar-accent-foreground': 'oklch(0.92 0.01 155)',
        '--sidebar-border': 'oklch(0.35 0.04 150)',
        '--sidebar-ring': 'oklch(0.55 0.10 155)',
    },
    // 성탄·부활 — 골드
    white: {
        '--primary': 'oklch(0.55 0.14 85)',
        '--primary-foreground': 'oklch(0.15 0.02 85)',
        '--ring': 'oklch(0.60 0.12 85)',
        '--chart-1': 'oklch(0.60 0.15 85)',
        '--sidebar': 'oklch(0.30 0.05 80)',
        '--sidebar-foreground': 'oklch(0.92 0.015 85)',
        '--sidebar-primary': 'oklch(0.78 0.12 85)',
        '--sidebar-primary-foreground': 'oklch(0.15 0.02 85)',
        '--sidebar-accent': 'oklch(0.37 0.05 80)',
        '--sidebar-accent-foreground': 'oklch(0.92 0.015 85)',
        '--sidebar-border': 'oklch(0.38 0.04 80)',
        '--sidebar-ring': 'oklch(0.60 0.12 85)',
    },
    // 성령강림·순교자 — 빨강
    red: {
        '--primary': 'oklch(0.50 0.18 25)',
        '--primary-foreground': 'oklch(0.98 0.005 25)',
        '--ring': 'oklch(0.55 0.15 25)',
        '--chart-1': 'oklch(0.55 0.18 25)',
        '--sidebar': 'oklch(0.27 0.06 22)',
        '--sidebar-foreground': 'oklch(0.92 0.015 25)',
        '--sidebar-primary': 'oklch(0.75 0.14 25)',
        '--sidebar-primary-foreground': 'oklch(0.98 0.005 25)',
        '--sidebar-accent': 'oklch(0.34 0.06 22)',
        '--sidebar-accent-foreground': 'oklch(0.92 0.015 25)',
        '--sidebar-border': 'oklch(0.35 0.04 22)',
        '--sidebar-ring': 'oklch(0.55 0.15 25)',
    },
};

const VALID_COLORS = new Set<string>(['purple', 'green', 'white', 'red']);

/**
 * 전례 시기에 따라 앱 테마 색상을 동적으로 변경한다.
 * MainLayout에서 호출하여 인증된 페이지에만 적용.
 */
export const useLiturgicalTheme = () => {
    const currentYear = new Date().getFullYear();
    const { data } = trpc.liturgical.season.useQuery({ year: currentYear }, { staleTime: 24 * 60 * 60 * 1000 });

    useEffect(() => {
        if (!data?.color || !VALID_COLORS.has(data.color)) return;

        const palette = LITURGICAL_PALETTES[data.color as LiturgicalColor];
        const root = document.documentElement;

        for (const [prop, value] of Object.entries(palette)) {
            root.style.setProperty(prop, value);
        }

        return () => {
            for (const prop of Object.keys(palette)) {
                root.style.removeProperty(prop);
            }
        };
    }, [data?.color]);

    return data?.color as LiturgicalColor | undefined;
};
