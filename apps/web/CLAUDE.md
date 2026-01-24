# CLAUDE.md - Web App (@school/web)

> **용도**: Vite + React 웹 프론트엔드 개발 가이드
> **언제 읽나**: 페이지, 컴포넌트, 훅, 스타일링 작업 시
> **스킵 조건**: API 서버, 문서 작업 시

이 문서는 `apps/web/` 폴더에서 작업할 때 참고하는 웹 앱 가이드입니다.

## 개요

`@school/web`은 출석부 프로그램의 프론트엔드 웹 애플리케이션입니다.

**현재 상태**: 구현 완료

## 기술 스택

| 항목           | 기술              | 비고                          |
|--------------|-----------------|-----------------------------|
| 빌드 도구        | Vite            | 빠른 HMR                      |
| 프레임워크        | React 19        | TypeScript                  |
| 라우팅          | React Router v6 | createBrowserRouter         |
| 상태 관리        | TanStack Query  | 서버 상태 관리                    |
| API 클라이언트    | tRPC            | `@school/trpc` 사용           |
| 스타일링         | Tailwind CSS v4 | shadcn/ui 컴포넌트              |
| UI 컴포넌트      | shadcn/ui       | Radix UI 기반                 |

## Directory Structure

```
apps/web/
├── index.html                      # HTML 템플릿
├── vite.config.ts                  # Vite 설정
├── tsconfig.json                   # TypeScript 설정
├── public/
│   └── logo.jpeg                   # 정적 파일
│
└── src/
    ├── main.tsx                    # Entry point
    ├── App.tsx                     # Root + Router Provider
    │
    ├── routes/                     # 라우트 정의
    │   └── index.tsx               # createBrowserRouter 설정
    │
    ├── pages/                      # 페이지 컴포넌트 (라우트별 1:1)
    │   ├── LoginPage.tsx           # /login
    │   ├── DashboardPage.tsx       # /
    │   ├── group/
    │   │   ├── GroupListPage.tsx   # /groups
    │   │   ├── GroupAddPage.tsx    # /groups/new
    │   │   ├── GroupDetailPage.tsx # /groups/:id
    │   │   └── GroupEditPage.tsx   # /groups/:id/edit
    │   ├── student/
    │   │   ├── StudentListPage.tsx # /students
    │   │   ├── StudentAddPage.tsx  # /students/new
    │   │   ├── StudentDetailPage.tsx # /students/:id
    │   │   └── StudentEditPage.tsx # /students/:id/edit
    │   └── attendance/
    │       ├── CalendarPage.tsx    # /attendance (달력 UI)
    │       └── AttendancePage.tsx  # /attendance/table (테이블 UI)
    │
    ├── components/                 # 재사용 UI 컴포넌트
    │   ├── ui/                     # shadcn/ui 컴포넌트
    │   │   ├── button.tsx
    │   │   ├── input.tsx
    │   │   ├── select.tsx
    │   │   ├── table.tsx
    │   │   ├── card.tsx
    │   │   ├── label.tsx
    │   │   ├── dialog.tsx
    │   │   ├── alert-dialog.tsx
    │   │   ├── dropdown-menu.tsx
    │   │   ├── separator.tsx
    │   │   ├── badge.tsx
    │   │   └── sheet.tsx
    │   ├── common/                 # 범용 컴포넌트
    │   │   ├── Table.tsx
    │   │   ├── Pagination.tsx
    │   │   └── LoadingSpinner.tsx
    │   ├── layout/                 # 레이아웃 컴포넌트
    │   │   ├── MainLayout.tsx      # 인증된 페이지 레이아웃
    │   │   ├── AuthLayout.tsx      # 로그인 페이지 레이아웃
    │   │   └── Header.tsx
    │   └── forms/                  # 폼 컴포넌트
    │       ├── GroupForm.tsx
    │       ├── StudentForm.tsx
    │       └── LoginForm.tsx
    │
    ├── features/                   # 도메인별 로직
    │   ├── auth/
    │   │   ├── hooks/
    │   │   │   └── useAuth.ts      # 로그인/로그아웃 로직
    │   │   └── AuthProvider.tsx    # 인증 Context
    │   ├── group/
    │   │   └── hooks/
    │   │       └── useGroups.ts    # 그룹 CRUD hooks
    │   ├── student/
    │   │   └── hooks/
    │   │       └── useStudents.ts  # 학생 CRUD hooks
    │   ├── attendance/
    │   │   └── hooks/
    │   │       └── useAttendance.ts
    │   └── statistics/
    │       └── hooks/
    │           └── useStatistics.ts
    │
    ├── hooks/                      # 공통 커스텀 훅
    │   ├── useDebounce.ts
    │   └── usePagination.ts
    │
    ├── lib/                        # 유틸리티 및 설정
    │   ├── trpc.ts                 # tRPC 클라이언트 설정
    │   ├── queryClient.ts          # TanStack Query 설정
    │   └── utils.ts                # 헬퍼 함수 (전화번호 포맷 등)
    │
    ├── types/                      # 로컬 타입 정의
    │   └── database.ts
    │
    └── styles/                     # 스타일
        ├── globals.css             # 전역 스타일
        └── variables.css           # CSS 변수
```

## 설계 원칙

### 1. 페이지 vs 컴포넌트 분리

| 폴더            | 역할                                    |
|---------------|---------------------------------------|
| `pages/`      | 라우트와 1:1 매핑. 데이터 fetching, 레이아웃 조합 담당 |
| `components/` | 재사용 가능한 순수 UI 컴포넌트 (presentational)   |

### 2. features 폴더 (도메인별 로직)

각 도메인(auth, group, student 등)의 비즈니스 로직을 모아둠:
- `hooks/`: tRPC 쿼리/뮤테이션 래핑
- `providers/`: Context Provider (필요시)
- 도메인 관련 유틸리티

### 3. 컴포넌트 네이밍 규칙

| 유형      | 네이밍 패턴           | 예시                |
|---------|------------------|-------------------|
| 페이지     | `*Page.tsx`      | `LoginPage.tsx`   |
| 레이아웃    | `*Layout.tsx`    | `MainLayout.tsx`  |
| 폼       | `*Form.tsx`      | `StudentForm.tsx` |
| 공통 컴포넌트 | `PascalCase.tsx` | `Button.tsx`      |
| 훅       | `use*.ts`        | `useAuth.ts`      |

### 4. 파일 배치 원칙

- **단일 사용**: 해당 도메인 폴더에 배치 (`features/auth/`)
- **2개 이상 공유**: 공통 폴더로 이동 (`components/common/`, `hooks/`)
- **타입**: `@school/trpc`에서 import, 로컬 전용만 `types/`에 정의

## 직군별 포인트

- 출석 UX: 최소 클릭/자동 저장/정렬, 현장 사용 흐름(모바일·태블릿) 최적화
- 온보딩: 7일 내 반/학생 등록 + 첫 출석 기록 완료 흐름, 대량 등록/엑셀 import 대응 UI
- 정보 신뢰: 데이터 최신성/출처 표기, 저장 상태/오류/재시도 피드백, 권한별 노출 구분
- 리포트 가독성: 사제/교리교사용 요약 화면, 출력/공유 흐름 단순화
- 성능/접근성: 느린 네트워크 대비 로딩/캐시, 키보드·터치 접근성, 반응형 안정성

## 라우트 구조

| 경로                   | 페이지                 | 레이아웃         | 인증 필요 |
|----------------------|---------------------|--------------|-------|
| `/login`             | `LoginPage`         | `AuthLayout` | No    |
| `/`                  | `DashboardPage`     | `MainLayout` | Yes   |
| `/groups`            | `GroupListPage`     | `MainLayout` | Yes   |
| `/groups/new`        | `GroupAddPage`      | `MainLayout` | Yes   |
| `/groups/:id`        | `GroupDetailPage`   | `MainLayout` | Yes   |
| `/groups/:id/edit`   | `GroupEditPage`     | `MainLayout` | Yes   |
| `/students`          | `StudentListPage`   | `MainLayout` | Yes   |
| `/students/new`      | `StudentAddPage`    | `MainLayout` | Yes   |
| `/students/:id`      | `StudentDetailPage` | `MainLayout` | Yes   |
| `/students/:id/edit` | `StudentEditPage`   | `MainLayout` | Yes   |
| `/attendance`        | `CalendarPage`      | `MainLayout` | Yes   |
| `/attendance/table`  | `AttendancePage`    | `MainLayout` | Yes   |

## Commands

```bash
pnpm dev                # 개발 서버 (Vite)
pnpm build              # 프로덕션 빌드
pnpm preview            # 빌드 미리보기
pnpm test               # 테스트 실행 (vitest)
pnpm test:watch         # 테스트 워치 모드
pnpm typecheck          # 타입 체크
pnpm lint               # ESLint
```

## Testing

- **프레임워크**: Vitest + jsdom
- **설정**: `vitest.config.ts`, `vitest.setup.ts`
- **위치**: `test/**/*.test.{ts,tsx}`
- **의존성**: `@testing-library/react`, `@testing-library/jest-dom`

### 테스트 환경

```typescript
// vitest.config.ts
{
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
}

// vitest.setup.ts
import '@testing-library/jest-dom';
// matchMedia 모킹 포함
```

### 테스트 파일 구조

```
apps/web/test/
├── example.test.ts           # 환경 검증 테스트
├── hooks/                    # 커스텀 훅 테스트
│   └── useStatistics.test.ts
└── components/               # 컴포넌트 테스트 (선택)
    └── *.test.tsx
```

### 훅 테스트 작성 가이드

#### tRPC 모킹 패턴

```typescript
// 테스트 파일 상단에서 tRPC 모킹
vi.mock('~/lib/trpc', () => ({
    trpc: {
        {domain}: {
            {procedure}: {
                useQuery: vi.fn(() => ({
                    data: { /* mock data */ },
                    isLoading: false,
                    error: null,
                })),
            },
            {mutation}: {
                useMutation: vi.fn(() => ({
                    mutate: vi.fn(),
                    mutateAsync: vi.fn(),
                    isLoading: false,
                })),
            },
        },
    },
}));

// 모킹 후에 훅 import (순서 중요!)
import { useMyHook } from '~/features/{domain}/hooks/useMyHook';
```

#### 훅 테스트 예시

```typescript
/**
 * useStatistics 훅 테스트
 */
import { describe, expect, it, vi } from 'vitest';

// tRPC 모킹
vi.mock('~/lib/trpc', () => ({
    trpc: {
        statistics: {
            weekly: {
                useQuery: vi.fn(() => ({
                    data: { attendanceRate: 85.5, startDate: '2024-01-21', endDate: '2024-01-27' },
                    isLoading: false,
                    error: null,
                })),
            },
            byGender: {
                useQuery: vi.fn(() => ({
                    data: {
                        male: { count: 15, rate: 50 },
                        female: { count: 12, rate: 40 },
                        unknown: { count: 3, rate: 10 },
                    },
                    isLoading: false,
                    error: null,
                })),
            },
        },
    },
}));

// 모킹 후 import
import { useDashboardStatistics } from '~/features/statistics/hooks/useStatistics';

describe('useDashboardStatistics', () => {
    it('대시보드 통계 데이터를 반환한다', () => {
        const result = useDashboardStatistics(2024);

        expect(result).toHaveProperty('weekly');
        expect(result).toHaveProperty('byGender');
        expect(result).toHaveProperty('isLoading');
        expect(result).toHaveProperty('error');
    });

    it('주간 출석률 데이터 구조가 올바르다', () => {
        const result = useDashboardStatistics(2024);

        expect(result.weekly).toHaveProperty('attendanceRate');
        expect(result.weekly?.attendanceRate).toBe(85.5);
    });

    it('성별 분포 데이터 구조가 올바르다', () => {
        const result = useDashboardStatistics(2024);

        expect(result.byGender?.male.count).toBe(15);
        expect(result.byGender?.female.count).toBe(12);
    });
});
```

### 테스트 케이스 체크리스트

| 유형 | 테스트 항목 | 우선순위 |
|------|------------|---------|
| 훅 반환값 | 필수 프로퍼티 존재 확인 | 높음 |
| 데이터 구조 | 중첩 객체/배열 구조 검증 | 높음 |
| 로딩 상태 | `isLoading` 플래그 동작 | 중간 |
| 에러 상태 | `error` 처리 동작 | 중간 |
| 빈 데이터 | 데이터 없을 때 기본값 | 낮음 |

### vitest.setup.ts 구성

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 테스트 환경 설정
process.env.NODE_ENV = 'test';

// window.matchMedia 모킹 (jsdom 미지원)
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
```

### 테스트 명령어

```bash
pnpm test               # 테스트 실행
pnpm test:watch         # 워치 모드
pnpm test -- --run      # 단일 실행 (CI용)
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

## 기존 코드 마이그레이션 참고

현재 `public/` 폴더의 jQuery 기반 페이지들:

| 기존 파일                | 마이그레이션 대상                              |
|----------------------|----------------------------------------|
| `index.html`         | `LoginPage.tsx`                        |
| `main.html`          | `DashboardPage.tsx` (통계 포함)            |
| `groupList.html`     | `GroupListPage.tsx`                    |
| `groupAdd.html`      | `GroupAddPage.tsx`                     |
| `groupModify.html`   | `GroupEditPage.tsx`, `GroupDetailPage.tsx` |
| `studentList.html`   | `StudentListPage.tsx`                  |
| `studentAdd.html`    | `StudentAddPage.tsx`                   |
| `studentModify.html` | `StudentEditPage.tsx`, `StudentDetailPage.tsx` |
| `attendance.html`    | `CalendarPage.tsx`, `AttendancePage.tsx` |
| `statistics.html`    | `DashboardPage.tsx` (통합됨)              |

## 관련 문서

- SDD: `docs/specs/target/non-functional/features/web-vite-app.md`
- tRPC 패키지: `packages/trpc/CLAUDE.md`
- API 서버: `apps/api/CLAUDE.md`

## TODO

- [x] Vite + React 프로젝트 초기화
- [x] tRPC 클라이언트 설정
- [x] AuthProvider 구현
- [x] 레이아웃 컴포넌트 구현
- [x] 페이지 컴포넌트 구현
- [x] 공통 컴포넌트 구현 (Table, Pagination)
- [x] shadcn/ui 컴포넌트 적용
- [x] 반응형 레이아웃 완성 (Tailwind CSS v4 breakpoint)
- [x] UI 중앙 정렬 완성
