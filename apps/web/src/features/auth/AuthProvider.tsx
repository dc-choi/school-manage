import type { AccountInfo } from '@school/trpc';
import { type ReactNode, createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { analytics } from '~/lib/analytics';
import { trpc } from '~/lib/trpc';

export interface AuthContextValue {
    account: AccountInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (name: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [account, setAccount] = useState<AccountInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loginMutation = trpc.auth.login.useMutation();

    // 토큰 존재 여부 확인
    const hasToken = typeof window !== 'undefined' && !!sessionStorage.getItem('token');

    // 초기 인증 상태 확인 (토큰이 있을 때만)
    const { data: accountData, isFetching: isAccountFetching } = trpc.account.get.useQuery(undefined, {
        enabled: hasToken,
        retry: false,
    });

    useEffect(() => {
        // 토큰이 없으면 바로 로딩 종료
        if (!hasToken) {
            setIsLoading(false);
            return;
        }

        // 토큰이 있고 fetch가 완료되면
        if (!isAccountFetching) {
            if (accountData) {
                setAccount({ id: accountData.id, name: accountData.name });
            } else {
                // 토큰이 있지만 계정 정보를 가져오지 못함 (토큰 만료 등)
                sessionStorage.removeItem('token');
                setAccount(null);
            }
            setIsLoading(false);
        }
    }, [hasToken, accountData, isAccountFetching]);

    const login = useCallback(
        async (name: string, password: string) => {
            const result = await loginMutation.mutateAsync({ name, password });
            sessionStorage.setItem('token', result.accessToken);
            setAccount({ id: '', name: result.name }); // id는 account.get에서 가져옴

            // GA4 이벤트 전송
            analytics.trackLogin();
        },
        [loginMutation]
    );

    const logout = useCallback(() => {
        sessionStorage.removeItem('token');
        setAccount(null);
    }, []);

    const value = useMemo(
        () => ({
            account,
            isLoading,
            isAuthenticated: !!account,
            login,
            logout,
        }),
        [account, isLoading, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
