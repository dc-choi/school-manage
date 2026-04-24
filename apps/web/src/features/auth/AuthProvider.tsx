import type { AccountInfo, JoinRequestStatus } from '@school/shared';
import { type ReactNode, createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { analytics } from '~/lib/analytics';
import { queryClient } from '~/lib/queryClient';
import { trpc } from '~/lib/trpc';

export interface AuthContextValue {
    account: AccountInfo | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    privacyAgreedAt: Date | null;
    privacyPolicyVersion: number;
    organizationId: string | null;
    role: string | null;
    organizationName: string | null;
    organizationType: string | null;
    churchName: string | null;
    joinRequestStatus: JoinRequestStatus | null;
    login: (name: string, password: string) => Promise<void>;
    restoreAccount: (name: string, password: string) => Promise<void>;
    logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

const clearAuthState = () => {
    sessionStorage.removeItem('token');
};

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
    const [account, setAccount] = useState<AccountInfo | null>(null);
    const [privacyAgreedAt, setPrivacyAgreedAt] = useState<Date | null>(null);
    const [privacyPolicyVersion, setPrivacyPolicyVersion] = useState<number>(0);
    const [organizationId, setOrganizationId] = useState<string | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [organizationName, setOrganizationName] = useState<string | null>(null);
    const [organizationType, setOrganizationType] = useState<string | null>(null);
    const [churchName, setChurchName] = useState<string | null>(null);
    const [joinRequestStatus, setJoinRequestStatus] = useState<JoinRequestStatus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const refreshAttempted = useRef(false);

    const loginMutation = trpc.auth.login.useMutation();
    const restoreMutation = trpc.auth.restoreAccount.useMutation();
    const refreshMutation = trpc.auth.refresh.useMutation();
    const logoutMutation = trpc.auth.logout.useMutation();

    // 앱 초기화: sessionStorage에 토큰이 없으면 refresh 시도 (브라우저 재시작 대응)
    useEffect(() => {
        const initAuth = async () => {
            const existingToken = sessionStorage.getItem('token');
            if (existingToken) {
                setAuthReady(true);
                return;
            }

            // 토큰 없음 → cookie RT로 refresh 시도
            if (!refreshAttempted.current) {
                refreshAttempted.current = true;
                try {
                    const result = await refreshMutation.mutateAsync();
                    sessionStorage.setItem('token', result.accessToken);
                } catch {
                    // RT도 없거나 만료 → 미인증 상태
                }
            }
            setAuthReady(true);
        };
        initAuth();
    }, []);

    // authReady 이후 토큰 존재 여부 확인
    const hasToken = authReady && typeof window !== 'undefined' && !!sessionStorage.getItem('token');

    // 초기 인증 상태 확인 (토큰이 있을 때만)
    const { data: accountData, isFetching: isAccountFetching } = trpc.account.get.useQuery(undefined, {
        enabled: hasToken,
        retry: false,
    });

    useEffect(() => {
        if (!authReady) return;

        // 토큰이 없으면 바로 로딩 종료
        if (!hasToken) {
            setIsLoading(false);
            return;
        }

        // 토큰이 있고 fetch가 완료되면
        if (!isAccountFetching) {
            if (accountData) {
                setAccount({ id: accountData.id, name: accountData.name, displayName: accountData.displayName });
                setPrivacyAgreedAt(accountData.privacyAgreedAt ?? null);
                setPrivacyPolicyVersion(accountData.privacyPolicyVersion ?? 0);
                setOrganizationId(accountData.organizationId ?? null);
                setRole(accountData.role ?? null);
                setOrganizationName(accountData.organizationName ?? null);
                setOrganizationType(accountData.organizationType ?? null);
                setChurchName(accountData.churchName ?? null);
                setJoinRequestStatus((accountData.joinRequestStatus as JoinRequestStatus) ?? null);

                // GA4 사용자 속성 설정
                analytics.setUserProperties(accountData.displayName, accountData.organizationName ?? null);
            } else {
                clearAuthState();
                setAccount(null);
                setPrivacyAgreedAt(null);
                setPrivacyPolicyVersion(0);
                setOrganizationId(null);
                setRole(null);
                setOrganizationName(null);
                setOrganizationType(null);
                setChurchName(null);
                setJoinRequestStatus(null);
            }
            setIsLoading(false);
        }
    }, [authReady, hasToken, accountData, isAccountFetching]);

    const login = useCallback(
        async (name: string, password: string) => {
            queryClient.clear();
            const result = await loginMutation.mutateAsync({ name, password });
            sessionStorage.setItem('token', result.accessToken);
            setAccount({ id: '', name: result.name, displayName: result.displayName });

            // GA4 이벤트 전송
            analytics.trackLogin();
        },
        [loginMutation]
    );

    const restoreAccount = useCallback(
        async (name: string, password: string) => {
            queryClient.clear();
            const result = await restoreMutation.mutateAsync({ name, password });
            sessionStorage.setItem('token', result.accessToken);
            setAccount({ id: '', name: result.name, displayName: result.displayName });

            analytics.trackLogin();
        },
        [restoreMutation]
    );

    const logout = useCallback(async () => {
        try {
            await logoutMutation.mutateAsync();
        } catch {
            // 서버 로그아웃 실패해도 클라이언트는 정리
        }
        clearAuthState();
        queryClient.clear();
        setAccount(null);
        setPrivacyAgreedAt(null);
        setPrivacyPolicyVersion(0);
        setOrganizationId(null);
        setRole(null);
        setOrganizationName(null);
        setOrganizationType(null);
        setChurchName(null);
        setJoinRequestStatus(null);

        // GA4 사용자 속성 초기화
        analytics.clearUserProperties();
    }, [logoutMutation]);

    const value = useMemo(
        () => ({
            account,
            isLoading,
            isAuthenticated: !!account,
            privacyAgreedAt,
            privacyPolicyVersion,
            organizationId,
            role,
            organizationName,
            organizationType,
            churchName,
            joinRequestStatus,
            login,
            restoreAccount,
            logout,
        }),
        [
            account,
            isLoading,
            privacyAgreedAt,
            privacyPolicyVersion,
            organizationId,
            role,
            organizationName,
            organizationType,
            churchName,
            joinRequestStatus,
            login,
            restoreAccount,
            logout,
        ]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
