# 기능 설계: pwa-mobile-guide

> 상태: 구현 완료 | 작성일: 2026-05-08

## 연결 문서

- PRD: `docs/specs/prd/pwa-mobile-guide.md`
- 코드 SSoT: `apps/web/src/lib/pwa.ts`, `apps/web/src/hooks/usePwaEnvironment.ts`, `apps/web/src/hooks/usePwaGuideTrigger.ts`, `apps/web/src/components/common/PwaGuideCard.tsx`, `apps/web/public/manifest.webmanifest`, `apps/web/public/sw.js`

## 흐름/상태

### 사용자 플로우

1. 모바일 사용자가 카톡/링크/검색으로 첫 진입 → 환경 감지 훅이 userAgent + display-mode 평가
2. 사용자가 출석 입력 완료 (`AttendanceModal` 저장 성공) → `pwa:first-attendance` CustomEvent 발화 + localStorage 마킹
3. 1초 setTimeout 후 가이드 노출 조건 평가 → 충족 시 환경별 가이드 카드 표시
4. 사용자 액션 분기:
    - **A2HS 가능 환경** (Android Chrome / iOS Safari): "지금 설치" 또는 단계 안내 → 홈 화면 추가 → 다음 진입부터 standalone 모드, 가이드 노출 X
    - **A2HS 불가 환경** (iOS Chrome / 인앱 브라우저): "외부 브라우저로 열기" 또는 "사파리에서 열기" 클릭 → 새 탭/외부 앱
    - **닫기**: 7일 후 재노출
    - **다시 보지 않기**: 영구 차단

### 노출 차단 조건 (AND)

- 모바일 뷰포트 (Tailwind `<md`)
- standalone 모드 미진입
- 영구 dismiss 아님
- dismiss 7일 경과 또는 dismiss 부재
- 첫 출석 트리거 발화 (재진입 시 localStorage 폴백)
- 같은 세션 미노출

### 환경 감지 매트릭스

| 환경                              | 판별 기준                                      | 가이드 분기             |
| --------------------------------- | ---------------------------------------------- | ----------------------- |
| Android Chrome / Samsung Internet | Android + Chrome / SamsungBrowser, 인앱 패턴 X | 1. Android 자동 + CTA   |
| iOS Safari                        | iPhone/iPad/iPod + CriOS/FxiOS X + 인앱 X      | 2. iOS Safari 단계 안내 |
| iOS Chrome / Firefox              | CriOS / FxiOS                                  | 3. 사파리 유도          |
| 카톡 / 인스타 / 페북 인앱         | KAKAOTALK / Instagram / FBAN / FBAV            | 4. 외부 브라우저 유도   |
| 기타 모바일 / 데스크탑            | 위 외 / `≥md` 뷰포트                           | 노출 안 함              |

> userAgent 매칭 우선순위 — 인앱 → 비주류 iOS → SamsungBrowser → iOS Safari → Android Chrome 순. 역순 매칭 시 카톡 인앱이 Android Chrome으로 오분류됨.

## UI/UX

### 가이드 카드 5종 분기

| 분기               | 헤더                  | 1차 CTA               |
| ------------------ | --------------------- | --------------------- |
| 1. Android 자동    | 앱처럼 사용하기       | 지금 설치             |
| 2. iOS Safari      | 홈 화면에 추가하기    | (단계 안내, CTA 없음) |
| 3. iOS 사파리 유도 | 사파리에서 열어주세요 | 사파리에서 열기       |
| 4. 외부 브라우저   | 더 편하게 쓰려면      | 외부 브라우저로 열기  |
| 5. 미노출          | -                     | -                     |

### 노출 위치 / 형태

모바일 BottomTabBar 위에 토스트형 sticky. CSS 변수 `--bottom-tab-bar-height` 기반 위치 계산 + safe-area-inset-bottom + 8px 갭. 1차 CTA 클릭 시 자동 닫기 + 7일 dismiss. "다시 보지 않기" 텍스트 버튼은 영구 dismiss. X 버튼·"다시 보지 않기" 모두 44×44 터치 타깃 보장.

### 1차 CTA 동작

- Android 자동: `beforeinstallprompt` 이벤트 캡처값으로 `prompt()` 호출. 미캡처 시 비활성 + "잠시 뒤 다시 시도해 주세요" 보조 카피
- iOS Safari: CTA 없음 (Apple 정책)
- iOS Chrome / 인앱: `window.open(currentUrl, '_blank')` + 카피로 "우상단 메뉴 → 다른 브라우저로 열기" 수동 안내 병행

## 데이터/도메인 변경

### localStorage 키 (신규, `apps/web/src/lib/pwa.ts:PWA_STORAGE`)

| 키                          | 용도                                 |
| --------------------------- | ------------------------------------ |
| `pwa_guide_dismissed_at`    | ISO8601 timestamp, 7일 재노출 기준점 |
| `pwa_guide_disabled`        | 영구 dismiss 플래그                  |
| `pwa_first_attendance_done` | 첫 출석 입력 완료 플래그             |

> 모든 접근은 `safeGetItem`/`safeSetItem`로 wrap (Safari Private Browsing의 SecurityError 흡수, 호출자 크래시 방지).

### GA4 user_property (신규)

`is_pwa_user: true` — standalone display-mode 진입 시 1회 set. 7일 재방문율 회귀 측정용.

### 백엔드 변경

없음 — 클라이언트 단독.

## API / 인터페이스

### manifest + Service Worker

`apps/web/public/manifest.webmanifest` (standalone, theme `#5b3fad`, background `#ffffff`, icons 192/512/maskable). `apps/web/public/sw.js` minimal install-eligibility (no-op fetch, install/activate에서 `skipWaiting` + `clients.claim`). `main.tsx`에서 PROD 가드로 등록 + `beforeinstallprompt` / `appinstalled` 글로벌 리스너.

### GA4 이벤트 (신규, `apps/web/src/lib/analytics.ts`)

`trackPwaGuideShown(env)` / `trackPwaGuideDismissed(env, persistent)` / `trackPwaExternalBrowserClicked(env)` / `trackPwaA2hsInstalled(env)` / `setPwaUserProperty()`.

### 라우트 변경

없음.

## 예외 / 엣지 케이스

| 상황                                       | 처리                                                                                     |
| ------------------------------------------ | ---------------------------------------------------------------------------------------- |
| 첫 출석 입력 없이 이탈                     | 가이드 노출 X. 후속 진입에서 첫 출석 시 재평가                                           |
| standalone / 데스크탑 진입                 | 노출 차단 조건 충족 → 가이드 노출 X                                                      |
| 7일 경과 후 재진입                         | 재노출. 영구 dismiss는 유지                                                              |
| `beforeinstallprompt` 발화 안 됨 (Android) | manifest/SW 등록 실패 또는 HTTPS 미충족. 수동 안내 폴백 ("지금 설치" 비활성 + 보조 카피) |
| 카톡/인스타 인앱 외부 열기 무시            | 카피로 "우상단 메뉴 → 다른 브라우저로 열기" 수동 안내 병행                               |
| iOS 16.4 미만                              | manifest·standalone 동작 OK. 푸시 알림은 본 spec 미포함이라 영향 없음                    |
| `appinstalled` 미발화 환경                 | A2HS 측정은 standalone display-mode 진입으로 대체                                        |
| localStorage 비활성/시크릿 모드            | `safeGetItem`/`safeSetItem`이 throw 흡수 → 가이드 매 세션 노출 (UX degraded, 크래시 X)   |

## 측정 / 모니터링

GA4 이벤트 4종 + user_property `is_pwa_user`. 환경별 노출 분포(`pwa_guide_shown(env)`)로 한국 시장 카톡 인앱 진입 비중 가설 검증. 회귀 지표: 모바일 LCP / FCP 변화율 ±5% 이내.

## 테스트 시나리오 (코드 SSoT: `apps/web/test/pwa-mobile-guide.test.ts`)

### 정상

1. iOS Safari UA + 첫 출석 dispatch → 1초 후 카드 노출 + `trackPwaGuideShown('ios-safari')`
2. Android Chrome + `beforeinstallprompt` 캡처 + CTA → `prompt()` 호출 → accepted 시 `appinstalled` → `trackPwaA2hsInstalled`
3. 카톡 인앱 + CTA → `window.open` + `trackPwaExternalBrowserClicked('kakao')`
4. 환경 감지 7개 UA 패턴 단위 분기 매칭
5. dismiss(false) → `dismissed_at` 저장 + `trackPwaGuideDismissed`
6. standalone 진입 → `setPwaUserProperty()` 발화

### 예외

1. standalone / 데스크탑 / 첫 출석 미발화 → 가이드 노출 X
2. dismiss 6일 후 미노출 / 7일 1분 후 노출
3. 영구 dismiss → 7일 경과해도 노출 X
4. 카톡 인앱 `window.open` 무시 → 카피의 수동 안내로 폴백
