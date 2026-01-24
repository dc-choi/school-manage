# Development: 웹 앱 리팩토링/최적화

## 메타데이터

| 항목     | 내용                                                                        |
|--------|---------------------------------------------------------------------------|
| 문서 상태 | Draft                                                                     |
| 우선순위  | P1                                                                        |
| 분류     | Non-Functional (Performance)                                              |

## 상위 문서 참조

- PRD: `docs/specs/prd/school-attendance.md`
- Feature: `docs/specs/target/non-functional/features/web-refactoring-optimization.md`
- Task: `docs/specs/target/non-functional/tasks/web-refactoring-optimization.md`

---

## 구현 대상 (Task → Development 매핑)

| Task ID | 업무                          | Development 섹션        |
|---------|-----------------------------|-----------------------|
| T1.1    | `useSelectableList` 훅 생성    | D1. 커스텀 훅             |
| T1.4    | `ChartContainer` 컴포넌트 생성   | D2. 공통 컴포넌트           |
| T1.6    | `ATTENDANCE_MAP` 상수 생성      | D3. 상수 정의             |
| T2.1    | Lazy Loading 적용             | D4. 라우트 최적화           |
| T2.3-4  | CalendarGrid 메모이제이션        | D5. 메모이제이션            |
| T3.1-3  | 테스트 유틸 설정                  | D6. 테스트 인프라           |
| T4.1-2  | ErrorBoundary 생성            | D7. 에러 처리             |
| T4.4    | logger 유틸리티 생성             | D8. 로깅                |
| T5.1-2  | 접근성 개선                      | D9. 접근성               |

---

## D1. 커스텀 훅: useSelectableList

### 파일 위치
`apps/web/src/hooks/useSelectableList.ts`

### 인터페이스

```typescript
interface UseSelectableListReturn<T> {
    selectedIds: Set<string>;
    isAllSelected: boolean;
    isSomeSelected: boolean;
    selectAll: (checked: boolean) => void;
    selectOne: (id: string, checked: boolean) => void;
    clearSelection: () => void;
    getSelectedItems: () => T[];
}

function useSelectableList<T extends { id: string }>(
    items: T[]
): UseSelectableListReturn<T>;
```

### 구현 코드

```typescript
import { useState, useCallback, useMemo } from 'react';

export function useSelectableList<T extends { id: string }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const selectAll = useCallback((checked: boolean) => {
        setSelectedIds(checked ? new Set(items.map(i => i.id)) : new Set());
    }, [items]);

    const selectOne = useCallback((id: string, checked: boolean) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            checked ? newSet.add(id) : newSet.delete(id);
            return newSet;
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isAllSelected = useMemo(() =>
        items.length > 0 && items.every(i => selectedIds.has(i.id)),
        [items, selectedIds]
    );

    const isSomeSelected = useMemo(() =>
        selectedIds.size > 0 && !isAllSelected,
        [selectedIds, isAllSelected]
    );

    const getSelectedItems = useCallback(() =>
        items.filter(i => selectedIds.has(i.id)),
        [items, selectedIds]
    );

    return {
        selectedIds,
        isAllSelected,
        isSomeSelected,
        selectAll,
        selectOne,
        clearSelection,
        getSelectedItems,
    };
}
```

### StudentListPage 적용 예시

```typescript
// Before: 6개의 독립 상태 + 핸들러
const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
const [selectedDeletedStudents, setSelectedDeletedStudents] = useState<Set<string>>(new Set());
const [selectedGraduatedStudents, setSelectedGraduatedStudents] = useState<Set<string>>(new Set());

// After: 3개의 훅 인스턴스
const activeSelection = useSelectableList(students);
const deletedSelection = useSelectableList(deletedStudents);
const graduatedSelection = useSelectableList(graduatedStudents);

// 사용
<Checkbox
    checked={activeSelection.isAllSelected}
    onCheckedChange={activeSelection.selectAll}
/>
```

---

## D2. 공통 컴포넌트: ChartContainer

### 파일 위치
`apps/web/src/components/dashboard/ChartContainer.tsx`

### 인터페이스

```typescript
interface ChartContainerProps {
    title: string;
    isLoading?: boolean;
    error?: boolean;
    emptyMessage?: string;
    height?: string;
    children: ReactNode;
}
```

### 구현 코드

```typescript
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { LoadingSpinner } from '~/components/common/LoadingSpinner';

export function ChartContainer({
    title,
    isLoading = false,
    error = false,
    emptyMessage = '데이터 없음',
    height = '200px',
    children,
}: ChartContainerProps) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div style={{ height }} className="flex items-center justify-center">
                        <LoadingSpinner />
                    </div>
                )}
                {error && (
                    <div style={{ height }} className="flex items-center justify-center text-muted-foreground">
                        데이터를 불러올 수 없습니다
                    </div>
                )}
                {!isLoading && !error && children}
            </CardContent>
        </Card>
    );
}
```

### 차트 컴포넌트 적용 예시

```typescript
// Before: AttendanceRateChart.tsx
export function AttendanceRateChart({ data, isLoading }: Props) {
    if (isLoading) return <LoadingSpinner />;
    if (!data) return <div>데이터 없음</div>;
    // 차트 렌더링...
}

// After
export function AttendanceRateChart({ data, isLoading }: Props) {
    return (
        <ChartContainer title="출석률 추이" isLoading={isLoading} error={!data}>
            <ResponsiveContainer width="100%" height={200}>
                {/* 차트 렌더링만 */}
            </ResponsiveContainer>
        </ChartContainer>
    );
}
```

---

## D3. 상수 정의: ATTENDANCE_MAP

### 파일 위치
`apps/web/src/constants/attendance.ts`

### 구현 코드

```typescript
export const ATTENDANCE_MAP = {
    FULL: { symbol: '◎', mass: true, catechism: true, label: '미사+교리' },
    MASS_ONLY: { symbol: '○', mass: true, catechism: false, label: '미사만' },
    CATECHISM_ONLY: { symbol: '△', mass: false, catechism: true, label: '교리만' },
    ABSENT: { symbol: '-', mass: false, catechism: false, label: '결석' },
} as const;

export type AttendanceStatus = keyof typeof ATTENDANCE_MAP;

export function contentToState(content: string): { mass: boolean; catechism: boolean } {
    const entry = Object.values(ATTENDANCE_MAP).find(e => e.symbol === content);
    return entry ? { mass: entry.mass, catechism: entry.catechism } : { mass: false, catechism: false };
}

export function stateToContent(mass: boolean, catechism: boolean): string {
    for (const entry of Object.values(ATTENDANCE_MAP)) {
        if (entry.mass === mass && entry.catechism === catechism) {
            return entry.symbol;
        }
    }
    return ATTENDANCE_MAP.ABSENT.symbol;
}

export function getStatusLabel(content: string): string {
    const entry = Object.values(ATTENDANCE_MAP).find(e => e.symbol === content);
    return entry?.label ?? '결석';
}
```

---

## D4. 라우트 최적화: Lazy Loading

### 파일 위치
`apps/web/src/routes/index.tsx`

### 구현 코드

```typescript
import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PageLoadingSpinner } from '~/components/common/PageLoadingSpinner';

// Lazy imports
const DashboardPage = lazy(() => import('~/pages/DashboardPage'));
const LoginPage = lazy(() => import('~/pages/LoginPage'));
const StudentListPage = lazy(() => import('~/pages/student/StudentListPage'));
const StudentAddPage = lazy(() => import('~/pages/student/StudentAddPage'));
const StudentDetailPage = lazy(() => import('~/pages/student/StudentDetailPage'));
const GroupListPage = lazy(() => import('~/pages/group/GroupListPage'));
const GroupAddPage = lazy(() => import('~/pages/group/GroupAddPage'));
const GroupDetailPage = lazy(() => import('~/pages/group/GroupDetailPage'));
const CalendarPage = lazy(() => import('~/pages/attendance/CalendarPage'));
const AttendancePage = lazy(() => import('~/pages/attendance/AttendancePage'));

// Suspense 래퍼
function withSuspense(Component: React.ComponentType) {
    return (
        <Suspense fallback={<PageLoadingSpinner />}>
            <Component />
        </Suspense>
    );
}

export const router = createBrowserRouter([
    {
        path: '/login',
        element: withSuspense(LoginPage),
    },
    {
        path: '/',
        element: <ProtectedRoute><MainLayout /></ProtectedRoute>,
        children: [
            { index: true, element: withSuspense(DashboardPage) },
            { path: 'students', element: withSuspense(StudentListPage) },
            // ... 기타 라우트
        ],
    },
]);
```

### PageLoadingSpinner 컴포넌트

```typescript
// components/common/PageLoadingSpinner.tsx
export function PageLoadingSpinner() {
    return (
        <div className="flex h-[50vh] items-center justify-center">
            <LoadingSpinner size="lg" />
        </div>
    );
}
```

---

## D5. 메모이제이션: CalendarGrid

### 파일 위치
`apps/web/src/components/attendance/CalendarGrid.tsx`

### 구현 코드

```typescript
import { memo, useMemo, useCallback } from 'react';

interface CalendarGridProps {
    year: number;
    month: number;
    days: CalendarDay[];
    onDateClick: (date: string) => void;
}

export const CalendarGrid = memo(function CalendarGrid({
    year,
    month,
    days,
    onDateClick,
}: CalendarGridProps) {
    // 날짜 맵 메모이제이션
    const dayMap = useMemo(
        () => new Map(days.map(d => [d.date, d])),
        [days]
    );

    // 그리드 생성 메모이제이션
    const grid = useMemo(() => {
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const startPadding = firstDay.getDay();
        const totalDays = lastDay.getDate();

        const cells: (CalendarDay | null)[] = [];

        // 시작 패딩
        for (let i = 0; i < startPadding; i++) {
            cells.push(null);
        }

        // 날짜 채우기
        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            cells.push(dayMap.get(dateStr) ?? { date: dateStr, isHoliday: false, attendance: null });
        }

        return cells;
    }, [year, month, dayMap]);

    // 클릭 핸들러 메모이제이션
    const handleClick = useCallback((date: string) => {
        onDateClick(date);
    }, [onDateClick]);

    return (
        <div className="grid grid-cols-7 gap-1">
            {grid.map((day, index) => (
                <CalendarCell
                    key={day?.date ?? `empty-${index}`}
                    day={day}
                    onClick={handleClick}
                />
            ))}
        </div>
    );
});
```

### CalendarCell 메모이제이션

```typescript
// components/attendance/CalendarCell.tsx
import { memo } from 'react';

export const CalendarCell = memo(function CalendarCell({
    day,
    onClick,
}: CalendarCellProps) {
    if (!day) {
        return <div className="h-24 sm:h-28" />;
    }

    return (
        <button
            onClick={() => onClick(day.date)}
            className="h-24 sm:h-28 p-2 border rounded hover:bg-accent"
            aria-label={`${day.date} 출석 현황`}
        >
            {/* 셀 내용 */}
        </button>
    );
}, (prev, next) => {
    // 커스텀 비교 함수
    return prev.day?.date === next.day?.date &&
           prev.day?.attendance === next.day?.attendance;
});
```

---

## D6. 테스트 인프라

### 파일 구조

```
apps/web/test/
├── utils/
│   ├── test-utils.tsx       # renderWithProviders
│   └── mocks/
│       ├── trpc.ts          # tRPC 모킹 헬퍼
│       └── data.ts          # Mock 데이터 팩토리
└── hooks/
    ├── useStudents.test.ts
    ├── useGroups.test.ts
    └── useAuth.test.ts
```

### test-utils.tsx

```typescript
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '~/features/auth/AuthProvider';

const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
    },
});

interface WrapperProps {
    children: React.ReactNode;
    initialRoute?: string;
}

function TestWrapper({ children, initialRoute = '/' }: WrapperProps) {
    const queryClient = createTestQueryClient();

    return (
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[initialRoute]}>
                <AuthProvider>
                    {children}
                </AuthProvider>
            </MemoryRouter>
        </QueryClientProvider>
    );
}

export function renderWithProviders(
    ui: React.ReactElement,
    options?: RenderOptions & { initialRoute?: string }
) {
    return render(ui, {
        wrapper: ({ children }) => (
            <TestWrapper initialRoute={options?.initialRoute}>
                {children}
            </TestWrapper>
        ),
        ...options,
    });
}

export * from '@testing-library/react';
```

### tRPC 모킹 헬퍼

```typescript
// test/utils/mocks/trpc.ts
import { vi } from 'vitest';

export function mockTrpcQuery<T>(data: T, isLoading = false, error = null) {
    return {
        data,
        isLoading,
        error,
        refetch: vi.fn(),
    };
}

export function mockTrpcMutation() {
    return {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        isLoading: false,
        error: null,
    };
}
```

### 훅 테스트 예시

```typescript
// test/hooks/useStudents.test.ts
import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('~/lib/trpc', () => ({
    trpc: {
        student: {
            list: {
                useQuery: vi.fn(() => ({
                    data: { students: [{ id: '1', societyName: '홍길동' }], total: 1 },
                    isLoading: false,
                    error: null,
                })),
            },
        },
    },
}));

import { useStudents } from '~/features/student/hooks/useStudents';
import { TestWrapper } from '../utils/test-utils';

describe('useStudents', () => {
    it('학생 목록을 조회한다', () => {
        const { result } = renderHook(() => useStudents(), { wrapper: TestWrapper });

        expect(result.current.students).toHaveLength(1);
        expect(result.current.students[0].societyName).toBe('홍길동');
    });
});
```

---

## D7. 에러 처리: ErrorBoundary

### 파일 위치
`apps/web/src/components/ErrorBoundary.tsx`

### 구현 코드

```typescript
import { Component, ReactNode } from 'react';
import { ErrorFallback } from './ErrorFallback';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        // 로깅 서비스로 전송
        console.error('[ErrorBoundary]', error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <ErrorFallback
                    error={this.state.error}
                    onRetry={this.handleRetry}
                />
            );
        }

        return this.props.children;
    }
}
```

### ErrorFallback 컴포넌트

```typescript
// components/ErrorFallback.tsx
import { Button } from '~/components/ui/button';

interface Props {
    error: Error | null;
    onRetry?: () => void;
}

export function ErrorFallback({ error, onRetry }: Props) {
    return (
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
            <h2 className="text-xl font-semibold">문제가 발생했습니다</h2>
            <p className="text-muted-foreground">
                {error?.message ?? '알 수 없는 오류가 발생했습니다.'}
            </p>
            {onRetry && (
                <Button onClick={onRetry} variant="outline">
                    다시 시도
                </Button>
            )}
        </div>
    );
}
```

---

## D8. 로깅: logger

### 파일 위치
`apps/web/src/lib/logger.ts`

### 구현 코드

```typescript
type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    data?: unknown;
    timestamp: string;
}

export const logger = {
    info: (message: string, data?: unknown) => {
        log('info', message, data);
    },

    warn: (message: string, data?: unknown) => {
        log('warn', message, data);
    },

    error: (message: string, error?: unknown) => {
        log('error', message, error);
        // 프로덕션에서는 외부 서비스로 전송
        // sendToLoggingService(entry);
    },
};

function log(level: LogLevel, message: string, data?: unknown) {
    const entry: LogEntry = {
        level,
        message,
        data,
        timestamp: new Date().toISOString(),
    };

    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logFn(`[${level.toUpperCase()}] ${message}`, data ?? '');
}
```

---

## D9. 접근성: CalendarCell aria-label

### 구현 코드

```typescript
// CalendarCell.tsx 수정
<button
    onClick={() => onClick(day.date)}
    className="..."
    role="gridcell"
    aria-label={`${formatDate(day.date)}, 출석률 ${attendanceRate}%, 출석 ${present}명 / 전체 ${total}명`}
>
    {/* 진행률 바 */}
    <div
        className="h-1.5 w-full rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-valuenow={attendanceRate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`출석률 ${attendanceRate}%`}
    >
        <div
            className={cn('h-full', getProgressColor(attendanceRate))}
            style={{ width: `${attendanceRate}%` }}
        />
    </div>

    {/* 시각적 보조 정보 */}
    <div className="flex justify-between text-xs text-muted-foreground">
        <span>{present}/{total}</span>
        <span className="font-medium">{attendanceRate}%</span>
    </div>
</button>
```

---

## 테스트 시나리오

### TS-1: useSelectableList 테스트

| ID      | 시나리오           | 예상 결과                        |
|---------|-----------------|------------------------------|
| TS-1.1  | 전체 선택           | 모든 항목의 ID가 selectedIds에 포함됨   |
| TS-1.2  | 전체 해제           | selectedIds가 빈 Set            |
| TS-1.3  | 개별 선택           | 해당 ID만 selectedIds에 포함됨       |
| TS-1.4  | items 변경 시       | 기존 선택 상태 유지                   |

### TS-2: Lazy Loading 테스트

| ID      | 시나리오           | 예상 결과                        |
|---------|-----------------|------------------------------|
| TS-2.1  | 초기 로드           | 로딩 스피너 표시 후 페이지 렌더링         |
| TS-2.2  | 청크 로드 실패        | 에러 메시지 + 재시도 버튼 표시          |

### TS-3: CalendarGrid 메모이제이션 테스트

| ID      | 시나리오           | 예상 결과                        |
|---------|-----------------|------------------------------|
| TS-3.1  | 동일 props 재렌더링   | generateGrid 재실행 안 됨          |
| TS-3.2  | month 변경        | generateGrid 재실행됨             |

### TS-4: ErrorBoundary 테스트

| ID      | 시나리오           | 예상 결과                        |
|---------|-----------------|------------------------------|
| TS-4.1  | 자식 컴포넌트 에러     | ErrorFallback 렌더링            |
| TS-4.2  | 재시도 클릭          | 에러 상태 초기화, 자식 재렌더링          |

---

## 구현 순서 (권장)

1. **D3** → D1 → D2 (상수/훅/컴포넌트 순서로 의존성 해결)
2. **D4** → D5 (라우트 → 개별 컴포넌트 최적화)
3. **D6** (테스트 인프라 - 리팩토링 전 안전망)
4. **D7** → D8 (에러 처리 → 로깅)
5. **D9** (접근성 - 마지막 polish)

---

## 변경 파일 목록

| 구분   | 파일                                     | 변경 유형 |
|--------|----------------------------------------|--------|
| 신규   | `hooks/useSelectableList.ts`            | 생성     |
| 신규   | `components/dashboard/ChartContainer.tsx` | 생성     |
| 신규   | `constants/attendance.ts`               | 생성     |
| 신규   | `components/common/PageLoadingSpinner.tsx` | 생성     |
| 신규   | `components/ErrorBoundary.tsx`          | 생성     |
| 신규   | `components/ErrorFallback.tsx`          | 생성     |
| 신규   | `lib/logger.ts`                         | 생성     |
| 신규   | `test/utils/test-utils.tsx`             | 생성     |
| 신규   | `test/utils/mocks/*.ts`                 | 생성     |
| 신규   | `test/hooks/*.test.ts`                  | 생성     |
| 수정   | `routes/index.tsx`                      | Lazy Loading |
| 수정   | `pages/student/StudentListPage.tsx`     | 훅 적용   |
| 수정   | `components/attendance/CalendarGrid.tsx` | 메모이제이션 |
| 수정   | `components/attendance/CalendarCell.tsx` | 메모이제이션 + a11y |
| 수정   | `components/attendance/AttendanceModal.tsx` | 상수 적용 |
| 수정   | `components/dashboard/*Chart.tsx`       | ChartContainer |
| 수정   | `pages/DashboardPage.tsx`               | useMemo |
| 수정   | `App.tsx`                               | ErrorBoundary |