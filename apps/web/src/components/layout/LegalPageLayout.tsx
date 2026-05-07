import { Helmet } from '@dr.pogodin/react-helmet';
import { type ReactNode, useLayoutEffect } from 'react';
import { Link } from 'react-router-dom';
import { Footer } from '~/components/layout/Footer';
import { LEGAL_INFO } from '~/lib/legal-info';

export interface TocItem {
    id: string;
    label: string;
}

interface LegalPageLayoutProps {
    title: string;
    description: string;
    effectiveDate: string;
    tableOfContents: TocItem[];
    children: ReactNode;
}

export function LegalPageLayout({
    title,
    description,
    effectiveDate,
    tableOfContents,
    children,
}: LegalPageLayoutProps) {
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Helmet>
                <title>
                    {title} | {LEGAL_INFO.serviceName}
                </title>
                <meta name="description" content={description} />
            </Helmet>
            <header className="border-b bg-background">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
                    <Link
                        to="/"
                        className="text-base font-semibold tracking-tight hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        주일학교 출석부
                    </Link>
                </div>
            </header>
            <main className="flex-1">
                <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
                    <h1 className="text-balance text-3xl font-bold tracking-tight">{title}</h1>
                    <p className="mt-2 text-sm text-muted-foreground">시행일: {effectiveDate}</p>
                    <nav aria-label="목차" className="mt-8 rounded-lg border bg-muted/30 p-4">
                        <h2 className="text-sm font-semibold text-foreground">목차</h2>
                        <ol className="mt-2 list-decimal space-y-1 pl-6 text-sm">
                            {tableOfContents.map((item) => (
                                <li key={item.id}>
                                    <a
                                        href={`#${item.id}`}
                                        className="text-muted-foreground hover:text-foreground hover:underline"
                                    >
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </nav>
                    <div className="mt-10 space-y-8 text-sm leading-relaxed text-foreground">{children}</div>
                </article>
            </main>
            <Footer />
        </div>
    );
}
