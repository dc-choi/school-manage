import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

export class GlobalErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('[GlobalErrorBoundary]', error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-screen items-center justify-center bg-background">
                    <div className="space-y-4 text-center">
                        <h1 className="text-2xl font-bold">오류가 발생했습니다</h1>
                        <p className="text-muted-foreground">예상치 못한 문제가 발생했습니다. 새로고침해 주세요.</p>
                        <button
                            type="button"
                            onClick={this.handleReload}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            새로고침
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
