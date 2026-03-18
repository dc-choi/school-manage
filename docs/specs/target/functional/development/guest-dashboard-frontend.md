# Development: 게스트 대시보드 — 프론트엔드

> 비인증 시 `/`에 대시보드 레이아웃을 노출하고, 데이터 영역에 로그인 유도 안내를 표시합니다.

## 상위 문서

- PRD: `docs/specs/prd/guest-dashboard.md`
- 기능 설계: `docs/specs/functional-design/guest-dashboard.md`
- Task: `docs/specs/target/functional/tasks/guest-dashboard.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| F1 | 라우트 가드 해제 | O |
| F2 | MainLayout 게스트 모드 | O |
| F3 | LoginRequiredCard 컴포넌트 | O |
| F4 | DashboardPage 게스트 분기 | O |
| F5 | 사이드바 게스트 네비게이션 | O |

## 구현 개요

`/` 라우트의 `ProtectedRoute` 가드를 제거하고, `DashboardPage` 내부에서 인증 상태에 따라 게스트/인증 UI를 분기한다.

---

## F1: 라우트 가드 해제

### 파일: `apps/web/src/routes/index.tsx`

`/` 라우트에서 `ProtectedRoute` 래퍼 제거:

```
변경 전: path: '/' → ProtectedRoute → DashboardPage
변경 후: path: '/' → DashboardPage (직접)
```

- 다른 보호 라우트(`/groups`, `/students`, `/attendance`, `/settings`)는 기존 유지

---

## F2: MainLayout 게스트 모드

### 파일: `apps/web/src/components/layout/MainLayout.tsx`

헤더 우측 영역을 인증 상태에 따라 분기:

```
IF isAuthenticated THEN
  기존 UI: [계정 프로필 링크] [로그아웃 버튼]
ELSE
  게스트 UI: [로그인/회원가입 버튼]
```

### 게스트 헤더 상세

- 계정 프로필 링크(`<Link to="/settings">`) 숨김
- 로그아웃 버튼 자리에 "로그인/회원가입" 버튼 표시
- 아이콘: `LogIn` (lucide-react)
- 클릭 시 `/login`으로 navigate
- 스타일: 기존 로그아웃 버튼과 동일 (`variant="ghost"`, `size="sm"`)

### useAuth 안전 처리

- `MainLayout`은 이제 비인증 상태에서도 렌더링됨
- `account`가 null일 수 있으므로 optional chaining 사용
- `logout()` 함수는 게스트 모드에서 호출되지 않음

---

## F3: LoginRequiredCard 컴포넌트

### 파일: `apps/web/src/pages/dashboard/LoginRequiredCard.tsx` (신규)

데이터 영역을 대체하는 간단한 안내 카드:

- Card 컴포넌트 사용
- 중앙 정렬, `text-muted-foreground`
- "로그인이 필요합니다" 텍스트만 표시 (CTA 버튼 없음)
- `className` prop 전달 (부모 레이아웃에 맞춤)

---

## F4: DashboardPage 게스트 분기

### 파일: `apps/web/src/pages/dashboard/DashboardPage.tsx`

`DashboardPage` 최상위에서 인증 분기:

```
IF isAuthenticated THEN
  기존 로직 (온보딩 체크 → DashboardContent)
ELSE
  GuestDashboardContent 렌더링
```

### GuestDashboardContent (DashboardPage 내 함수 컴포넌트)

```
MainLayout (title="주일학교 출석부")
├── 필터 영역 (연도/월/주차) — 표시하되 disabled
├── LiturgicalSeasonCard — 정상 표시 (B1 공개 전환 후)
├── GroupStatisticsTable 자리 → LoginRequiredCard
├── 하단 grid
│   ├── GenderDistributionChart 자리 → LoginRequiredCard
│   └── TopRankingCard 자리 → LoginRequiredCard
```

### 숨기는 컴포넌트 (게스트 시)
- `JoinRequestsSection` — admin 전용
- `ContextBanner` — 온보딩 전용
- `PatronFeastCard` — 조직 데이터 의존

### tRPC 쿼리 호출 방지
- `useDashboardStatistics`, `useOnboardingStatus` 등 인증 필요 훅은 게스트 분기에서 호출하지 않음
- `trpc.liturgical.season`만 호출 (공개 API)

### GA4 이벤트
- 게스트 대시보드 진입 시 `guest_dashboard_viewed` 이벤트 추적

---

## F5: 사이드바 게스트 네비게이션

### 파일: `apps/web/src/components/layout/Sidebar.tsx`

비인증 시 네비 링크 클릭 동작 변경:

```
IF isAuthenticated THEN
  기존: Link to={item.path}
ELSE
  게스트: Link to="/login"
```

- `/` (대시보드)만 정상 이동, 나머지는 `/login`으로 이동
- 모바일 메뉴(Sheet)도 동일하게 처리 (MainLayout 내 navItems 순회 부분)

---

## 테스트 시나리오

### 정상 케이스

| 시나리오 | 기대 결과 |
|---------|----------|
| 비인증 유저 `/` 접속 | 대시보드 레이아웃 + LoginRequiredCard 표시 |
| 비인증 유저 "로그인/회원가입" 클릭 | `/login`으로 이동 |
| 비인증 유저 사이드바 "출석부" 클릭 | `/login`으로 이동 |
| 인증 유저 `/` 접속 | 기존 대시보드 동작 유지 |
| 비인증 유저에게 전례 시기 카드 표시 | 정상 렌더링 |
| 비인증 유저에게 축일 카드 미표시 | 숨김 |

### 예외 케이스

| 시나리오 | 기대 결과 |
|---------|----------|
| 인증 → 로그아웃 | 게스트 대시보드로 전환 (리다이렉트 없음) |
| 전례 시기 API 실패 | 카드 숨김 (기존 에러 처리 유지) |

---

**작성일**: 2026-03-18
**리뷰 상태**: Approved
