import { Link } from 'react-router-dom';
import { LEGAL_INFO, LEGAL_ROUTES, SOCIAL_LINKS } from '~/lib/legal-info';

export function Footer() {
    return (
        <footer role="contentinfo" className="border-t bg-background text-xs text-muted-foreground">
            <div className="mx-auto flex max-w-screen-xl flex-col gap-3 px-4 py-6 md:flex-row md:items-center md:justify-between md:gap-6 md:px-8">
                <div className="space-y-1 md:space-y-0">
                    <p>
                        <span className="font-medium text-foreground">{LEGAL_INFO.businessName}</span>
                        <span className="mx-2 text-border" aria-hidden="true">
                            |
                        </span>
                        <span>대표 {LEGAL_INFO.representative}</span>
                        <span className="mx-2 text-border" aria-hidden="true">
                            |
                        </span>
                        <span>사업자등록번호 {LEGAL_INFO.businessNumber}</span>
                    </p>
                    <p>
                        <a
                            href={`mailto:${LEGAL_INFO.contactEmail}`}
                            className="hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                            {LEGAL_INFO.contactEmail}
                        </a>
                    </p>
                </div>
                <nav aria-label="법적 고지" className="flex flex-col gap-2 md:items-end">
                    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <li>
                            <Link
                                to={LEGAL_ROUTES.terms}
                                className="hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                이용약관
                            </Link>
                        </li>
                        <li className="text-border" aria-hidden="true">
                            |
                        </li>
                        <li>
                            <Link
                                to={LEGAL_ROUTES.privacy}
                                className="font-medium hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                개인정보처리방침
                            </Link>
                        </li>
                        <li className="text-border" aria-hidden="true">
                            |
                        </li>
                        <li>
                            <Link
                                to={LEGAL_ROUTES.refund}
                                className="hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                환불약관
                            </Link>
                        </li>
                        <li className="text-border" aria-hidden="true">
                            |
                        </li>
                        <li>
                            <a
                                href={SOCIAL_LINKS.instagram}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-foreground hover:underline focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                인스타그램
                            </a>
                        </li>
                    </ul>
                    <p>© 2026 {LEGAL_INFO.businessName}</p>
                </nav>
            </div>
        </footer>
    );
}
