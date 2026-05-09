# PRD: pwa-mobile-guide

> 상태: Draft | 작성일: 2026-05-08
> 기능명: `pwa-mobile-guide`

## 배경/문제 요약

- 참고:
    - `docs/business/HISTORY.md` (05-08 갱신) — 장현도 정성 시그널 + 가이드 ROI 분석 + R24 보조 가설
    - `docs/business/STATUS.md` 오픈 이슈 "PWA 지원 + 모바일 진입 가이드"
    - `docs/business/6_roadmap/roadmap.md` 2단계 잔여
    - `docs/business/4_risk/risks.md` R24 ① 정지 패턴 (광교2동·영종·신암·풍납동)
    - `.claude/rules/design.md` — 모바일 GA4 62%, 최소 360px

- 문제:
    - 모바일 사용자는 매번 브라우저 열고 URL 입력 → 로그인. 1주 1회 사용 빈도에서 마찰이 누적되어 재방문 저하 의심
    - 친구(직업: 교사, 동일 페르소나)가 자력으로 "홈화면 추가" 시도했으나 OS·브라우저 따라 동작이 들쭉날쭉 (삼성폰 크롬 OK, 다른 폰 크롬 미설치 시 실패)
    - 카카오톡 / 인스타그램 인앱 브라우저로 진입한 사용자는 PWA 설치 자체 불가 — 한국 시장 1차 진입의 다수가 카톡 링크로 추정
    - iOS Chrome은 WebKit 엔진 강제로 standalone 모드 미지원 — manifest를 만들어도 사파리에서만 진짜 PWA 동작

- 현재 상태:
    - `apps/web/public/`에 manifest·service-worker 부재
    - "홈화면 추가"는 브라우저 기본 북마크 수준 — 아이콘만 생기고 standalone X
    - 환경별 진입 마찰 차이 측정·관리 없음

- 목표 상태:
    - PWA manifest + 아이콘으로 standalone 풀스크린 동작 (iOS Safari + Android Chrome)
    - 환경별 가이드 카드 5종 분기 — Android Chrome 자동 / iOS Safari 수동 / iOS Chrome 사파리 유도 / 카카오톡 인앱 외부 브라우저 유도 / 인스타 인앱 외부 브라우저 유도
    - 가이드 노출 → A2HS 전환 측정 가능

## 목표/성공 기준

- **목표**:
    - 모바일 재방문 마찰 감소 (URL 입력 → 홈 아이콘 1탭)
    - 환경별 진입 마찰을 가이드로 흡수해 A2HS 또는 외부 브라우저 전환 유도
    - 측정 가능한 지표 도입으로 R24 ① 정지 패턴 일부에 재방문 마찰 가설 보조 검증

- **성공 지표** (배포 후 30일):
    - **A2HS 비율** (`matchMedia('(display-mode: standalone)')` 진입 세션 / 전체 모바일 세션) ≥ **5%**
    - **인앱 브라우저 → 외부 열기 유도 클릭률** ≥ **20%** (한국 시장 마찰 1순위)
    - **iOS Safari 가이드 노출 → 7일 내 standalone 진입 전환율** ≥ **10%**
    - **standalone 진입 사용자 7일 재방문율** vs 일반 모바일 (참고 지표, 회귀 검증)

- **측정 기간**: 배포 후 30일

## 사용자/대상

- **주요 사용자**: 2030세대 교리교사·운영자 (모바일 GA4 62%)
- **사용 맥락**: 매주 주일 출석 입력 + 평일 빠른 조회. 1차 진입은 카카오톡 공유 링크가 다수 (가설, 본 PRD 측정으로 검증)

## 범위

### 포함

- `manifest.webmanifest` 작성 — 이름, 짧은 이름, theme/background color, display: standalone, icons (192/512/maskable)
- 아이콘 자산: 192px / 512px / maskable 512px (기존 `apple-touch-icon.png` 재활용 가능 여부 확인)
- HTML 메타태그 정합: `<link rel="manifest">`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `theme-color`
- 환경 감지 훅 (`useUserAgent` 또는 유틸): Android Chrome / iOS Safari / iOS Chrome / 카카오톡 인앱 / 인스타 인앱 / 기타 분기
- 가이드 카드 컴포넌트 5종 분기 + dismiss 정책 (localStorage 기반 7일 재노출)
- Android Chrome `beforeinstallprompt` 이벤트 캡처 → 커스텀 CTA 버튼 (시스템 자동 배너 보강)
- GA4 이벤트 4종: `pwa_guide_shown` / `pwa_guide_dismissed` / `pwa_external_browser_clicked` / `pwa_a2hs_installed`
- 노출 트리거: 첫 출석 입력 완료 직후 1초 (첫 효용 체험 후)
- standalone 모드 감지 시 가이드 노출 차단

### 제외

- 오프라인 캐시 / 자산 캐시 Service Worker (데이터 신선도 리스크 — 별도 spec). 단 **설치 가능 조건 충족용 minimal SW (no-op fetch handler, 캐시 로직 없음)는 포함** — Android Chrome `beforeinstallprompt` 발화에 SW가 필수이기 때문
- 푸시 알림 (별도 spec, "도입 후 학생 미등록 자동 알림 시스템화"와 연계)
- 네이티브 앱 (iOS/Android)
- iOS Safari 외 푸시 알림 (Android FCM 등)
- 가이드 카드 A/B 테스트 인프라 (배포 후 단일 안 측정 → 데이터 기반 후속 spec)

## 사용자 시나리오

1. **iOS Safari 첫 진입**: 사용자가 카톡 링크 → 사파리로 열기 → 첫 출석 입력 완료 → 1초 후 가이드 카드 ("홈 화면에 추가하면 앱처럼 쓸 수 있어요") → 공유 → 홈 화면에 추가
2. **Android Chrome**: 사용자가 카톡 링크 → 크롬으로 열기 → 첫 출석 완료 → 크롬 자동 설치 배너 + 우리 가이드 카드 (보강 CTA) → 1탭 설치
3. **iOS Chrome**: 사용자가 카톡 링크 → iOS Chrome으로 열기 → 첫 출석 완료 → 가이드 카드 ("아이폰에선 사파리에서 열어야 풀스크린 앱처럼 사용 가능") → "사파리에서 열기" 안내
4. **카카오톡 인앱 진입**: 사용자가 카톡 링크 → 카톡 인앱 브라우저로 열림 → 1초 후 가이드 카드 ("더 편하게 쓰려면 사파리/크롬에서 열어보세요") → 외부 브라우저 유도
5. **재방문**: 사용자가 홈 아이콘 탭 → standalone 풀스크린 진입 → 가이드 카드 노출 X (이미 설치됨)

## 요구사항

### 필수 (Must)

- [ ] `manifest.webmanifest` + 아이콘 192/512/maskable 추가, 빌드 시 정적 자산 포함
- [ ] HTML 메타태그 정합 (`apps/web/index.html` 또는 동등 위치)
- [ ] 환경 감지 유틸 (Android Chrome / iOS Safari / iOS Chrome / 카카오톡 / 인스타 / 기타) — userAgent 기반 분기
- [ ] 가이드 카드 컴포넌트 5종 (환경별 카피·시각 단서 분기)
- [ ] iOS Safari 가이드: 공유 아이콘 → 홈 화면에 추가 단계별 안내 (시각 단서 포함)
- [ ] iOS Chrome 가이드: "사파리에서 열기" 안내
- [ ] 카카오톡·인스타 인앱: "외부 브라우저로 열기" 안내
- [ ] dismiss 후 7일 재노출 정책 (localStorage `pwa_guide_dismissed_at`)
- [ ] standalone 모드 감지 시 가이드 노출 차단 (`matchMedia('(display-mode: standalone)')`)
- [ ] 첫 출석 입력 완료 직후 1초 노출 트리거 (이전에는 노출 X)
- [ ] 설치 가능 조건 충족용 minimal Service Worker 등록 (`/sw.js`, no-op fetch handler, 캐시 로직 없음) — Android Chrome 자동 배너·`beforeinstallprompt` 발화 조건
- [ ] GA4 이벤트 4종 — `pwa_guide_shown(env)` / `pwa_guide_dismissed(env)` / `pwa_external_browser_clicked(env)` / `pwa_a2hs_installed(env)`
- [ ] 모든 가이드 카드 ≥360px·터치 타겟 ≥44×44px (`rules/design.md` 정합)

### 선택 (Should)

- [ ] Android Chrome `beforeinstallprompt` 이벤트 캡처 → 가이드 카드 내 "지금 설치" 버튼 (시스템 자동 배너 보강)
- [ ] standalone 사용자 GA4 user_property 부착 (`is_pwa_user: true`) — 7일 재방문율 비교 측정용
- [ ] 가이드 카드 시각 단서 (공유 아이콘 위치 화살표 정적 이미지) — 카피만으로 부족할 시
- [ ] 가이드 카드 dismiss 시 "다시 보지 않기" 옵션 (영구 dismiss)

### 제외 (Out)

- Service Worker / 오프라인 캐시
- 푸시 알림 (모든 OS)
- 네이티브 앱
- A/B 테스트 인프라
- 가이드 카드 다국어 (한국어 단일)

## 제약/가정/리스크/의존성

- **제약**:
    - iOS Safari A2HS는 자동 프롬프트 불가 (Apple 정책) — 우리 가이드 카드 + 사용자 수동 탭
    - iOS Chrome은 WebKit 엔진 강제로 standalone 미지원 — 사파리 유도가 유일 처방
    - 카카오톡·인스타 인앱은 PWA 설치 불가 — 외부 브라우저 유도만 가능
    - manifest `display: standalone` 은 사용자가 A2HS 후에만 효과

- **가정**:
    - 카톡 인앱 진입 비중이 가장 크다 (본 PRD 측정으로 검증)
    - 첫 출석 입력 직후가 효용 체험 시점이라 가이드 거부감 최소
    - dismiss 7일 재노출이 짜증 임계 이하
    - 기존 `apple-touch-icon.png` (180px) 외에 192/512 추가 필요

- **리스크**:
    - 가이드 노출 타이밍 잘못 잡으면 거부감 → 첫 출석 입력 완료 후로 한정
    - iOS Chrome / 카톡 인앱 비중이 낮으면 가이드 ROI 저하 → 환경별 노출 분포 측정으로 후속 결정
    - A2HS 후에도 카톡 링크 진입은 인앱에서 열리는 것이 OS 기본 — 사용자 학습 필요, 본 PRD 외 처방 없음
    - manifest `theme_color`가 기존 사이트 톤과 어긋나면 첫 진입 인상 저하 → `rules/design.md` 토큰 사용

- **내부 의존성**: shadcn/ui (Card, Button), lucide-react (Share, ExternalLink, Smartphone), 기존 analytics 모듈 (GA4 이벤트 유틸), `apps/web/public/` 정적 자산
- **외부 의존성**: GA4

## 롤아웃/검증

- **출시 단계**: PR 머지 → 자동 배포 (단계적 출시 없음, 신규 노출이라 회귀 위험 작음)
- **이벤트**: 신규 4종 — `pwa_guide_shown(env)` / `pwa_guide_dismissed(env)` / `pwa_external_browser_clicked(env)` / `pwa_a2hs_installed(env)`. 기존 이벤트 변경 없음
- **검증**: `pnpm test` (manifest 정합 + 환경 감지 유틸 단위 + 가이드 카드 컴포넌트), 수동 검증 (Android Chrome / iOS Safari / iOS Chrome / 카톡 인앱 / 인스타 인앱 5종 실기기 또는 DevTools UA 스푸핑), 배포 후 30일 GA4 모니터링

## 오픈 이슈

- [ ] 첫 노출 트리거 — **첫 출석 입력 완료 직후 1초**로 가설 확정. 데이터로 검증 후 조정
- [ ] 재노출 주기 — **dismiss 후 7일**로 가설 확정. dismiss 후 즉시 이탈률 측정해 조정
- [ ] iOS Chrome 가이드 카피 톤 (공식 안내 vs 가벼운 톤) — FD 단계 결정
- [ ] 시각 단서 이미지 vs 텍스트만 — FD 단계 결정 (`rules/design.md` 디자인 결정)
- [ ] 카카오톡 인앱 외부 브라우저 유도 시 이탈률 — 노출 후 GA4 측정으로 후속 판단
- [ ] manifest `theme_color` / `background_color` 값 — `rules/design.md` 토큰과 매칭 후 FD 결정

## 연결 문서

- 사업 문서: `docs/business/HISTORY.md` (05-08), `docs/business/STATUS.md`, `docs/business/6_roadmap/roadmap.md`, `docs/business/4_risk/risks.md`
- 기능 설계: `docs/specs/functional-design/pwa-mobile-guide.md` (다음 단계)
