# Task: 웹 앱 리팩토링/최적화

## 메타데이터

| 항목     | 내용                                                                        |
|--------|---------------------------------------------------------------------------|
| 문서 상태 | Draft                                                                     |
| 우선순위  | P1                                                                        |
| 분류     | Non-Functional (Performance)                                              |

## 상위 문서 참조

- PRD: `docs/specs/prd/school-attendance.md`
- Feature: `docs/specs/target/non-functional/features/web-refactoring-optimization.md`

## 업무 분할

### Phase 1: 코드 중복 제거 (1주차)

| ID   | 업무                            | 의존성 | 대상 파일                           |
|------|-------------------------------|-------|----------------------------------|
| T1.1 | `useSelectableList` 훅 생성      | 없음   | `hooks/useSelectableList.ts` (신규) |
| T1.2 | StudentListPage 선택 로직 리팩토링   | T1.1  | `StudentListPage.tsx`            |
| T1.3 | `buildStudentColumns` 함수 생성   | T1.2  | `StudentListPage.tsx`            |
| T1.4 | `ChartContainer` 컴포넌트 생성     | 없음   | `components/dashboard/` (신규)    |
| T1.5 | 차트 컴포넌트 리팩토링                | T1.4  | `*Chart.tsx`                      |
| T1.6 | `ATTENDANCE_MAP` 상수 생성        | 없음   | `constants/attendance.ts` (신규)  |
| T1.7 | AttendanceModal 상태 변환 리팩토링   | T1.6  | `AttendanceModal.tsx`            |

### Phase 2: 성능 최적화 (2주차)

| ID   | 업무                            | 의존성 | 대상 파일               |
|------|-------------------------------|-------|----------------------|
| T2.1 | Lazy Loading 적용               | 없음   | `routes/index.tsx`   |
| T2.2 | Suspense fallback 컴포넌트 생성    | T2.1  | `components/common/` |
| T2.3 | CalendarGrid `useMemo` 적용     | 없음   | `CalendarGrid.tsx`   |
| T2.4 | CalendarCell `memo` 적용        | T2.3  | `CalendarCell.tsx`   |
| T2.5 | DashboardPage `useMemo` 적용    | 없음   | `DashboardPage.tsx`  |
| T2.6 | 캐시 전략 설정 (도메인별 staleTime)   | 없음   | `lib/queryClient.ts` |

### Phase 3: 테스트 기반 구축 (3주차)

| ID   | 업무                        | 의존성 | 대상 파일                   |
|------|---------------------------|-------|--------------------------|
| T3.1 | 테스트 유틸 설정 (renderWithProviders) | 없음   | `test/utils/test-utils.tsx` |
| T3.2 | tRPC 모킹 헬퍼 생성            | T3.1  | `test/utils/mocks/trpc.ts` |
| T3.3 | Mock 데이터 팩토리 생성          | T3.1  | `test/utils/mocks/data.ts` |
| T3.4 | `useStudents` 훅 테스트        | T3.2  | `test/hooks/useStudents.test.ts` |
| T3.5 | `useGroups` 훅 테스트          | T3.2  | `test/hooks/useGroups.test.ts` |
| T3.6 | `useAuth` 훅 테스트            | T3.2  | `test/hooks/useAuth.test.ts` |

### Phase 4: 에러 처리 강화 (4주차)

| ID   | 업무                        | 의존성 | 대상 파일                     |
|------|---------------------------|-------|----------------------------|
| T4.1 | `ErrorBoundary` 컴포넌트 생성  | 없음   | `components/ErrorBoundary.tsx` |
| T4.2 | `ErrorFallback` UI 생성      | T4.1  | `components/ErrorFallback.tsx` |
| T4.3 | App.tsx에 ErrorBoundary 적용 | T4.2  | `App.tsx`                   |
| T4.4 | `logger` 유틸리티 생성         | 없음   | `lib/logger.ts`            |
| T4.5 | AttendanceModal 에러 처리 개선 | T4.4  | `AttendanceModal.tsx`       |

### Phase 5: 접근성 개선 (5주차)

| ID   | 업무                           | 의존성 | 대상 파일               |
|------|------------------------------|-------|----------------------|
| T5.1 | CalendarCell aria-label 추가   | 없음   | `CalendarCell.tsx`   |
| T5.2 | 진행률 바 시각적 보조 정보 추가        | T5.1  | `CalendarCell.tsx`   |
| T5.3 | 검색 입력/버튼 aria-label 추가      | 없음   | `StudentListPage.tsx` |
| T5.4 | 모달 포커스 관리 구현               | 없음   | `AttendanceModal.tsx` |

## 범위

### 포함
- `apps/web/src/` 내 모든 컴포넌트/훅/유틸리티
- 테스트 파일 (`apps/web/test/`)
- 번들 최적화

### 제외
- API 서버 (`apps/api/`)
- 공유 패키지 (`packages/`)
- 기능 변경 (UI/UX 동작은 동일하게 유지)

## 유스케이스

### UC-1: useSelectableList 훅 사용

**시나리오**: StudentListPage에서 학생 선택

```typescript
// Before: 6개의 중복 핸들러
const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
const handleSelectAll = (checked: boolean) => { /* ... */ };
const handleSelectOne = (id: string, checked: boolean) => { /* ... */ };
// ... 4개 더 반복

// After: 단일 훅
const { selectedIds, selectAll, selectOne, isAllSelected } = useSelectableList(students);
```

### UC-2: Lazy Loading 적용

**시나리오**: 초기 페이지 로딩

```typescript
// Before: 정적 import
import { DashboardPage } from '~/pages/DashboardPage';

// After: 동적 import
const DashboardPage = lazy(() => import('~/pages/DashboardPage'));

// 라우트에서 Suspense 적용
<Suspense fallback={<PageLoadingSpinner />}>
    <DashboardPage />
</Suspense>
```

### UC-3: CalendarGrid 메모이제이션

**시나리오**: 달력 월 변경 시

```typescript
// Before: 매 렌더링마다 그리드 재생성
const grid = generateGrid(year, month, days);

// After: 의존성 변경 시에만 재생성
const grid = useMemo(() => generateGrid(year, month, days), [year, month, days]);
```

### UC-4: Error Boundary 적용

**시나리오**: 네트워크 오류 발생

```typescript
// App.tsx
<ErrorBoundary fallback={<ErrorFallback />}>
    <AuthProvider>
        <RouterProvider router={router} />
    </AuthProvider>
</ErrorBoundary>
```

### UC-5: 훅 테스트 작성

**시나리오**: useStudents 테스트

```typescript
describe('useStudents', () => {
    it('학생 목록을 조회한다', async () => {
        const { result } = renderHook(() => useStudents(), { wrapper });

        await waitFor(() => {
            expect(result.current.students.length).toBeGreaterThan(0);
        });
    });
});
```

## 검증 체크리스트

### Phase 1 완료 조건
- [ ] `useSelectableList` 훅이 생성되고 StudentListPage에서 사용됨
- [ ] 선택 관련 코드가 50줄 이상 감소함
- [ ] `ChartContainer` 컴포넌트가 생성되고 3개 차트에서 사용됨
- [ ] `ATTENDANCE_MAP` 상수가 생성되고 변환 로직이 통합됨

### Phase 2 완료 조건
- [ ] 모든 페이지 컴포넌트가 `lazy()`로 로드됨
- [ ] `CalendarGrid`와 `CalendarCell`에 메모이제이션이 적용됨
- [ ] 번들 분석 결과 초기 로드 크기가 20% 이상 감소함

### Phase 3 완료 조건
- [ ] 테스트 유틸 (`renderWithProviders`, tRPC 모킹)이 설정됨
- [ ] `useStudents`, `useGroups`, `useAuth` 훅 테스트가 작성됨
- [ ] 모든 테스트가 통과함

### Phase 4 완료 조건
- [ ] `ErrorBoundary`가 앱 루트에 적용됨
- [ ] 네트워크 오류 시 사용자 친화적 메시지가 표시됨
- [ ] `logger` 유틸리티가 생성되고 `console.error` 대체함

### Phase 5 완료 조건
- [ ] 달력 셀에 출석률 aria-label이 적용됨
- [ ] 검색 기능에 aria-label이 적용됨
- [ ] 모달 열릴 때 포커스가 이동함

## 관련 문서

- Development: `docs/specs/target/non-functional/development/web-refactoring-optimization.md`