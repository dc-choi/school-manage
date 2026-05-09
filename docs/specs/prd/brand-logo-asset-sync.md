# PRD: 위클리스쿨 신 브랜드 로고 자산 동기화 (brand-logo-asset-sync)

> 상태: Draft | 작성일: 2026-05-09

> SDD quick 플로우 — 자산 교체 중심. 최소 섹션만 작성.

## 배경/문제 요약

- 참고: `docs/content/brand/logo.md` (v2), `docs/content/brand/README.md`, 커밋 #305 (2026-05-09 브랜드 1차 확정)
- 문제: 2026-05-09 위클리스쿨 신 브랜드가 확정되었으나, 웹 자산(favicon / apple-touch / PWA 아이콘 3종 / OG 이미지)은 #91·#300 시점 구 브랜드(보라 `#5b3fad`) 그대로 남아 있어 사용자가 처음 마주치는 시각 정체성이 신 브랜드와 불일치한다.
- 추가 제약 (2026-05-09 v2): 1차 확정안의 sunburst(햇살) 모티프가 욱일기를 연상시킨다는 피드백을 받아 **햇살을 제거**한 v2로 재구성. 본 PR이 적용할 신 브랜드 = **`WEEKLY SCHOOL` 워드마크 + 웃는 ◎ + amber 별 + sparkle** (햇살 없음).
- 현재 상태:
    - `apps/web/public/{favicon.png,apple-touch-icon.png,og-image.png,icons/icon-{192,512,512-maskable}.png}` 6개 모두 구 브랜드
    - `apps/web/public/logo.jpeg`는 코드/HTML/manifest 어디서도 참조되지 않는 잔재 (`f48a6e5` 이후 미갱신)
- 목표 상태: 신 브랜드 SVG 1개를 SSoT로 두고, 사용자 가시 자산 6종이 거기서 파생된다. 잔재 자산은 제거된다.

## 목표/성공 기준

- **목표**: 신 브랜드 자산 6곳 동기화 + 단일 SVG SSoT 확립 + 잔재 1건 제거
- **성공 지표**: 배포 후 브라우저 탭·iOS 홈 추가·PWA 설치·카톡 OG 미리보기 4채널에서 모두 신 브랜드 노출 (정성 검증)

## 사용자/대상

- **주요 사용자**: 모든 웹 방문자 (인증 전 포함) + PWA 설치 사용자
- **사용 맥락**: 첫 진입 시 브라우저 탭 / 링크 공유 미리보기 / 모바일 홈 아이콘

## 범위

### 포함

- `apps/web/public/logo.svg` 신규 작성 — `logo.md` "구성 요소/컬러/의미/Don't" 사양 + `assets/logo-reference.jpg` 시각 기준 준수
- 자산 교체 (SVG → PNG export):
    - `favicon.png` (브라우저 탭)
    - `apple-touch-icon.png` (iOS 홈)
    - `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-512-maskable.png` (PWA)
    - `og-image.png` (소셜 공유)
- `apps/web/public/logo.jpeg` 삭제
- `index.html`에 SVG favicon link 추가 (벡터 우선)
- `logo.md:74-79` 적용 체크리스트 중 본 PR 범위 항목 체크 갱신

### 제외

- 한글 워드마크 락업 ("위클리스쿨" Pretendard ExtraBold) — `logo.md:79` 별건
- Sidebar 등 UI 컴포넌트 내 이미지 로고 도입 (현재 텍스트 "주일학교 출석부" 유지)
- 인스타 프로필 / 카드뉴스 워터마크 갱신 — `logo.md:77-78` 콘텐츠 영역 별건
- "Symbol only" 베리에이션 (`logo.md:42`) — 추후 별건

## 사용자 시나리오

1. 첫 방문자가 브라우저 탭 아이콘으로 신 브랜드를 인지한다.
2. 사용자가 카톡/슬랙에 링크 공유 시 OG 미리보기로 신 브랜드 노출.
3. PWA 설치 사용자가 모바일 홈 화면에서 신 브랜드 아이콘으로 진입한다.

## 요구사항

### 필수 (Must)

- [ ] `apps/web/public/logo.svg` 작성 — `logo.md` v2 사양(인디고 워드마크 + 웃는 ◎ + amber 별 + sparkle + 크림 컨테이너) + Don't 위반 없음 (**sunburst/햇살/방사 라인 일체 금지**, 십자가·후광·표정 변형 금지)
- [ ] `favicon.png` (32×32 또는 48×48) 교체
- [ ] `apple-touch-icon.png` (180×180) 교체
- [ ] `icons/icon-192.png` (192×192) 교체
- [ ] `icons/icon-512.png` (512×512) 교체
- [ ] `icons/icon-512-maskable.png` (512×512, safe-area 80% 이내 보장) 교체
- [ ] `og-image.png` (1200×630) 교체 — 컨테이너 그대로 두면 가운데가 비므로 OG 전용 레이아웃 1회 작성
- [ ] `apps/web/public/logo.jpeg` 삭제
- [ ] `index.html`에 `<link rel="icon" type="image/svg+xml" href="/logo.svg" />` 추가 (기존 PNG favicon은 fallback으로 유지)
- [ ] `index.html` `theme-color` `#5b3fad` → `#4F46E5` (구 보라 → 신 인디고)
- [ ] `manifest.webmanifest` `theme_color` `#5b3fad` → `#4F46E5`, `background_color` `#ffffff` → `#FAFAF9`
- [ ] `docs/content/brand/logo.md` 적용 체크리스트(74-76행) 본 PR 범위 항목 체크

### 선택 (Should)

- [ ] `manifest.webmanifest`에 SVG src 항목 추가 검토 (브라우저 PWA 벡터 지원 시 우선 사용)

### 제외 (Out)

- 한글 워드마크 락업
- Sidebar/UI 이미지 로고 도입
- 인스타 콘텐츠 워터마크
- Symbol only / Mono / Wordmark only 베리에이션
- **햇살(sunburst) 모티프** — v2에서 영구 제외

## 제약/가정/리스크/의존성

- **제약**: `logo.md` v2 "Don't" 5개 항목 위반 금지 (sunburst/햇살/방사 라인 일체 금지·웃는 ◎ 표정 변형·워드마크 폰트 교체·amber 액센트 색 변경·종교 직접 심볼 합성)
- **가정**: SVG에서 PNG로 결정적 export 가능 (CLI 도구 또는 브라우저 export)
- **리스크**: 벡터 재현이 레퍼런스 jpg와 정확히 일치하지 않을 수 있음 → 사용자 검수 게이트로 보정. 일치도가 낮으면 잔재 PNG도 함께 살려두는 fallback 무의미하므로 vector 재현 품질을 1순위로 본다.
- **의존성**: 없음 (자산만 교체, 코드/패키지 의존성 변경 없음)

## 롤아웃/검증

- **출시 단계**: 단일 PR 배포. CDN/SW 캐시 영향 검토 (sw.js precache 대상이면 버전 갱신 필요).
- **검증**: 배포 후 브라우저 탭 / iOS Safari "홈 화면에 추가" / PWA 설치 / kakao link 디버거(`developers.kakao.com/tool/debugger/sharing`) / `opengraph.xyz` 5채널 직접 확인.

## 오픈 이슈

- [ ] PNG export 도구 결정 (rsvg-convert / sharp / Inkscape CLI / 브라우저 캡처) — FD 단계에서 확정
- [ ] PWA / SW 캐시 무효화 전략 (파일명 해시 vs 동일 파일명 + 버전 쿼리) — FD 단계에서 확정

## 연결 문서

- 브랜드: `docs/content/brand/logo.md`, `docs/content/brand/README.md`
- 기능 설계: `docs/specs/functional-design/brand-logo-asset-sync.md` (TBD — `/sdd 2`)
