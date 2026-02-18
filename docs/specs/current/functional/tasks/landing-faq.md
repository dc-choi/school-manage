# Task: 랜딩 페이지 FAQ

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.
> 기능 설계의 요구사항을 **역할별 구현 가능한 단위로 분할**합니다.

## 상위 문서

- PRD: `docs/specs/prd/landing-faq.md`
- 기능 설계: `docs/specs/functional-design/landing-page.md` (FAQ 섹션)

## 목표

`/landing` 페이지 CTA 아래에 FAQ 아코디언 섹션을 추가하여 가입 전 반복 문의를 줄이고 전환율을 개선한다.

## 범위

### 포함
- [x] shadcn/ui Accordion 컴포넌트 추가
- [x] LandingPage에 FAQ 섹션 구현
- [x] FAQ 정적 콘텐츠 6개 항목
- [x] GA4 이벤트 추적

### 제외
- [ ] 백엔드 변경
- [ ] FAQ CMS / 동적 콘텐츠
- [ ] FAQ 전용 페이지

---

## 역할별 업무 분할

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | Accordion 컴포넌트 추가 | `npx shadcn@latest add accordion`으로 shadcn/ui Accordion 설치 | 없음 |
| F2 | FAQ 섹션 구현 | LandingPage에 ⑥ FAQ 섹션 추가 (CTA 아래, Footer 위). 정적 데이터 배열 + Accordion `type="single" collapsible`. FadeInSection 적용 | F1 완료 후 |
| F3 | GA4 이벤트 추가 | `landing_section_view` (section: faq) + `landing_faq_click` (question 파라미터) 이벤트 추적 | F2 완료 후 |

**Development**: `docs/specs/target/functional/development/landing-faq-frontend.md`

---

## 업무 의존성 다이어그램

```
[F1] ──▶ [F2] ──▶ [F3]
```

---

## 검증 체크리스트

### 기능 검증
- [ ] FAQ 아코디언이 CTA 아래에 정상 표시되는가?
- [ ] 단일 열기 동작 (하나 열면 나머지 닫힘)이 정상인가?
- [ ] 모바일/데스크톱 반응형이 정상인가?
- [ ] 기존 5단 섹션에 영향이 없는가?

### 요구사항 추적
- [ ] PRD의 Must Have 요구사항이 모두 업무에 반영되었는가?
- [ ] 기능 설계의 UI/UX가 프론트엔드 업무에 포함되었는가?
- [ ] 기능 설계의 측정/모니터링이 F3에 반영되었는가?

---

**작성일**: 2026-02-18
**상태**: Approved