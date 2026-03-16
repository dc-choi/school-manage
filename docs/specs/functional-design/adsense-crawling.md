# 기능 설계: AdSense 크롤링 지원

> PRD를 기반으로 구체적인 기능 흐름과 인터페이스를 정의합니다.

## 연결 문서

- PRD: `docs/specs/prd/adsense-crawling.md`

## 흐름/상태

### 크롤러 플로우

1. 크롤러가 `robots.txt`를 요청 → 허용/차단 경로 확인, sitemap 위치 획득
2. 크롤러가 `sitemap.xml`을 요청 → 공개 페이지 URL 목록 획득
3. 크롤러가 `/landing` 등 공개 페이지를 직접 방문 → 콘텐츠 크롤링

### 링크 발견 플로우 (대안 경로)

1. 크롤러가 `/`에 접근 → SPA 렌더링 → `/login`으로 리다이렉트
2. 로그인 페이지에서 `/landing` 링크 발견 → 랜딩 페이지로 이동
3. 랜딩 페이지의 풍부한 콘텐츠 크롤링 (Hero, Features, Demo, FAQ)

## UI/UX

### 로그인 페이지 변경

로그인 폼 하단에 "서비스 소개" 링크를 추가한다.

기존 요소 순서:
1. 로그인 폼 (아이디, 비밀번호)
2. 로그인 버튼
3. "비밀번호를 잊으셨나요?" 링크
4. "아직 계정이 없으신가요?" 버튼

변경 후:
1. 로그인 폼 (아이디, 비밀번호)
2. 로그인 버튼
3. "비밀번호를 잊으셨나요?" 링크
4. "아직 계정이 없으신가요?" 버튼
5. **"서비스가 처음이신가요? 소개 보기" 링크 (추가)** → `/landing`으로 이동

스타일: 기존 "비밀번호를 잊으셨나요?"와 동일한 `text-sm text-muted-foreground` 스타일. 중앙 정렬.

## 정적 파일

### robots.txt

위치: `apps/web/public/robots.txt`

```
User-agent: *
Allow: /landing
Allow: /login
Allow: /signup
Disallow: /api/
Disallow: /join
Disallow: /pending
Disallow: /consent
Disallow: /reset-password
Disallow: /groups
Disallow: /students
Disallow: /attendance
Disallow: /settings

Sitemap: {PRODUCTION_URL}/sitemap.xml
```

차단 기준: 인증 필요 경로 + 민감 경로(비밀번호 재설정, 개인정보 동의)

### sitemap.xml

위치: `apps/web/public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>{PRODUCTION_URL}/landing</loc>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>{PRODUCTION_URL}/login</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>{PRODUCTION_URL}/signup</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>
```

포함 기준: 크롤러에게 가치 있는 공개 페이지만 (랜딩 > 로그인/회원가입)

## 권한/보안

- **접근 제어**: `robots.txt`, `sitemap.xml`은 정적 파일로 인증 없이 접근 가능
- **감사/로그**: 불필요

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 프로덕션 URL 미확정 | sitemap.xml에 상대 경로 사용 불가 — URL 확정 후 업데이트 |
| 크롤러가 JS 미실행 | `index.html`의 메타 태그(description, og:*)로 최소 정보 제공 (이미 존재) |

## 성능/제약

- 예상 트래픽: 크롤러 요청 수준 (무시 가능)
- 제약 사항: SPA이므로 `robots.txt`의 `Disallow`는 크롤러에게 힌트일 뿐 강제 차단은 아님

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: `robots.txt`가 `/landing`을 Allow하고 `/groups` 등을 Disallow
2. **TC-2**: `sitemap.xml`이 유효한 XML이고 공개 페이지 URL 포함
3. **TC-3**: 로그인 페이지에서 "/landing" 링크가 렌더링되고 클릭 시 랜딩 페이지로 이동

### 예외 케이스

1. **TC-E1**: 이미 인증된 사용자가 로그인 페이지 접근 시 대시보드로 리다이렉트 (기존 동작 유지)

---

**작성일**: 2026-03-16
**작성자**: SDD 작성자
**상태**: Draft
