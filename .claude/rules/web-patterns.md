---
paths:
  - "apps/web/**"
---

# Web App Patterns

코드 스플리팅, ErrorBoundary, 테스트, 라우트, 성능 규칙입니다.

> 기본 구조/설정은 `rules/web.md` 참조

## 코드 스플리팅

라우트 기반 코드 스플리팅으로 초기 번들 크기를 최소화합니다.

| 그룹 | 페이지 | 방식 |
|------|--------|------|
| eager (초기 번들) | LandingPage, LoginPage, SignupPage | `pages/index.ts` barrel export |
| lazy | 나머지 12개 페이지 | `React.lazy` + `Suspense` (routes/index.tsx) |

```tsx
// lazy 패턴 (named export → default export 변환)
const DashboardPage = lazy(() => import('~/pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
```

| vendor 청크 | 포함 패키지 |
|-------------|-----------|
| `vendor-react` | react, react-dom, react-router-dom, scheduler |
| `vendor-ui` | @radix-ui, lucide-react, tailwind-merge, cva, clsx |
| `vendor-query` | @tanstack/react-query, @trpc, superjson |

- `LoadingFallback` (`components/common/LoadingFallback.tsx`): Suspense fallback 전용
- 프로덕션 sourcemap: **비활성** (`vite.config.ts` → `sourcemap: false`)

## ErrorBoundary 구조

2단계 ErrorBoundary로 렌더링 에러를 격리합니다.

```
main.tsx
  GlobalErrorBoundary          ← 1단계: Provider 에러 포착
    StrictMode
      trpc.Provider
        QueryClientProvider
          AuthProvider
            App (RouterProvider)
              Layout route       ← 2단계: 라우트 에러 포착 (errorElement)
                각 페이지
```

| 컴포넌트 | 위치 | 역할 |
|---------|------|------|
| `GlobalErrorBoundary` | `components/common/GlobalErrorBoundary.tsx` | 최외곽 class component (`componentDidCatch`) |
| `RouteErrorFallback` | `components/common/RouteErrorFallback.tsx` | 라우트 에러 UI (`useRouteError()`, MainLayout 유지) |

- **비동기 에러** (API 호출 실패): 기존 tRPC error 처리 유지 (ErrorBoundary 대상 아님)
- **이벤트 핸들러 에러**: React 제약으로 ErrorBoundary 대상 아님

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

| 경로 | 페이지 | 인증 필요 | 동의 필요 |
|------|--------|----------|----------|
| `/landing` | `LandingPage` | No | No |
| `/login` | `LoginPage` | No | No |
| `/signup` | `SignupPage` | No | No |
| `/reset-password` | `ResetPasswordPage` | No | No |
| `/consent` | `ConsentPage` | Yes (내부 체크) | No |
| `/settings` | `SettingsPage` | Yes | Yes |
| `/` | `DashboardPage` | Yes | Yes |
| `/groups` | `GroupListPage` | Yes | Yes |
| `/groups/new` | `GroupAddPage` | Yes | Yes |
| `/groups/:id` | `GroupDetailPage` | Yes | Yes |
| `/students` | `StudentListPage` | Yes | Yes |
| `/students/new` | `StudentAddPage` | Yes | Yes |
| `/students/:id` | `StudentDetailPage` | Yes | Yes |
| `/attendance` | `CalendarPage` | Yes | Yes |
| `/attendance/table` | `AttendancePage` | Yes | Yes |

## React 성능 규칙

### Re-render 최적화

- 파생 상태는 렌더링 중 계산 — `useState` + `useEffect`로 동기화하지 않음
- `useMemo`에 단순 표현식 넣지 않음 — 오버헤드가 더 큼
- 비긴급 UI 업데이트에 `useTransition` 사용
- `useRef`로 빈번히 변하는 transient 값 관리 (re-render 불필요 시)
- 이벤트 핸들러에서 사이드 이펙트 실행 — Effect로 감싸지 않음
- `useState` lazy initializer 사용 (비용이 큰 초기값: `useState(() => expensiveCompute())`)

### 렌더링 성능

- `&&` 대신 삼항(`? … : null`) 사용 — falsy 값 `0`, `NaN`이 DOM에 렌더링되는 것 방지
- 정적 JSX를 컴포넌트 바깥으로 추출 (매 렌더링마다 재생성 방지)
- 50개 이상 리스트는 가상화(virtualization) 고려

### JS 성능

- `Array.includes()` 대신 `Set` 사용 (O(1) 탐색)
- `.sort()` 대신 `.toSorted()` (원본 배열 불변)
- 루프 내 반복 프로퍼티 접근은 변수에 캐싱
