import type { AccountInfo } from '@school/trpc';
import { type ReactNode } from 'react';
export interface AuthContextValue {
    account: AccountInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (name: string, password: string) => Promise<void>;
    logout: () => void;
}
export declare const AuthContext: import("react").Context<AuthContextValue | null>;
interface AuthProviderProps {
    children: ReactNode;
}
export declare function AuthProvider({ children }: AuthProviderProps): import("react/jsx-runtime").JSX.Element;
export {};
