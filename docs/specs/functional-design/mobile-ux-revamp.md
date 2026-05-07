# 기능 설계: mobile-ux-revamp

> 상태: Draft | 작성일: 2026-05-07

## 연결 문서

- PRD: `docs/specs/prd/mobile-ux-revamp.md`
- 도메인 메인 (관련): `docs/specs/functional-design/statistics.md` — 통계 페이지 신설 시 6단계에서 병합 대상

## 흐름/상태

### 사용자 플로우

1. 모바일 진입 → 하단 탭바 5탭 노출, 헤더 햄버거 미노출
2. 사용자가 [통계] 1탭 → `/statistics` → 학년별/성별/TOP5 즉시 표시 (URL 쿼리 필터 보존)
3. 사용자가 [더보기] 1탭 → 우측 슬라이드 시트(288px) → 보조 메뉴 항목 (인증 시 학년/설정/후원/로그아웃, 게스트 시 학년/로그인/회원가입/후원)
4. 데스크탑(≥md) 진입 → 기존 사이드바 + "통계" 메뉴 1개 추가, 탭바 미노출

### 활성 탭 판별 (`useLocation` 기반)

| pathname                                     | 활성 탭 |
| -------------------------------------------- | ------- |
| `/` (정확 일치)                              | Home    |
| `/attendance` (prefix)                       | 출석    |
| `/students` (prefix)                         | 학생    |
| `/statistics` (prefix)                       | 통계    |
| 그 외 (`/groups`, `/settings`, `/donate` 등) | 더보기  |

### 더보기 시트 동작

- "더보기" 탭 클릭 → `Sheet` open(우측, 288px). 더보기 탭 위치(우측 끝)와 같은 방향에서 슬라이드
- 항목 클릭 → `navigate(path)` + `setOpen(false)`
- 게스트는 학년 외에 로그인/회원가입을 시트에서 노출(빈 시트 방지)
- 후원은 `hasDonationLink === true`일 때만 표시 (현 패턴 동일)

## UI/UX

### 레이아웃 분기 (Tailwind `md:` 기준)

| 영역                       | 모바일 (<md)                           | 데스크탑 (≥md)              |
| -------------------------- | -------------------------------------- | --------------------------- |
| 사이드바 (`Sidebar.tsx`)   | `hidden`                               | **기존 그대로 (변경 없음)** |
| 헤더 높이                  | `h-14` (56px)                          | `h-16` (64px) — 기존 유지   |
| 햄버거 시트 (Sheet)        | 폐기 (탭바로 대체)                     | 노출 안 됨 (사이드바 사용)  |
| 하단 탭바 (`BottomTabBar`) | `sticky bottom-0` 노출                 | `hidden`                    |
| `<main>` 패딩              | `p-4 pb-20` + `safe-area-inset-bottom` | `md:p-6` 기존               |
| 대시보드 통계 카드/필터    | `hidden`, `/statistics`로 분리         | **그대로 표시**             |

### 화면/컴포넌트

| 컴포넌트                         | 신규/변경     | 핵심                                                                                                                                                               |
| -------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BottomTabBar` (신규)            | 신규          | 5탭(Home/Calendar/GraduationCap/BarChart3/Menu), 활성 표시, fixed bottom, `md:hidden`                                                                              |
| `MoreSheet` (MainLayout 내 분기) | 신규          | 보조 4항목 — 학년/설정/(후원)/로그아웃 (게스트는 학년/로그인/회원가입/(후원))                                                                                      |
| `MainLayout.tsx`                 | 변경          | 모바일 헤더 56px / `<main>`에 `pb-20` / 모바일 햄버거 트리거 제거 / 탭바 마운트                                                                                    |
| `Sidebar.tsx`                    | **변경 없음** | 데스크탑 사이드바 메뉴 그대로 (회귀 0)                                                                                                                             |
| `DashboardPage.tsx`              | 변경          | 학년별/성별/TOP5 카드 + 필터에 `hidden md:flex/grid` 적용 — **모바일에서만 숨김, 데스크탑 그대로**. 합류요청·전례·축일자·온보딩·컨텍스트 배너는 모든 뷰포트에 노출 |
| `StatisticsPage.tsx` (신규)      | 신규          | 위 3개 카드 + 필터(연/월/주차). `useDashboardStatistics` 훅 재사용. **모바일 진입 한정** (탭바 통계 탭)                                                            |

### 라벨 결정

- 데스크탑 사이드바: **기존 그대로** — "대시보드/출석부/학년&부서/학생 관리" (4개 메뉴, 회귀 0)
- 모바일 탭바: "홈/출석/학생/통계/더보기" (5자 이하 단일어)
- 더보기 시트: "학년" (학년&부서 → 모바일에서 단순화)

### 권한별 차이

기존 분기 그대로. ADMIN의 합류 요청 카드는 대시보드 잔존.

## 데이터/도메인 변경

없음. 백엔드 스키마·tRPC procedure·마이그레이션 변경 없음.

## API/인터페이스

### 필터 상태 관리 (PRD 오픈 이슈 #1 해소)

`/statistics` 페이지는 **URL 쿼리**로 필터 보존:

- `?year=2026&month=5&week=2`
- 새로고침/공유/뒤로가기 시 컨텍스트 유지
- 대시보드↔통계 이동 시 동일 쿼리 전달
- 파싱: `useSearchParams` (React Router v6)

### 라우트 추가 (`apps/web/src/routes/index.tsx`)

| 경로          | 페이지                  | 인증 | 동의 |
| ------------- | ----------------------- | ---- | ---- |
| `/statistics` | `StatisticsPage` (lazy) | Yes  | Yes  |

### GA4 이벤트 (`apps/web/src/lib/analytics.ts`에 추가)

- `analytics.trackNavTabClicked(tab: 'home' | 'attendance' | 'students' | 'statistics' | 'more')`
- `analytics.trackMoreSheetOpened()`
- `analytics.trackStatisticsViewed()` — `/statistics` 진입 시

## 컴포넌트 인터페이스 요약

### `BottomTabBar`

- props: 없음 (`useLocation` / `useNavigate` / `useAuth` 내부 사용)
- a11y: `<nav aria-label="주요 내비게이션">`, 각 탭 `<Link>` + `aria-current="page"` 활성 시
- 위치: `fixed inset-x-0 bottom-0 z-40 md:hidden`
- 게스트: 인증 필요 탭은 클릭 시 `/login`으로 (현 햄버거 시트 패턴 동일)

### `MoreSheet` (MainLayout 내부 합성)

- 시트 trigger = 탭바 "더보기" 항목
- 시트 항목: 학년(`/groups`) / 설정(`/settings`) / 후원(`/donate`, 옵션) / 로그아웃(`logout()`)
- 항목 컴포넌트: 기존 햄버거 시트의 `<button>` 패턴 재사용

## 예외/엣지 케이스

| 상황                                  | 처리                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| 게스트가 인증 필요 탭 클릭            | `/login`으로 리다이렉트 (기존 패턴)                                           |
| 매칭 안 되는 라우트(`/groups/:id` 등) | "더보기" 활성                                                                 |
| 통계 페이지 빈/에러 데이터            | 기존 카드 빈 상태 컴포넌트 그대로                                             |
| 360px 너비                            | 5탭 × 라벨 11px + 아이콘 20px → 충분히 들어감(~70px/탭). 텍스트 truncate 적용 |
| iOS PWA 홈바 영역                     | `safe-area-inset-bottom` 패딩으로 회피                                        |
| 데스크탑 시각 회귀                    | 사이드바 메뉴 1개 추가 외 변경 없음. 스크린샷 diff에서 추가 메뉴만 영향       |

## 측정/모니터링

- 신규 GA4 이벤트 3종 (위 명시)
- 회귀 지표: 모바일 LCP (배포 후 14일), 데스크탑 GA4 페이지뷰 변화율 0% 가까이

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 모바일에서 `BottomTabBar` 5탭 노출. `[출석]` 클릭 → `/attendance` + 활성 표시
2. **TC-2**: `/statistics` 진입 → 학년별/성별/TOP5 카드 렌더, 필터 변경 시 URL 쿼리(`?month=5`) 갱신
3. **TC-3**: 모바일 `[더보기]` → 시트 열림, `[설정]` 클릭 → `/settings` 이동 + 시트 닫힘 + GA4 `trackMoreSheetOpened` 발생
4. **TC-4**: 데스크탑(≥md) 사이드바에 "통계" 메뉴 노출. 클릭 → `/statistics` + 활성 표시
5. **TC-5**: 대시보드에서 학년별/성별/TOP5 카드가 더 이상 렌더되지 않음(이전됨 검증)

### 예외 케이스

1. **TC-E1**: 게스트가 `[학생]` 탭 클릭 → `/login` 리다이렉트
2. **TC-E2**: `/groups/123` 진입 → 탭바 "더보기" 활성
3. **TC-E3**: 360px 모바일 뷰포트에서 탭바 5탭 모두 보이고 라벨 안 깨짐
