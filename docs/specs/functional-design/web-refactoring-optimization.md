# 기능 설계: 웹 앱 리팩토링/최적화

> 이 문서는 기능의 **"어떻게 동작하는가"** 를 정의합니다.
> 분류: Non-Functional (Performance)

## 연결 문서

- PRD: `docs/specs/prd/school-attendance.md`
- Task: `docs/specs/target/non-functional/tasks/web-refactoring-optimization.md`
- Development: `docs/specs/target/non-functional/development/web-refactoring-optimization.md`

## 배경/목표

### 배경

현재 `apps/web` 코드베이스에서 다음 문제가 식별됨:
1. 중복 코드로 인한 유지보수성 저하
2. 불필요한 리렌더링으로 인한 성능 이슈
3. 테스트 커버리지 부족
4. 접근성(a11y) 미흡

### 목표

- 코드 중복 제거 및 유지보수성 향상
- 성능 최적화 (Lazy Loading, 메모이제이션)
- 테스트 커버리지 확대
- 접근성 개선

### 범위

| 포함 | 제외 |
|------|------|
| 코드 중복 제거 | 기능 추가 |
| 성능 최적화 | UI 디자인 변경 |
| 에러 처리 강화 | 새 페이지 추가 |
| 접근성 개선 | |
| 테스트 커버리지 확대 | |

---

## 변경 대상

### 1. 코드 중복 제거 (High Priority)

| 대상 파일 | 변경 내용 |
|----------|----------|
| `StudentListPage.tsx` | 선택 로직 통합 (`useSelectableList` 훅 생성) |
| `StudentListPage.tsx` | 테이블 컬럼 정의 통합 (`buildStudentColumns` 함수) |
| `dashboard/*.tsx` | 차트 컴포넌트 래퍼 생성 (`ChartContainer`) |
| `AttendanceModal.tsx` | 출석 상태 변환 통합 (`ATTENDANCE_MAP`) |

### 2. 성능 최적화 (High Priority)

| 대상 파일 | 변경 내용 |
|----------|----------|
| `routes/index.tsx` | Lazy Loading 적용 (페이지 단위) |
| `CalendarGrid.tsx` | 메모이제이션 (`useMemo`, `memo`) |
| `DashboardPage.tsx` | 데이터 변환 메모이제이션 |
| `lib/trpc.ts` | 캐시 전략 개선 (도메인별 staleTime 설정) |

### 3. 에러 처리 강화 (Medium Priority)

| 대상 파일 | 변경 내용 |
|----------|----------|
| `components/ErrorBoundary.tsx` (신규) | Error Boundary 컴포넌트 생성 |
| `AttendanceModal.tsx` | 에러 처리 개선 |
| `lib/logger.ts` (신규) | 로깅 유틸리티 생성 |

### 4. 접근성 개선 (Medium Priority)

| 대상 파일 | 변경 내용 |
|----------|----------|
| `CalendarCell.tsx` | 진행률 바에 aria-label 추가 |
| `StudentListPage.tsx` | 검색 입력/버튼에 aria-label 추가 |
| 전역 | 모달 포커스 관리 |

### 5. 테스트 커버리지 확대 (High Priority)

| 대상 파일 | 변경 내용 |
|----------|----------|
| `test/utils/` (신규) | 테스트 유틸 설정 |
| `test/hooks/` (신규) | 훅 테스트 추가 (useStudents 등) |
| `test/components/` (신규) | 컴포넌트 테스트 추가 |

---

## 테스트 시나리오

### 정상 케이스

| TC | 시나리오 | 기대 결과 |
|----|----------|----------|
| TC-1 | 페이지 Lazy Loading | 페이지 컴포넌트가 `lazy()`로 로드됨 |
| TC-2 | CalendarGrid 메모이제이션 | 불필요한 리렌더링 감소 |
| TC-3 | 초기 번들 크기 | 20% 이상 감소 |
| TC-4 | 훅 테스트 실행 | `useStudents`, `useGroups`, `useAuth` 테스트 통과 |

### 예외 케이스

| TC | 시나리오 | 기대 결과 |
|----|----------|----------|
| TC-E1 | Lazy Loading 실패 | Suspense fallback + 재시도 버튼 표시 |
| TC-E2 | Error Boundary 중첩 에러 | 최상위 fallback UI 표시 |

---

## 롤아웃 계획

1. **1차**: 코드 중복 제거 + 성능 최적화
2. **2차**: 에러 처리 강화 + 접근성 개선
3. **3차**: 테스트 커버리지 확대

---

**작성일**: 2026-01-28
**상태**: Draft (Feature에서 마이그레이션)
