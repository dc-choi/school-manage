# Feature: 웹 앱 리팩토링/최적화

## 메타데이터

| 항목     | 내용                                                          |
|--------|---------------------------------------------------------------|
| 문서 상태 | Draft                                                         |
| 우선순위  | P1                                                            |
| 분류     | Non-Functional (Performance)                                  |
| 대상     | `apps/web/`                                                   |

## 상위 문서 참조

- PRD: `docs/specs/prd/school-attendance.md`

## 배경

현재 `apps/web` 코드베이스에서 다음 문제가 식별됨:
1. 중복 코드로 인한 유지보수성 저하
2. 불필요한 리렌더링으로 인한 성능 이슈
3. 테스트 커버리지 부족
4. 접근성(a11y) 미흡

## 사용자 스토리

### US-1: 개발자로서 중복 코드 제거
개발자로서, 중복된 선택 로직을 통합하여 코드 유지보수성을 향상시킨다.

### US-2: 사용자로서 빠른 초기 로딩
사용자로서, Lazy Loading이 적용되어 초기 페이지 로딩 시간이 단축된다.

### US-3: 개발자로서 안정적인 리팩토링
개발자로서, 테스트 커버리지가 확보되어 리팩토링 시 회귀 버그를 방지한다.

### US-4: 사용자로서 효율적인 달력 조작
사용자로서, 메모이제이션이 적용되어 달력 UI가 부드럽게 동작한다.

## 기능 요구사항

### FR-1: 코드 중복 제거 (High Priority)

| ID     | 요구사항                                           | 대상 파일                      |
|--------|------------------------------------------------|----------------------------|
| FR-1.1 | 선택 로직 통합 (`useSelectableList` 훅 생성)           | `StudentListPage.tsx`      |
| FR-1.2 | 테이블 컬럼 정의 통합 (`buildStudentColumns` 함수)       | `StudentListPage.tsx`      |
| FR-1.3 | 차트 컴포넌트 래퍼 생성 (`ChartContainer`)               | `dashboard/*.tsx`          |
| FR-1.4 | 출석 상태 변환 통합 (`ATTENDANCE_MAP`)                  | `AttendanceModal.tsx`      |

### FR-2: 성능 최적화 (High Priority)

| ID     | 요구사항                                     | 대상 파일               |
|--------|------------------------------------------|---------------------|
| FR-2.1 | Lazy Loading 적용 (페이지 단위)                 | `routes/index.tsx`  |
| FR-2.2 | CalendarGrid 메모이제이션 (`useMemo`, `memo`)  | `CalendarGrid.tsx`  |
| FR-2.3 | DashboardPage 데이터 변환 메모이제이션             | `DashboardPage.tsx` |
| FR-2.4 | 캐시 전략 개선 (도메인별 staleTime 설정)            | `lib/trpc.ts`       |

### FR-3: 에러 처리 강화 (Medium Priority)

| ID     | 요구사항                              | 대상 파일                |
|--------|-----------------------------------|----------------------|
| FR-3.1 | Error Boundary 컴포넌트 생성            | `components/` (신규)   |
| FR-3.2 | AttendanceModal 에러 처리 개선          | `AttendanceModal.tsx` |
| FR-3.3 | 로깅 유틸리티 생성 (`lib/logger.ts`)      | `lib/` (신규)          |

### FR-4: 접근성 개선 (Medium Priority)

| ID     | 요구사항                                | 대상 파일               |
|--------|-------------------------------------|---------------------|
| FR-4.1 | CalendarCell 진행률 바에 aria-label 추가   | `CalendarCell.tsx`  |
| FR-4.2 | 검색 입력/버튼에 aria-label 추가            | `StudentListPage.tsx` |
| FR-4.3 | 모달 포커스 관리                          | 전역                  |

### FR-5: 테스트 커버리지 확대 (High Priority)

| ID     | 요구사항                        | 대상 파일                    |
|--------|-----------------------------|-----------------------------|
| FR-5.1 | 테스트 유틸 설정                  | `test/utils/` (신규)         |
| FR-5.2 | 훅 테스트 추가 (useStudents 등)   | `test/hooks/` (신규)         |
| FR-5.3 | 컴포넌트 테스트 추가               | `test/components/` (신규)    |

### FR-6: 코드 품질 개선 (Low Priority)

| ID     | 요구사항                     | 대상 파일           |
|--------|--------------------------|------------------|
| FR-6.1 | 상수 파일 분리 (`constants/`)  | `constants/` (신규) |
| FR-6.2 | Table 컴포넌트 타입 안전성 강화   | `Table.tsx`       |

## 인수 조건

### AC-1: 코드 중복 제거
- [ ] `StudentListPage.tsx`의 선택 핸들러가 3개 → 1개로 통합됨
- [ ] 차트 컴포넌트 로딩/에러 처리가 `ChartContainer`로 통합됨
- [ ] 출석 상태 변환 로직이 단일 `ATTENDANCE_MAP`으로 통합됨

### AC-2: 성능 최적화
- [ ] 페이지 컴포넌트가 `lazy()`로 로드됨
- [ ] `CalendarGrid`에 `useMemo`와 `memo`가 적용됨
- [ ] 초기 번들 크기가 20% 이상 감소함

### AC-3: 에러 처리
- [ ] `ErrorBoundary` 컴포넌트가 앱 루트에 적용됨
- [ ] 네트워크 오류 시 사용자 친화적 메시지가 표시됨

### AC-4: 접근성
- [ ] 달력 셀에 스크린 리더가 읽을 수 있는 출석률 정보가 제공됨
- [ ] 검색 기능에 적절한 aria-label이 적용됨

### AC-5: 테스트
- [ ] `useStudents`, `useGroups`, `useAuth` 훅 테스트가 작성됨
- [ ] 테스트 커버리지가 기존 대비 50% 이상 증가함

## 엣지 케이스

| ID    | 케이스                       | 처리 방법                       |
|-------|---------------------------|-------------------------------|
| EC-1  | Lazy Loading 실패           | Suspense fallback + 재시도 버튼 |
| EC-2  | 대량 학생 선택 시 성능           | 가상화(virtualization) 검토      |
| EC-3  | Error Boundary 중첩 에러      | 최상위 fallback UI 표시         |

## 관련 문서

- Task: `docs/specs/target/non-functional/tasks/web-refactoring-optimization.md`
- Development: `docs/specs/target/non-functional/development/web-refactoring-optimization.md`