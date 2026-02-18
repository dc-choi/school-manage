# Development: 셀프 온보딩 (Frontend)

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.

## 상위 문서

- PRD: `docs/specs/prd/self-onboarding.md`
- 기능 설계: `docs/specs/functional-design/auth-account.md` (셀프 온보딩 섹션)
- Task: `docs/specs/target/functional/tasks/self-onboarding.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| F1 | 온보딩 상태 훅 | O |
| F2 | GA4 이벤트 추가 | O |
| F3 | 대시보드 체크리스트 UI | O |
| F4 | 빈 상태 안내 강화 | O |

## 구현 개요

DashboardPage에서 기존 API 데이터로 온보딩 완료 여부를 판단하고, 미완료 시 일반 대시보드 대신 체크리스트를 표시한다.

---

## F1: 온보딩 상태 훅

### 파일 위치

`apps/web/src/hooks/useOnboardingStatus.ts` (공통 훅 — 여러 페이지에서 사용 가능)

### 사용 API

| API | 용도 | 완료 조건 |
|-----|------|----------|
| `trpc.group.list` | 그룹 존재 여부 | `groups.length > 0` |
| `trpc.student.list` | 멤버 존재 여부 | `total > 0` |
| `trpc.statistics.yearly` | 출석 기록 존재 여부 | `avgAttendance > 0` |

### 반환 값

```
{
  isOnboardingComplete: boolean   // 3단계 모두 완료 여부
  currentStep: 1 | 2 | 3 | 0     // 현재 진행할 단계 (0 = 완료)
  hasGroups: boolean
  hasStudents: boolean
  hasAttendance: boolean
  isLoading: boolean              // 3개 쿼리 중 하나라도 로딩 중
  isError: boolean                // 3개 쿼리 중 하나라도 에러
}
```

### 로직

```
hasGroups     = groups.length > 0
hasStudents   = total > 0
hasAttendance = avgAttendance > 0

IF NOT hasGroups     → currentStep = 1
ELSE IF NOT hasStudents  → currentStep = 2
ELSE IF NOT hasAttendance → currentStep = 3
ELSE                     → currentStep = 0 (완료)

isOnboardingComplete = currentStep === 0
```

### student.list 호출 시 파라미터

멤버 존재 여부만 판단하므로 최소 파라미터로 호출:

```
{ page: 1 }
```

### statistics.yearly 호출 시 파라미터

현재 연도 기준:

```
{ year: new Date().getFullYear() }
```

---

## F2: GA4 이벤트 추가

### analytics.ts에 추가할 메서드

```
trackOnboardingChecklistShown(step: number)
  → 이벤트명: onboarding_checklist_shown
  → 파라미터: { step }

trackOnboardingStepClicked(step: number)
  → 이벤트명: onboarding_step_clicked
  → 파라미터: { step }

trackOnboardingCompleted(daysSinceSignup: number)
  → 이벤트명: onboarding_completed
  → 파라미터: { days_since_signup: daysSinceSignup }
```

### 호출 시점

| 메서드 | 호출 위치 | 트리거 |
|--------|----------|--------|
| `trackOnboardingChecklistShown` | 체크리스트 컴포넌트 마운트 (useEffect) | 체크리스트 표시 시 1회 |
| `trackOnboardingStepClicked` | CTA 버튼 onClick | 단계 CTA 클릭 시 |
| `trackOnboardingCompleted` | 체크리스트 컴포넌트에서 isOnboardingComplete 감지 | 3단계 완료 시 1회 |

---

## F3: 대시보드 체크리스트 UI

### 컴포넌트 구조

```
DashboardPage.tsx
├── useOnboardingStatus() 호출
├── IF isLoading → 로딩 스피너
├── IF isError OR isOnboardingComplete → 기존 대시보드 (변경 없음)
├── ELSE → OnboardingChecklist 컴포넌트
│   ├── 제목: "시작하기 가이드"
│   ├── 부제: "3단계만 완료하면 바로 사용할 수 있어요"
│   └── 단계별 카드 × 3
│       ├── StepCard (1: 그룹 만들기)
│       ├── StepCard (2: 멤버 등록하기)
│       └── StepCard (3: 출석 체크하기)
```

### OnboardingChecklist 컴포넌트

`apps/web/src/pages/DashboardPage.tsx` 내부에 정의 (단일 사용이므로 별도 파일 불필요)

### 단계별 데이터

```
ONBOARDING_STEPS = [
  {
    step: 1,
    title: "그룹 만들기",
    description: "반이나 모임을 만들어보세요",
    ctaLabel: "그룹 추가",
    ctaPath: "/groups/new",
  },
  {
    step: 2,
    title: "멤버 등록하기",
    description: "멤버를 추가하면 출석 체크를 시작할 수 있어요",
    ctaLabel: "멤버 추가",
    ctaPath: "/students/new",
  },
  {
    step: 3,
    title: "출석 체크하기",
    description: "날짜를 선택하고 출석을 체크해보세요",
    ctaLabel: "출석부 열기",
    ctaPath: "/attendance",
  },
]
```

### 단계별 상태 스타일

| 상태 | 아이콘 | 카드 스타일 | CTA |
|------|--------|-----------|-----|
| 완료 | Check 아이콘 (lucide) | muted 배경, 제목 취소선 | 없음 |
| 현재 | 단계 번호 강조 | primary border 강조 | Button (primary) |
| 대기 | 단계 번호 (muted) | 기본 border | 없음 |

### 사용 컴포넌트

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| Card | Card | 전체 컨테이너 + 단계별 카드 |
| Button | Button | CTA 버튼 |
| Check | lucide-react | 완료 아이콘 |

### 레이아웃

| 뷰포트 | 레이아웃 | 비고 |
|--------|----------|------|
| 모바일 | 단일 컬럼, 풀 너비 | 단계 카드 세로 배치 |
| 데스크톱 | `max-w-lg mx-auto` | 중앙 정렬 |

### DashboardPage 변경 사항

기존 DashboardPage 최상단에 온보딩 분기 추가:

```
변경 후:
  const onboarding = useOnboardingStatus()

  IF onboarding.isLoading → 로딩 표시
  IF onboarding.isError OR onboarding.isOnboardingComplete →
    <DashboardContent /> (기존 대시보드 로직을 하위 컴포넌트로 추출)
  ELSE →
    OnboardingChecklist 표시 (MainLayout 내부)
```

- 기존 대시보드 로직(`useDashboardStatistics` 등)을 `DashboardContent` 하위 컴포넌트로 추출 (Rules of Hooks — 조건부 훅 호출 방지)
- 온보딩 미완료 시 `DashboardContent`가 렌더되지 않으므로 `useDashboardStatistics`도 호출되지 않음 (불필요한 API 호출 방지)
- `useOnboardingStatus`의 `isError` 시 일반 대시보드 표시 (fallback)

---

## F4: 빈 상태 안내 강화

### GroupListPage.tsx

현재 빈 상태:
```
"등록된 그룹이 없습니다."
```

변경 후:
```
"등록된 그룹이 없습니다.
그룹을 만들면 멤버를 등록할 수 있어요."
```

위치: TableCell 내부 텍스트 변경

### StudentListPage.tsx

현재 빈 상태 (emptyMessage prop):
```
"등록된 멤버가 없습니다."
```

변경 후:
```
"등록된 멤버가 없습니다.
멤버를 등록하면 출석 체크를 시작할 수 있어요."
```

위치: Table 컴포넌트의 `emptyMessage` prop 변경

---

## 구현 대상 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `apps/web/src/hooks/useOnboardingStatus.ts` | 신규 | 온보딩 상태 판단 훅 |
| `apps/web/src/lib/analytics.ts` | 수정 | 온보딩 GA4 이벤트 3개 추가 |
| `apps/web/src/pages/DashboardPage.tsx` | 수정 | 온보딩 체크리스트 분기 + 컴포넌트 추가 |
| `apps/web/src/pages/group/GroupListPage.tsx` | 수정 | 빈 상태 안내 문구 변경 |
| `apps/web/src/pages/student/StudentListPage.tsx` | 수정 | 빈 상태 안내 문구 변경 |

## 접근성 체크리스트

- [ ] 체크리스트 카드에 시맨틱 마크업 (`<ol>` 또는 적절한 구조)
- [ ] CTA 버튼에 명확한 텍스트 (aria-label 불필요 — 텍스트 버튼)
- [ ] 완료 체크 아이콘에 `aria-hidden="true"` (취소선 텍스트로 상태 전달)
- [ ] 키보드 Tab으로 CTA 버튼 접근 가능

## 테스트 시나리오

### 정상 케이스

| 시나리오 | 기대 결과 |
|---------|----------|
| 그룹/멤버/출석 0건 → 대시보드 진입 | 체크리스트 표시, 1단계 "그룹 만들기" 강조 |
| 그룹 1개+, 멤버 0명 → 대시보드 진입 | 1단계 완료, 2단계 "멤버 등록" 강조 |
| 그룹+멤버+, 출석 0건 → 대시보드 진입 | 1·2단계 완료, 3단계 "출석 체크" 강조 |
| 출석 1건+ → 대시보드 진입 | 체크리스트 미표시, 일반 대시보드 |
| CTA "그룹 추가" 클릭 | `/groups/new`로 이동 |
| CTA "멤버 추가" 클릭 | `/students/new`로 이동 |
| CTA "출석부 열기" 클릭 | `/attendance`로 이동 |

### 예외 케이스

| 시나리오 | 기대 결과 |
|---------|----------|
| API 에러 발생 | 일반 대시보드 표시 (fallback) |
| API 로딩 중 | 로딩 스피너 표시 |
| 데이터 전체 삭제 후 재진입 | 체크리스트 재표시 |

### GA4 이벤트 검증

| 시나리오 | 이벤트 | 파라미터 |
|---------|--------|----------|
| 체크리스트 표시 | `onboarding_checklist_shown` | step: 현재 단계 |
| CTA 클릭 | `onboarding_step_clicked` | step: 클릭한 단계 |
| 3단계 모두 완료 | `onboarding_completed` | days_since_signup |

---

**작성일**: 2026-02-18
**리뷰 상태**: Draft