import { Button } from '~/components/ui/button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else if (currentPage <= 3) {
            pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }

        return pages;
    };

    return (
        <nav aria-label="페이지네이션" className="w-full overflow-x-auto sm:overflow-visible">
            <div className="mx-auto flex w-max items-center gap-1.5 px-1 sm:w-auto sm:justify-center sm:gap-2 sm:px-0">
                <Button
                    variant="outline"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="이전 페이지"
                    className="h-10 min-w-12 px-2.5 py-1.5 text-sm sm:h-14 sm:min-w-20 sm:px-6 sm:py-3 sm:text-lg"
                >
                    이전
                </Button>

                {getPageNumbers().map((page, idx) =>
                    typeof page === 'number' ? (
                        <Button
                            key={`page-${page}`}
                            variant={currentPage === page ? 'default' : 'outline'}
                            onClick={() => onPageChange(page)}
                            aria-current={currentPage === page ? 'page' : undefined}
                            aria-label={`${page} 페이지${currentPage === page ? ', 현재 페이지' : ''}`}
                            className="h-10 min-w-10 px-2 py-1.5 text-sm tabular-nums sm:h-14 sm:min-w-14 sm:px-6 sm:py-3 sm:text-lg"
                        >
                            {page}
                        </Button>
                    ) : (
                        <span
                            key={`ellipsis-${idx}`}
                            aria-hidden="true"
                            className="px-1 py-1 text-sm text-muted-foreground sm:px-3 sm:py-2 sm:text-xl"
                        >
                            …
                        </span>
                    )
                )}

                <Button
                    variant="outline"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="다음 페이지"
                    className="h-10 min-w-12 px-2.5 py-1.5 text-sm sm:h-14 sm:min-w-20 sm:px-6 sm:py-3 sm:text-lg"
                >
                    다음
                </Button>
            </div>
        </nav>
    );
}
