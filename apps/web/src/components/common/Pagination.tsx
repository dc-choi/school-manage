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
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }

        return pages;
    };

    return (
        <nav className="flex items-center justify-center gap-2">
            <Button
                variant="outline"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="min-w-20"
            >
                이전
            </Button>

            {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                    <Button
                        key={index}
                        variant={currentPage === page ? 'default' : 'outline'}
                        onClick={() => onPageChange(page)}
                        className="min-w-14"
                    >
                        {page}
                    </Button>
                ) : (
                    <span key={index} className="px-3 py-2 text-xl text-muted-foreground">
                        {page}
                    </span>
                )
            )}

            <Button
                variant="outline"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="min-w-20"
            >
                다음
            </Button>
        </nav>
    );
}
