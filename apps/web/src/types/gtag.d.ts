interface GtagEventParams {
    method?: string;
    days_since_signup?: number;
    student_count?: number;
    [key: string]: unknown;
}

declare function gtag(
    command: 'js' | 'config' | 'event',
    targetIdOrEventName: Date | string,
    params?: GtagEventParams | { [key: string]: unknown }
): void;

interface Window {
    gtag?: typeof gtag;
    dataLayer?: unknown[];
}
