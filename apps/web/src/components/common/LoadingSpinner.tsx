interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
    const sizeClass = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    }[size];

    return (
        <div className="flex items-center justify-center p-4">
            <div className={`${sizeClass} rounded-full border-2 border-muted border-t-primary animate-spin`} />
        </div>
    );
}
