# PRD: AdSense 크롤링 지원

> SDD 작성자가 작성하는 제품 요구사항 문서입니다.
> 사업 에이전트의 `docs/business/` 문서를 기반으로 작성합니다.

## 배경/문제 요약

- 참고: `docs/business/6_roadmap/roadmap.md` 2단계 "광고 수익: 행동 패턴 분석 후 결정"
- 문제: AdSense 승인 심사 시 크롤러가 `/`를 방문하면 `/login`으로 리다이렉트됨. 로그인 페이지는 폼만 있어 콘텐츠 부족으로 판정됨. 풍부한 콘텐츠가 있는 `/landing` 페이지를 크롤러가 발견하지 못함
- 현재 상태: `robots.txt`, `sitemap.xml` 없음. 로그인 페이지에서 랜딩 페이지로의 링크 없음
- 목표 상태: 크롤러가 공개 페이지(랜딩, 회원가입 등)를 발견·인덱싱할 수 있는 상태

## 목표/성공 기준

- **목표**: AdSense 승인 심사 통과를 위해 크롤러가 공개 콘텐츠에 접근 가능하게 만든다
- **성공 지표**: AdSense 승인 완료
- **측정 기간**: 적용 후 2주 내

## 사용자/대상

- **주요 사용자**: Google AdSense 크롤러 (Googlebot, Mediapartners-Google)
- **사용 맥락**: 사이트 승인 심사 및 광고 배치 결정 시 크롤링

## 범위

### 포함

- 로그인 페이지(`/login`)에 랜딩 페이지(`/landing`) 링크 추가
- `sitemap.xml` 생성 (공개 페이지 목록)
- `robots.txt` 생성 (크롤링 허용/차단 경로)

### 제외

- URL 구조 변경 (기존 라우팅 유지)
- 인증 필요 페이지의 공개 전환
- AdSense 광고 코드 삽입 (승인 후 별도 작업)
- SSR/Pre-rendering 도입

## 사용자 시나리오

1. **크롤러 시나리오**: Googlebot이 `/`에 접근 → `/login` 리다이렉트 → 로그인 페이지에서 `/landing` 링크 발견 → 랜딩 페이지 크롤링 (Hero, Features, Demo, FAQ 등 풍부한 콘텐츠 확인)
2. **크롤러 시나리오 (sitemap)**: Googlebot이 `sitemap.xml`을 읽고 `/landing`, `/signup` 등 공개 페이지를 직접 방문
3. **기존 사용자 시나리오**: 기존 사용자는 `/login`에서 로그인. 랜딩 링크가 추가되지만 기존 플로우에 영향 없음

## 요구사항

### 필수 (Must)

- [ ] 로그인 페이지에 랜딩 페이지 링크 추가 (크롤러가 발견 가능한 `<a>` 태그)
- [ ] `sitemap.xml` 생성 — 공개 페이지(`/landing`, `/login`, `/signup`) 포함
- [ ] `robots.txt` 생성 — 인증 필요 경로 차단, 공개 경로 허용, sitemap 위치 명시

### 선택 (Should)

- [ ] `robots.txt`에서 API 경로(`/api/`) 차단

### 제외 (Out)

- 광고 코드 삽입
- SEO 메타 태그 추가 (이미 `index.html`에 존재)
- URL 구조 변경

## 제약/가정/리스크

- **제약**: SPA 구조 — 모든 경로가 동일한 `index.html`을 서빙하므로 `robots.txt`와 `sitemap.xml`은 `public/` 디렉토리에 정적 파일로 배치
- **가정**: Googlebot은 JavaScript를 실행하므로 SPA 라우팅을 따라갈 수 있음
- **리스크**: AdSense 승인은 콘텐츠 양/질 외 다른 요소도 평가하므로, 이 작업만으로 승인이 보장되지 않음

## 의존성

- **내부**: 없음 (기존 코드 소규모 수정)
- **외부**: 프로덕션 도메인 URL (sitemap.xml에 필요, 환경변수로 처리)

## 롤아웃/검증

- **출시 단계**: 즉시 배포
- **이벤트/로그**: 불필요
- **검증 방법**: Google Search Console에서 sitemap 제출 → 인덱싱 확인 → AdSense 재심사

## 오픈 이슈

- [ ] 프로덕션 도메인 URL 확인 필요 (sitemap.xml 내 절대 URL)

## 연결 문서

- 사업 문서: `docs/business/6_roadmap/roadmap.md` (2단계 광고 수익)
- 기능 설계: `docs/specs/functional-design/adsense-crawling.md` (작성 예정)

---

**작성일**: 2026-03-16
**작성자**: SDD 작성자
**상태**: Draft
