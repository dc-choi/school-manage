interface HeroPreviewProps {
    className?: string;
}

const ROWS = [
    { name: '김루카', mark: '◎', tone: 'fill-primary' },
    { name: '박마리아', mark: '○', tone: 'fill-primary/70' },
    { name: '이요한', mark: '△', tone: 'fill-muted-foreground' },
    { name: '최데레사', mark: '◎', tone: 'fill-primary' },
];

export function HeroPreview({ className }: HeroPreviewProps) {
    return (
        <svg viewBox="0 0 320 480" role="img" className={className} xmlns="http://www.w3.org/2000/svg">
            <title>출석 체크 화면 미리보기</title>
            <rect
                x="8"
                y="8"
                width="304"
                height="464"
                rx="32"
                className="fill-background stroke-border"
                strokeWidth="2"
            />
            <rect x="120" y="20" width="80" height="6" rx="3" className="fill-border" />
            <rect x="32" y="56" width="120" height="14" rx="4" className="fill-foreground" />
            <rect x="32" y="78" width="80" height="8" rx="3" className="fill-muted-foreground" opacity="0.6" />
            <rect
                x="232"
                y="52"
                width="56"
                height="28"
                rx="14"
                className="fill-primary/10 stroke-primary"
                strokeWidth="1.5"
            />
            <text x="260" y="71" textAnchor="middle" className="fill-primary" fontSize="12" fontWeight="600">
                85%
            </text>
            {ROWS.map((row, idx) => {
                const y = 120 + idx * 76;
                return (
                    <g key={row.name}>
                        <rect
                            x="32"
                            y={y}
                            width="256"
                            height="60"
                            rx="12"
                            className="fill-muted/40 stroke-border"
                            strokeWidth="1"
                        />
                        <circle cx="60" cy={y + 30} r="14" className="fill-primary/20" />
                        <text
                            x="60"
                            y={y + 35}
                            textAnchor="middle"
                            className="fill-primary"
                            fontSize="13"
                            fontWeight="600"
                        >
                            {row.name.charAt(0)}
                        </text>
                        <rect
                            x="86"
                            y={y + 18}
                            width="80"
                            height="10"
                            rx="3"
                            className="fill-foreground"
                            opacity="0.85"
                        />
                        <rect
                            x="86"
                            y={y + 34}
                            width="48"
                            height="6"
                            rx="2"
                            className="fill-muted-foreground"
                            opacity="0.6"
                        />
                        <circle cx="252" cy={y + 30} r="18" className={row.tone} />
                        <text
                            x="252"
                            y={y + 36}
                            textAnchor="middle"
                            className="fill-background"
                            fontSize="16"
                            fontWeight="700"
                        >
                            {row.mark}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}
