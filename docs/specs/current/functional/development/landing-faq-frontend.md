# Development: 랜딩 페이지 FAQ (Frontend)

> Task에서 분할된 **업무를 수행하기 위한 세부 구현 내용**입니다.

## 상위 문서

- PRD: `docs/specs/prd/landing-faq.md`
- 기능 설계: `docs/specs/functional-design/landing-page.md` (FAQ 섹션)
- Task: `docs/specs/target/functional/tasks/landing-faq.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| F1 | Accordion 컴포넌트 추가 | O |
| F2 | FAQ 섹션 구현 | O |
| F3 | GA4 이벤트 추가 | O |

## 구현 개요

LandingPage.tsx의 CTA 섹션(⑤)과 Footer 사이에 FAQ 아코디언 섹션(⑥)을 추가한다. shadcn/ui Accordion 컴포넌트를 설치하고, 정적 FAQ 데이터 배열을 렌더링한다.

---

## F1: Accordion 컴포넌트 추가

shadcn/ui CLI로 Accordion 컴포넌트를 설치한다.

```bash
npx shadcn@latest add accordion
```

생성 파일: `apps/web/src/components/ui/accordion.tsx`

## F2: FAQ 섹션 구현

### 데이터 구조

LandingPage.tsx 상단에 FAQ 정적 데이터 배열을 정의한다.

```
FAQ_ITEMS: Array<{ question: string, answer: string }>
```

6개 항목:
1. "정말 무료인가요?"
2. "개인정보는 안전한가요?"
3. "선생님이 여러 명인데, 각각 가입해야 하나요?"
4. "스마트폰에서도 쓸 수 있나요?"
5. "가톨릭 주일학교만 쓸 수 있나요?"
6. "기존에 쓰던 출석 데이터를 옮길 수 있나요?"

### 컴포넌트 구조

```
LandingPage.tsx
├── ① ~ ⑤ (기존 유지)
├── ⑥ FAQ 섹션
│   └── FadeInSection (기존 컴포넌트 재사용)
│       └── section (py-20, px-6)
│           ├── h2 "자주 묻는 질문"
│           └── Accordion (type="single", collapsible, max-w-2xl mx-auto)
│               └── AccordionItem × 6
│                   ├── AccordionTrigger (질문)
│                   └── AccordionContent (답변)
└── Footer (기존 유지)
```

### 사용 컴포넌트

| 컴포넌트 | shadcn/ui | 용도 |
|----------|-----------|------|
| Accordion | Accordion | FAQ 아코디언 컨테이너 (`type="single"` `collapsible`) |
| AccordionItem | AccordionItem | 개별 FAQ 항목 |
| AccordionTrigger | AccordionTrigger | 질문 (클릭 시 열기/닫기) |
| AccordionContent | AccordionContent | 답변 |
| FadeInSection | 자체 구현 (기존) | 스크롤 진입 시 페이드인 애니메이션 |

### 레이아웃

| 뷰포트 | 레이아웃 | 비고 |
|--------|----------|------|
| 모바일 (< 768px) | 단일 컬럼, `px-6` | 풀 너비 |
| 데스크톱 (≥ 768px) | `max-w-2xl mx-auto` | 중앙 정렬 |

### 스타일링

- 섹션: `py-20 px-6` (min-h-screen 미적용 — 콘텐츠 높이만큼)
- 제목: `text-3xl font-bold text-center mb-8`
- 아코디언 컨테이너: `max-w-2xl mx-auto`
- 답변 텍스트: `text-muted-foreground`

## F3: GA4 이벤트 추가

### analytics.ts에 추가할 메서드

1. `trackLandingFaqClick(question: string)` — `landing_faq_click` 이벤트 (question 파라미터)

### 섹션 뷰 이벤트

기존 `trackLandingSectionView('faq')` 재사용 (FadeInSection의 onVisible 콜백).

### Accordion onValueChange

Accordion의 `onValueChange` 콜백에서 값이 열릴 때 `trackLandingFaqClick` 호출.

---

## 구현 대상 파일

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `apps/web/src/components/ui/accordion.tsx` | 신규 (CLI) | shadcn/ui Accordion |
| `apps/web/src/pages/LandingPage.tsx` | 수정 | FAQ 데이터 + 섹션 렌더링 |
| `apps/web/src/lib/analytics.ts` | 수정 | `trackLandingFaqClick` 메서드 추가 |

## 접근성 체크리스트

- [ ] AccordionTrigger에 키보드 네비게이션 (Enter/Space로 열기/닫기) — shadcn/ui 기본 제공
- [ ] 포커스 표시 유지 (`focus-visible:ring`) — shadcn/ui 기본 제공
- [ ] `aria-expanded` 상태 자동 관리 — Radix UI 기본 제공

## 테스트 시나리오

### 정상 케이스

| 시나리오 | 기대 결과 |
|---------|----------|
| `/landing` 스크롤 → CTA 아래 | FAQ 섹션 "자주 묻는 질문" 제목 + 6개 항목 표시 |
| FAQ 항목 클릭 | 해당 답변 펼침, 나머지 닫힘 |
| 열린 항목 다시 클릭 | 답변 닫힘 (collapsible) |
| 모바일 뷰포트 | 아코디언 풀 너비 정상 표시 |

### GA4 이벤트 검증

| 시나리오 | 이벤트 | 파라미터 |
|---------|--------|----------|
| FAQ 섹션 뷰포트 진입 | `landing_section_view` | section: `faq` |
| FAQ 항목 열기 | `landing_faq_click` | question: 질문 텍스트 |

---

**작성일**: 2026-02-18
**리뷰 상태**: Approved