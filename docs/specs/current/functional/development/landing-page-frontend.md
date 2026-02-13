# Development: 랜딩 페이지 — 프론트엔드

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 상위 문서

- 기능 설계: `docs/specs/functional-design/auth-account.md` (랜딩 페이지 섹션)
- Task: `docs/specs/target/functional/tasks/landing-page.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| F1 | 라우트 등록 | O |
| F2 | LandingPage 컴포넌트 | O |
| F3 | GA4 이벤트 추적 | O |
| F4 | 빌드/타입체크 검증 | O |

## 구현 개요

인스타그램 유입 사용자를 설득하는 `/landing` 퍼블릭 페이지를 구현한다. 히어로 → 기능 소개 → 사회적 증거 + CTA 단일 스크롤 구성이며, 기존 `account.count` API를 재사용한다.

---

## F1: 라우트 등록

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/routes/index.tsx` | `/landing` public 라우트 추가 |
| `apps/web/src/pages/index.ts` | LandingPage export 추가 |

### 라우트 정의

```
경로: /landing
컴포넌트: LandingPage
인증: public (ProtectedRoute 래핑 없음)
위치: routes 배열의 public routes 블록 (login, signup 다음)
```

### import 추가

```
pages/index.ts에 LandingPage export 추가
routes/index.tsx에 LandingPage import 추가
```

---

## F2: LandingPage 컴포넌트

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/pages/LandingPage.tsx` | 신규 생성 |

### 컴포넌트 구조

```
LandingPage.tsx (단일 파일)
├── 인증 리다이렉트 로직
├── account.count 쿼리
├── Header (로고 + 로그인 링크)
├── ① HeroSection (인라인)
│   ├── 헤드라인 + 서브카피
│   ├── 주 CTA 버튼
│   └── 스크린샷 이미지
├── ② FeaturesSection (인라인)
│   └── 기능 카드 4개 (아이콘 + 제목 + 설명)
├── ③ SocialProof + FinalCTA (인라인)
│   ├── "{N}개 단체가 사용 중입니다"
│   ├── "무료로 시작하기" CTA
│   └── "이미 계정이 있으신가요?" 로그인 링크
└── Footer (간단)
```

> 분리 기준: 랜딩 페이지 전용 섹션이므로 별도 컴포넌트 파일 분리 없이 **단일 파일**로 구성한다. 재사용 대상이 아니며, 단일 파일이 충분히 관리 가능한 크기(~200줄)이다.

### 인증 리다이렉트 로직

```
IF 인증 상태 AND 인증 로딩 완료 THEN
    /landing → / 리다이렉트 (replace)
```

- 패턴: LoginPage.tsx의 인증 체크 패턴 재사용
- useAuth()에서 isAuthenticated, isLoading 가져옴

### account.count 쿼리

```
trpc.account.count.useQuery(undefined, {
    retry: false,
    staleTime: 5 * 60 * 1000,   // 5분 캐시
})
```

- 패턴: AuthLayout.tsx와 동일

### Header

| 요소 | 내용 | 동작 |
|------|------|------|
| 로고/서비스명 | 텍스트 로고 | 없음 (앵커 역할) |
| 로그인 링크 | "로그인" | → /login, GA4 landing_login_click |

레이아웃:
```
┌─────────────────────────────────────┐
│ [서비스명]                  [로그인] │
└─────────────────────────────────────┘
```

- 상단 고정(sticky) 없음, 스크롤에 따라 이동
- 모바일/데스크톱 동일 구조

### ① Hero Section

| 요소 | 내용 |
|------|------|
| 헤드라인 | "모임 운영, 클릭 한 번으로" |
| 서브카피 | "출석, 멤버, 통계를 한곳에서 관리하세요" |
| 주 CTA | "무료로 시작하기" 버튼 → /signup |
| 스크린샷 | `/images/screenshot-dashboard.png` |

반응형 레이아웃:
```
모바일 (< lg):
┌──────────────┐
│  헤드라인      │
│  서브카피      │
│  [CTA 버튼]   │
│  스크린샷      │
└──────────────┘

데스크톱 (≥ lg):
┌───────────────┬───────────────┐
│  헤드라인       │  스크린샷       │
│  서브카피       │               │
│  [CTA 버튼]    │               │
└───────────────┴───────────────┘
```

히어로 배경:
- 그라데이션 배경 (primary 계열) — AuthLayout.tsx의 `bg-gradient-to-br from-primary/10 via-primary/5 to-background` 패턴 참고
- CTA 버튼: primary variant, 충분한 크기 (모바일에서 터치 편의)

스크린샷 이미지:
```
소스: /images/screenshot-dashboard.png (기존 이미지 재사용)
최대 너비: 480px (데스크톱), 100% (모바일)
실패 처리: onError → display: none (AuthLayout 패턴 재사용)
스타일: rounded-xl border shadow-2xl (AuthLayout 패턴 재사용)
```

### ② Features Section

기능 카드 데이터:

| # | 기능 | 아이콘 | 설명 |
|---|------|--------|------|
| 1 | 출석 체크 | ClipboardCheck | 탭 한 번으로 출석 완료 |
| 2 | 멤버 관리 | Users | 멤버 정보 한곳에서 관리 |
| 3 | 통계/리포트 | BarChart3 | 출석 현황 한눈에 파악 |
| 4 | 달력 뷰 | Calendar | 월별 출석 기록 달력으로 확인 |

레이아웃:
```
모바일 (< md): 1열 (세로 나열)
태블릿 (≥ md): 2열 그리드
데스크톱 (≥ lg): 4열 그리드
```

카드 구조:
```
각 카드:
┌─────────────────┐
│    [아이콘]       │
│    제목           │
│    설명           │
└─────────────────┘
```

- 카드 배경 없음 (텍스트 + 아이콘만, 심플하게)
- 아이콘: lucide-react, h-8 w-8, text-primary
- 제목: font-semibold
- 설명: text-muted-foreground

### ③ Social Proof + Final CTA

| 요소 | 내용 | 조건 |
|------|------|------|
| 사회적 증거 | "{N}개 단체가 사용 중입니다" | countData && count > 0 |
| 부가 신뢰 | "무료로 가입, 30초면 시작" | 항상 표시 |
| 최종 CTA | "무료로 시작하기" 버튼 | → /signup |
| 로그인 링크 | "이미 계정이 있으신가요?" | → /login |

사회적 증거 숨김 조건:
```
IF countData 없음 OR count === 0 THEN
    사회적 증거 영역 숨김
    부가 신뢰 + CTA + 로그인 링크는 유지
```

### Footer

```
"© {현재연도} 출석부" (간단한 1줄)
```

### 상태별 UI

| 상태 | UI 표시 |
|------|---------|
| account.count 로딩 중 | 사회적 증거 영역 숨김 (로딩 스피너 없음) |
| account.count 실패 | 사회적 증거 영역 숨김 |
| 스크린샷 로드 실패 | 이미지 영역 숨김 (onError) |
| 인증된 사용자 | / 로 리다이렉트 |

---

## F3: GA4 이벤트 추적

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `apps/web/src/lib/analytics.ts` | 3개 이벤트 함수 추가 |

### 이벤트 정의

| 함수명 | GA4 이벤트명 | 파라미터 | 트리거 |
|--------|-------------|----------|--------|
| `trackLandingView` | `landing_view` | 없음 | 페이지 마운트 시 (useEffect) |
| `trackLandingCtaClick` | `landing_cta_click` | `position: 'hero' \| 'bottom'` | CTA 버튼 클릭 시 |
| `trackLandingLoginClick` | `landing_login_click` | 없음 | 로그인 링크 클릭 시 |

### analytics.ts 추가 내용

```
trackLandingView:
    safeGtag('event', 'landing_view')
    트리거: useEffect([], []) — 마운트 시 1회

trackLandingCtaClick(position):
    safeGtag('event', 'landing_cta_click', { position })
    position: 'hero' (히어로 CTA) 또는 'bottom' (하단 CTA)

trackLandingLoginClick:
    safeGtag('event', 'landing_login_click')
    트리거: Header 로그인 링크 또는 하단 로그인 링크 클릭
```

### LandingPage에서 이벤트 호출

```
마운트 시:
    useEffect(() => { analytics.trackLandingView(); }, []);

히어로 CTA onClick:
    analytics.trackLandingCtaClick('hero');
    navigate('/signup');

하단 CTA onClick:
    analytics.trackLandingCtaClick('bottom');
    navigate('/signup');

로그인 링크 onClick:
    analytics.trackLandingLoginClick();
    (Link to="/login" 으로 이동)
```

---

## F4: 빌드/타입체크 검증

### 실행 명령

```
pnpm typecheck && pnpm build
```

### 통과 기준

- TypeScript 컴파일 에러 0건
- Vite 빌드 성공
- ESLint/Prettier 에러 없음 (`pnpm lint:fix && pnpm prettier:fix` 선행)

---

## 사용 컴포넌트

| 컴포넌트 | 출처 | 용도 |
|----------|------|------|
| Button | shadcn/ui | CTA 버튼, 로그인 링크 |
| Link | react-router-dom | 페이지 네비게이션 |
| Navigate | react-router-dom | 인증 리다이렉트 |
| ClipboardCheck, Users, BarChart3, Calendar | lucide-react | 기능 소개 아이콘 |

## 접근성 체크리스트

- [ ] CTA 버튼에 명확한 텍스트 ("무료로 시작하기")
- [ ] 스크린샷 이미지에 alt 속성 ("출석부 대시보드 화면")
- [ ] 키보드 네비게이션 가능 (Tab으로 CTA/링크 접근)
- [ ] 포커스 표시 유지 (focus-visible:ring)
- [ ] 시맨틱 HTML (header, main, section, footer)

## 테스트 시나리오

> 테스트는 수동 검증으로 진행한다 (기존 웹 테스트 커버리지 ~2%, 단위 테스트 미도입 상태).

### 정상 케이스

| 시나리오 | 기대 결과 |
|---------|----------|
| TC-LP1: /landing 접근 | 히어로 + 기능 소개 + CTA 정상 표시 |
| TC-LP2: 히어로 CTA 클릭 | /signup 이동, GA4 landing_cta_click(hero) |
| TC-LP3: 하단 CTA 클릭 | /signup 이동, GA4 landing_cta_click(bottom) |
| TC-LP4: 로그인 링크 클릭 | /login 이동, GA4 landing_login_click |
| TC-LP5: 사회적 증거 | account.count 값 동적 표시 |
| TC-LP6: 모바일 레이아웃 | 단일 컬럼, 기능 카드 세로 배치 |

### 예외 케이스

| 시나리오 | 기대 결과 |
|---------|----------|
| TC-LP7: 인증된 사용자 /landing 접근 | / 리다이렉트 |
| TC-LPE1: account.count 실패 / 0 | 사회적 증거 숨김, 나머지 정상 |
| TC-LPE2: 스크린샷 로드 실패 | 이미지 영역 숨김, 나머지 정상 |

## 구현 시 주의사항

- [ ] AuthLayout은 사용하지 않음 (별도 단일 스크롤 레이아웃)
- [ ] account.count 쿼리 옵션은 AuthLayout과 동일하게 (retry: false, staleTime: 5분)
- [ ] 스크린샷 이미지 재사용 (`/images/screenshot-dashboard.png`)
- [ ] CTA 버튼 클릭 시 GA4 이벤트 → navigate 순서
- [ ] useEffect 의존성 빈 배열 (마운트 시 1회만 trackLandingView)

## AI 구현 지침

### 파일 위치

| 역할 | 경로 |
|------|------|
| 페이지 | `apps/web/src/pages/LandingPage.tsx` (신규) |
| 배럴 export | `apps/web/src/pages/index.ts` (수정) |
| 라우트 | `apps/web/src/routes/index.tsx` (수정) |
| 이벤트 | `apps/web/src/lib/analytics.ts` (수정) |

### 참고할 기존 패턴

| 패턴 | 참고 파일 |
|------|----------|
| 인증 리다이렉트 | `apps/web/src/pages/LoginPage.tsx:14-15` |
| account.count 쿼리 | `apps/web/src/components/layout/AuthLayout.tsx:10-13` |
| 사회적 증거 표시/숨김 | `apps/web/src/components/layout/AuthLayout.tsx:38-43` |
| 스크린샷 onError 처리 | `apps/web/src/components/layout/AuthLayout.tsx:33-35` |
| GA4 이벤트 함수 | `apps/web/src/lib/analytics.ts` (safeGtag 패턴) |
| public 라우트 등록 | `apps/web/src/routes/index.tsx:19-26` |

### 코드 스타일

- 화살표 함수 사용 (React 컴포넌트 제외: `export function LandingPage()`)
- 4 spaces 인덴트, single quotes, 세미콜론
- Tailwind 클래스 순서: 레이아웃 → 간격 → 색상 → 기타

---

**작성일**: 2026-02-13
**리뷰 상태**: Approved
