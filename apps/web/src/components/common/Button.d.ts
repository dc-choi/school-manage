import { type ButtonHTMLAttributes, type ReactNode } from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    children: ReactNode;
}
export declare function Button({ variant, size, isLoading, disabled, className, children, ...props }: ButtonProps): import("react/jsx-runtime").JSX.Element;
export {};
