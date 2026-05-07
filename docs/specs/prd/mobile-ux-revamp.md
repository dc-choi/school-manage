# PRD: mobile-ux-revamp

> 상태: Draft | 작성일: 2026-05-07
> 기능명: `mobile-ux-revamp`

## 배경/문제 요약

- 참고:
    - `docs/business/0_feedback/entries/2026-04-19-sungbuk-mikaela-2.md` — 모바일 폰트/밀도·디자인 톤 일관성 지적
    - `docs/business/0_feedback/entries/2026-04-24-jang-hyun-do.md` — 대학생 교사 사용 맥락
    - `docs/business/1_market/market.md` (L30~32) — 사용자 특성: 2030세대(대학생~30대)
    - `docs/business/4_risk/risks.md` 리스크 18 — 대학생 시험기간 사용 저하 패턴
    - `.claude/rules/design.md` — GA4 모바일 62%, 평균 세션 31초~3분 48초, 최소 360px

- 문제:
    - 모바일 사용자 비중이 6배 크지만 짧은 세션에서 "1초 안에 핵심 정보" 가치를 충족하지 못함
    - 메인 내비가 햄버거 1점에 집중 → 화면 전환에 2탭 필요(햄버거 → 항목)
    - 헤더 64px·일관되지 않은 폰트/밀도로 모바일 정보 밀도 부족
    - 사용자 페르소나가 "30~60대 봉사자"로 가정되어 실제 타겟(2030)과 어긋남

- 현재 상태:
    - 햄버거 시트 단일 진입점, 메뉴 4개(대시보드/출석부/학년&부서/학생관리)
    - 통계 페이지 없음 — 학년별/성별/TOP5 카드는 대시보드에 함께 노출
    - 모바일 헤더 `h-16`(64px), main 패딩 `p-4 md:p-6`

- 목표 상태:
    - **모바일(<md) 한정** 하단 탭바 5탭(Home/출석/학생/통계/더보기)
    - 더보기 시트는 보조 메뉴(학년/설정/후원/로그아웃)만
    - 데스크탑(≥md) 사이드바·메뉴는 **변경 없음** (회귀 0). 데스크탑 대시보드도 학년별/성별/TOP5 카드 + 필터 그대로 유지
    - 통계 페이지 `/statistics` 신설 — **모바일 전용 진입점** (대시보드에서 모바일에서만 통계 카드/필터를 숨기고 통계 페이지로 분리). 데스크탑은 사이드바 메뉴 추가도 안 함
    - 모바일 헤더 56px, main padding-bottom 80px + safe-area-inset-bottom

## 목표/성공 기준

- **목표**:
    - 모바일 메인 내비를 1탭 전환으로 단축 (햄버거 2탭 → 탭바 1탭)
    - 모바일 헤더 14% 절감 (64→56px)
    - 디자인 토큰 일관성(폰트/밀도/터치 타겟) 확립
    - 데스크탑 **기능적** 회귀 0 (사이드바에 "통계" 메뉴 1개 추가는 의도된 변경, 기존 4개 메뉴/스타일/동작은 그대로)

- **성공 지표**:
    - GA4 모바일 평균 세션당 페이지뷰 +20% (배포 후 14일)
    - GA4 `nav_tab_clicked` 발생량 ≥ `nav_more_sheet_opened` (탭바 직접 이용 우세)
    - 모바일 LCP 회귀 ±5% 이내
    - 데스크탑 GA4 이벤트 변화 0(회귀 0 지표)

- **측정 기간**: 배포 후 14일

## 사용자/대상

- **주요 사용자**: 2030세대 교리교사(대학생~30대), 모바일 비중 GA4 62%
- **사용 맥락**: 매주 일요일 출석 체크 + 평일 학생/축일 빠른 조회. 세션 31초~3분 48초

## 범위

### 포함

- 신규 컴포넌트: 하단 탭바, 더보기 시트, `/statistics` 페이지(모바일 진입 한정)
- 변경: `MainLayout.tsx`(모바일 헤더/시트/패딩 + 탭바 마운트), `DashboardPage.tsx`(통계 카드/필터를 모바일에서만 `hidden md:flex/grid` 처리, 데스크탑은 그대로)
- 변경 없음: `Sidebar.tsx`(데스크탑 메뉴 0 변경, 회귀 0)
- designMd/내부 페르소나 정정(30~60대 → 2030)

### 제외

- 데스크탑(≥md) 사이드바 동작/외관 변경
- 색상 시스템(oklch) 변경
- 화면별 데이터 페치/필터/카드 로직 변경
- 출석 입력 모달/학생 목록/학생 상세의 콘텐츠/플로우 재설계 (디자인 토큰 정합만 적용)
- 통계 페이지의 신규 분석 뷰(월별 트렌드, 학년 비교 등)

## 사용자 시나리오

1. **모바일 출석 체크**: 사용자가 PWA 진입 → 하단 탭바 [출석] 1탭 → 캘린더 즉시 노출
2. **모바일 통계 조회**: 사용자가 [통계] 1탭 → 학년별/성별/TOP5 화면(기존 대시보드 스크롤 대체)
3. **모바일 보조 메뉴**: 사용자가 [더보기] 1탭 → 시트 → 학년/설정/후원/로그아웃 4개만 노출
4. **데스크탑 사용자**: 변화 인지 없이 기존 사이드바 + "통계" 메뉴 1개 추가

## 요구사항

### 필수 (Must)

- [ ] 모바일(<md)에서 하단 탭바 노출, 5탭 (Home/출석/학생/통계/더보기)
- [ ] 활성 탭 시각 표시 (primary 색상, 아이콘 + 라벨)
- [ ] 더보기 시트는 보조 항목만(학년/설정/후원/로그아웃)
- [ ] 모든 화면 모바일 main에 `padding-bottom: 80px` + `safe-area-inset-bottom`
- [ ] 모바일 헤더 56px (`h-14`)
- [ ] `/statistics` 라우트 등록 + `StatisticsPage` 생성 (모바일 진입 한정)
- [ ] 대시보드의 학년별 출석/성별 분포/우수출석 TOP5 카드 + 필터를 **모바일에서만 hidden** (`hidden md:flex/grid`). 데스크탑은 그대로
- [ ] 데스크탑 사이드바 navItems 변경 없음 (회귀 0)
- [ ] 데스크탑(≥md) 외관/내비/대시보드 콘텐츠 변경 없음(스크린샷 회귀 확인)
- [ ] 최소 360px 보장
- [ ] 모든 터치 타겟 ≥44×44px
- [ ] 페르소나/designMd 정정 (30~60대 → 2030)

### 선택 (Should)

- [ ] GA4 이벤트 추가: `analytics.trackNavTabClicked(tab)`, `analytics.trackMoreSheetOpened()`
- [ ] 활성 탭 상단 2px primary 보더 액센트
- [ ] 통계 페이지 진입 시 학년/연도 필터 컨텍스트 보존(URL 쿼리)

### 제외 (Out)

- 통계 페이지 신규 분석 뷰
- iOS/Android 네이티브 앱
- 색상 시스템 변경
- 다른 화면(출석 입력 모달/학생 목록/학생 상세)의 콘텐츠 재설계

## 제약/가정/리스크/의존성

- **제약**:
    - 최소 너비 360px 보장 (`rules/design.md` GA4 기준)
    - PWA — `safe-area-inset-bottom` 필수
    - 모바일 ↔ 데스크탑 분기는 Tailwind `md:` 브레이크포인트로 일관 처리

- **가정**:
    - 통계 페이지 콘텐츠 = 현 대시보드 카드 그대로 이전 (신규 분석 없음)
    - 모바일에서 햄버거 시트는 폐기 — 더보기 탭이 시트 진입점
    - 데스크탑 사이드바 사용자 비중 ≥8%(GA4)이므로 회귀 금지

- **리스크**:
    - 통계 분리로 대시보드 정보 밀도 저하 → 핵심 요약(전례/축일자/합류 요청)은 잔존
    - 탭바 페이지 padding-bottom 누락 시 콘텐츠 가림 → MainLayout 일괄 처리
    - 데스크탑 시각 회귀 — 메뉴 1개 추가 외 변경 없음. 그래도 스냅숏 점검

- **내부 의존성**: shadcn/ui(Sheet, Button, Card), lucide-react(Home, CalendarCheck, GraduationCap, BarChart3, Menu, Users, Settings, Heart, LogOut), React Router v6
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: PR 머지 → 자동 배포(단계적 출시 없음)
- **이벤트**: 신규 `nav_tab_clicked`(label=tab_name), `nav_more_sheet_opened`. 기존 이벤트 변경 없음
- **검증**: `pnpm test`(StatisticsPage·MainLayout·하단 탭바 컴포넌트), Conductor diff에서 데스크탑 변경 없음 확인, 배포 후 14일 GA4 모니터링

## 오픈 이슈

- [x] 통계 페이지 학년/연도 필터 컨텍스트 전달 방식 — **URL 쿼리** 채택 (`?year&month&week`, FD 결정)
- [x] "학년&부서" → "학년" 단순화 여부 — **더보기 시트는 "학년"**, 데스크탑 사이드바는 "학년&부서" 유지(회귀 0)
- [x] 더보기 시트 슬라이드 방향 — `side="right"` (더보기 탭 위치와 같은 방향)
- [x] 게스트 모바일 더보기 시트 항목 — 학년 + **로그인/회원가입** + (후원, hasDonationLink일 때) 조합으로 빈 시트 방지
- [ ] 활성 탭 보더(상단 2px primary) 색상 외 단서 추가 — 적용됨, GA4 추적 결과 확인 후 유지/조정
- [ ] `/groups/:id` 등에서 "더보기" 활성 표시 동작 — 의도된 동작, GA4 `nav_more_sheet_opened` 빈도로 사용자 혼란 여부 모니터링
- [ ] `StatisticsPage` 청크 369KB(recharts 포함). `vite.config.ts`의 `vendor-charts` 패턴이 적용 안 된 상태(별도 vendor 청크 미분리). 후속 spec에서 manualChunks 진단 + recharts 별도 vendor 분리

## 연결 문서

- 사업 문서: `docs/business/0_feedback/`, `docs/business/1_market/market.md`, `docs/business/4_risk/risks.md`
- 기능 설계: `docs/specs/functional-design/mobile-ux-revamp.md` (다음 단계)
