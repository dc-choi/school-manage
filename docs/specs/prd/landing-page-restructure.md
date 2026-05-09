# PRD: 랜딩페이지 11요소 표준 구조 개편

> 상태: Draft | 작성일: 2026-05-09

## 배경/문제 요약

- 참고: `docs/business/3_gtm/gtm.md`(채널/포지셔닝), `docs/business/STATUS.md`(MAO 44/50, 마케팅 카피), `docs/business/0_feedback/feedback.md`(사용자 인터뷰 9건), `docs/specs/functional-design/landing-page.md`
- 문제:
    - **신규 방문자가 "어디 이동해야 무엇을 볼 수 있는지" 즉시 파악할 단서가 약함** — 스크롤 진입 후 파악되는 구조로 첫 화면에서의 액션 동선이 부재 (Nav 없음, Hero CTA 버튼 없음)
    - **신뢰 신호가 통계 한 줄에 몰림** — 실제 사용자의 목소리(Review)가 없어 도입 결정자가 "정말 쓰는 곳이 있는지" 확인할 길이 없음
    - **Pain Points 섹션은 공감 유발은 하지만 "왜 우리 도구를 선택해야 하는가(Why Choose Us)"의 차별화 답을 주지 못함** — 가톨릭 특화 가치 전달 약화
    - **Footer가 저작권 한 줄** — 인스타, 문의, 약관, 개인정보 등 GTM 후속 액션 경로 부재
- 현재 상태: `LandingPage.tsx` 312줄 / 8섹션(Hero → Pain Points → Features → Target Groups → Demo → CTA → FAQ → Footer)
- 목표 상태: 표준 앱 랜딩 11요소(Nav/Hero+CTA/Hero 미리보기/사회적 신뢰/Features/Why Choose Us/Demo/Review/FAQ/마무리 CTA/Footer)에 정렬된 구조

## 목표/성공 기준

- **목표**: 랜딩 → 가입 전환 흐름 단축 + 신뢰 신호 보강
- **성공 지표** (`landing-page.md` 기존 GA4 이벤트 활용 + 신규):
    - `landing_cta_click`(top/bottom) 비율 — 신규 nav top CTA 클릭 발생 측정
    - `landing_section_view` — 신설 `why-choose-us` / `reviews` 도달률 ≥ 60%(섹션 도달자 / 페이지 진입자)
    - 가입 전환율(seven-day): 개편 전 4주 기준 대비 동등 이상 유지(저하 시 롤백)
- **측정 기간**: 배포 후 4주

## 사용자/대상

- **주요 사용자**: 인스타/사제 추천/지인 공유로 처음 도달한 가톨릭 모임 운영자(교리교사 60% / 운영 책임자 30% / 청년/레지오 등 10%, 모바일 62%)
- **사용 맥락**: 5~30초 안에 "이게 뭐고 / 우리 모임에 맞고 / 믿을 만한가"를 판단해야 함. 카톡/SNS에서 짧은 호흡으로 진입

## 범위

### 포함

- **고정 헤더(Nav)**: 로고 + 앵커(기능/후기/FAQ) + 우상단 `시작하기` CTA
- **Hero**: 기존 헤드라인 유지 + 즉시 클릭 가능한 `시작하기` 단일 CTA + 보조 `데모 체험`(앵커 스크롤). 데스크톱은 우측 미리보기 시각요소
- **사회적 신뢰 섹션**: countData(본당/선생님/학생) + 가톨릭 모임 유형 5종(주일학교/청년/레지오/군종/성가대) — 현 Target Groups 재배치
- **Features 섹션 유지**(4개 카드)
- **Why Choose Us 섹션 신설**: 기존 Pain Points 4개 차별화 가치로 재구성(주간 도구/축일 통합/엑셀 대체/모바일 즉시)
- **Interactive Demo 섹션 유지** (체험)
- **Review 섹션 신설**: `docs/business/0_feedback/entries/` 중 긍정 인용 가능 항목 큐레이션. 익명/이니셜 + 모임 유형 + 한 줄 인용
- **FAQ 섹션 유지**
- **마무리 CTA 섹션 유지** + 시각 요소 보강
- **Footer 보강**: 인스타(`@weekly-school`) + 문의(이메일) + 이용약관 + 개인정보처리방침
- 모바일 360px ~ 데스크톱 풀와이드까지 동작
- 새 GA4 이벤트: `landing_section_view` 신규 섹션 키(`nav`, `social-proof`, `why-choose-us`, `reviews`, `footer`)
- a11y: Nav `aria-label`, 앵커 `aria-controls`, 후기 카드는 `<blockquote>` + `cite`

### 제외

- 다국어/다크모드 토글
- 파트너 본당 로고 노출(공개 동의 미확보 — 모임 유형 카드로 대체)
- 동영상/Lottie 애니메이션
- A/B 테스트 인프라
- 백엔드 API 신규 추가 — 기존 `account.count` 그대로 사용
- 가격/플랜 섹션(베이직 플랜은 3단계 의존, 본 PRD 범위 외)

## 사용자 시나리오

1. **인스타 광고 → 모바일 진입**: 헤더의 `시작하기` 즉시 인지 → Hero 헤드라인 → 사회적 신뢰(본당/선생님 수) 확인 → Features 스캔 → Why Choose Us → Review 1~2개 읽음 → 하단 CTA 클릭
2. **사제/교사 추천 → 데스크톱 진입**: 좌우 2단 Hero에서 우측 미리보기로 "어떤 화면인지" 즉각 파악 → 신뢰 섹션 → Demo 체험 → Review → CTA
3. **재방문(이미 가입자)**: 인증 상태 감지 → `/` 자동 리다이렉트(현행 동작 유지)
4. **앵커 네비**: Nav `기능` 클릭 → Features 섹션으로 부드럽게 스크롤(prefers-reduced-motion 존중)

## 요구사항

### 필수 (Must)

- [ ] 고정 헤더 추가(스크롤 시 sticky, 모바일은 햄버거 또는 압축 형태)
- [ ] Hero 영역 1차 CTA `시작하기` 버튼 추가(top + bottom 모두 `landing_cta_click` 이벤트)
- [ ] 모바일 360px에서 깨지지 않음(`rules/design.md` 모바일 분포 기준)
- [ ] Pain Points 섹션 → Why Choose Us 4개 차별화 카드로 변경
- [ ] Review 섹션 신설(피드백 entries 출처 명시 + 사용자 동의 확인된 인용만)
- [ ] Footer 정보 보강(인스타/문의/약관/개인정보 링크)
- [ ] 기존 GA4 이벤트 호환 + 신규 섹션 키 추가
- [ ] FAQ JSON-LD 유지(SEO)
- [ ] 인증 상태 시 `/` 리다이렉트 동작 유지
- [ ] "무료" 표현 사용 금지(CLAUDE.md 정책)

### 선택 (Should)

- [ ] Hero 우측 미리보기 시각요소(데스크톱 한정 — 정적 이미지/SVG, 모바일에서는 숨김 또는 하단으로 이동)
- [ ] Nav 앵커 클릭 시 active 상태 표시(IntersectionObserver)
- [ ] Review 섹션 카드 가로 스크롤(모바일) / 그리드(데스크톱)

### 제외 (Out)

- 동영상/Lottie/3D
- 가격 표
- 본당 실명 공개

## 제약/가정/리스크/의존성

- **제약**: 단일 페이지 컴포넌트(`LandingPage.tsx`) 800줄 상한(`coding-style.md`). 초과 예상 시 섹션별 컴포넌트 분리
- **가정**: Review용 후기 인용은 사용자(개발자)가 동의 확보한 항목만 사용. 미확보 시 모임 유형 사용 사례 카드로 대체
- **리스크**:
    - 신규 섹션 추가로 LCP 저하 가능 → 이미지 lazy-load + Hero는 즉시 표시 유지
    - Nav 추가로 모바일 영역 침범 → 헤더 높이 ≤ 56px
    - Review가 어색하게 비치면 신뢰 역효과 → 최소 2건 이상 진정성 있는 인용 확보 후 출시(없으면 출시 보류)
- **내부 의존성**: `account.count` tRPC procedure(현 사용 유지), `analytics.ts`(이벤트 추가)
- **외부 의존성**: 인스타 계정(`@weekly-school`), 이메일 문의 주소

## 롤아웃/검증

- **출시 단계**: 단일 PR 머지 → 즉시 배포(점진적 롤아웃 인프라 없음). 회귀 시 직전 커밋으로 revert
- **이벤트**: `landing_view`, `landing_section_view`(섹션 키 확장), `landing_cta_click`(top/bottom), `landing_login_click`, `landing_faq_click` | **검증**: GA4 실시간 보고서에서 4개 신규 섹션 키 도달 확인 + CTA top/bottom 분리 카운트 확인
- 4주 후 가입 전환율/섹션 도달률 리뷰 → 다음 개선 포인트 도출

## 오픈 이슈

- [ ] Review 인용 후보 큐레이션: 9건 entries 중 (a) 긍정 톤, (b) 운영자/실제 사용자 발화, (c) 인용 동의 확보 가능 — 어느 항목을 사용할지 FD 단계에서 사용자 확정
- [ ] Hero 우측 미리보기: 정적 스크린샷 vs 일러스트 — FD 단계에서 결정
- [ ] Footer 문의 이메일 주소 확정

## 연결 문서

- 사업 문서: `docs/business/3_gtm/gtm.md`, `docs/business/STATUS.md`, `docs/business/0_feedback/feedback.md`, `docs/business/6_roadmap/roadmap.md`
- 기능 설계: `docs/specs/functional-design/landing-page-restructure.md`(신규 작성 예정)
- 도메인 메인 FD: `docs/specs/functional-design/landing-page.md`(6단계에서 병합 + 축약)
