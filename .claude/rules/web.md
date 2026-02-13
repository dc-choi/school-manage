---
paths:
  - "apps/web/**"
---

# Web App Rules (@school/web)

Vite + React 웹 프론트엔드 개발 가이드입니다.

## 기술 스택

| 항목 | 기술 | 비고 |
|------|------|------|
| 빌드 도구 | Vite | 빠른 HMR |
| 프레임워크 | React 19 | TypeScript |
| 라우팅 | React Router v6 | createBrowserRouter |
| 상태 관리 | TanStack Query | 서버 상태 관리 |
| API 클라이언트 | tRPC | `@school/trpc` 사용 |
| 스타일링 | Tailwind CSS v4 | shadcn/ui 컴포넌트 |
| UI 컴포넌트 | shadcn/ui | Radix UI 기반 |

## Directory Structure

```
apps/web/src/
├── main.tsx                    # Entry point
├── App.tsx                     # Root + Router Provider
├── routes/                     # 라우트 정의
├── pages/                      # 페이지 컴포넌트 (라우트별 1:1)
├── components/                 # 재사용 UI 컴포넌트
│   ├── ui/                     # shadcn/ui 컴포넌트
│   ├── common/                 # 범용 컴포넌트
│   ├── layout/                 # 레이아웃 컴포넌트
│   └── forms/                  # 폼 컴포넌트
├── features/                   # 도메인별 로직
│   ├── auth/hooks/
│   ├── group/hooks/
│   ├── student/hooks/
│   ├── attendance/hooks/
│   └── statistics/hooks/
├── hooks/                      # 공통 커스텀 훅
├── lib/                        # 유틸리티 및 설정
│   ├── analytics.ts            # GA4 이벤트 추적
│   ├── trpc.ts                 # tRPC 클라이언트 설정
│   ├── queryClient.ts          # TanStack Query 설정
│   └── utils.ts                # 헬퍼 함수
├── types/                      # 로컬 타입 정의
└── styles/                     # 스타일
```

## 설계 원칙

### 1. 페이지 vs 컴포넌트 분리

| 폴더 | 역할 |
|------|------|
| `pages/` | 라우트와 1:1 매핑. 데이터 fetching, 레이아웃 조합 담당 |
| `components/` | 재사용 가능한 순수 UI 컴포넌트 (presentational) |

### 2. 컴포넌트 네이밍 규칙

| 유형 | 네이밍 패턴 | 예시 |
|------|-------------|------|
| 페이지 | `*Page.tsx` | `LoginPage.tsx` |
| 레이아웃 | `*Layout.tsx` | `MainLayout.tsx` |
| 폼 | `*Form.tsx` | `StudentForm.tsx` |
| 공통 컴포넌트 | `PascalCase.tsx` | `Button.tsx` |
| 훅 | `use*.ts` | `useAuth.ts` |

### 3. 파일 배치 원칙

- **단일 사용**: 해당 도메인 폴더에 배치 (`features/auth/`)
- **2개 이상 공유**: 공통 폴더로 이동 (`components/common/`, `hooks/`)
- **타입**: `@school/trpc`에서 import, 로컬 전용만 `types/`에 정의

## Commands

```bash
pnpm dev                # 개발 서버 (Vite)
pnpm build              # 프로덕션 빌드
pnpm preview            # 빌드 미리보기
pnpm test               # 테스트 실행 (vitest)
pnpm test:watch         # 테스트 워치 모드
pnpm typecheck          # 타입 체크
```

## tRPC 클라이언트 설정

```typescript
// src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@school/trpc';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
    links: [
        httpBatchLink({
            url: '/api/trpc',
            headers() {
                const token = sessionStorage.getItem('token');
                return token ? { authorization: `Bearer ${token}` } : {};
            },
        }),
    ],
});
```

## 인증 플로우

1. **로그인**: `POST /api/auth/login` → `accessToken` 수신
2. **토큰 저장**: `sessionStorage.setItem('token', accessToken)`
3. **API 요청**: tRPC httpBatchLink에서 Authorization 헤더 자동 추가
4. **인증 체크**: `AuthProvider`에서 토큰 유효성 검증
5. **로그아웃**: `sessionStorage.clear()` → `/login`으로 리다이렉트

## Testing

- **프레임워크**: Vitest + jsdom
- **설정**: `vitest.config.ts`, `vitest.setup.ts`
- **위치**: `test/**/*.test.{ts,tsx}`
- **의존성**: `@testing-library/react`, `@testing-library/jest-dom`

### tRPC 모킹 패턴

```typescript
vi.mock('~/lib/trpc', () => ({
    trpc: {
        statistics: {
            weekly: {
                useQuery: vi.fn(() => ({
                    data: { attendanceRate: 85.5 },
                    isLoading: false,
                    error: null,
                })),
            },
        },
    },
}));

// 모킹 후에 훅 import (순서 중요!)
import { useMyHook } from '~/features/{domain}/hooks/useMyHook';
```

## 라우트 구조

| 경로 | 페이지 | 인증 필요 |
|------|--------|----------|
| `/landing` | `LandingPage` | No |
| `/login` | `LoginPage` | No |
| `/` | `DashboardPage` | Yes |
| `/groups` | `GroupListPage` | Yes |
| `/groups/new` | `GroupAddPage` | Yes |
| `/groups/:id` | `GroupDetailPage` | Yes |
| `/groups/:id/edit` | `GroupEditPage` | Yes |
| `/students` | `StudentListPage` | Yes |
| `/students/new` | `StudentAddPage` | Yes |
| `/students/:id` | `StudentDetailPage` | Yes |
| `/students/:id/edit` | `StudentEditPage` | Yes |
| `/attendance` | `CalendarPage` | Yes |
| `/attendance/table` | `AttendancePage` | Yes |