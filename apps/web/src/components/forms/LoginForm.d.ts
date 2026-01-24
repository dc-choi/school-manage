interface LoginFormProps {
    onSubmit: (name: string, password: string) => Promise<void>;
    error?: string | null;
    isLoading?: boolean;
}
export declare function LoginForm({ onSubmit, error, isLoading }: LoginFormProps): import("react/jsx-runtime").JSX.Element;
export {};
