---
paths:
    - 'apps/web/**'
---

# Design Rules

웹 앱 UI/UX 디자인 가이드입니다.

## 기술 스택

| 항목        | 기술                      |
| ----------- | ------------------------- |
| UI 컴포넌트 | shadcn/ui (Radix UI 기반) |
| 스타일링    | Tailwind CSS v4           |
| 아이콘      | lucide-react              |

## shadcn/ui 컴포넌트 사용 규칙

| 용도            | 컴포넌트                   | 비고                                          |
| --------------- | -------------------------- | --------------------------------------------- |
| 기본 버튼       | `Button`                   | variant: default, outline, ghost, destructive |
| 폼 입력         | `Input`, `Select`, `Label` | 항상 Label과 함께 사용                        |
| 모달/다이얼로그 | `Dialog`, `AlertDialog`    | 삭제 확인은 AlertDialog                       |
| 드롭다운        | `DropdownMenu`             | 액션 메뉴용                                   |
| 테이블          | `Table` (직접 구현)        | Tailwind로 스타일링                           |
| 카드            | `Card`                     | 대시보드, 상세 페이지                         |

## 레이아웃 컨벤션

```tsx
// 페이지 기본 구조
<main className="container mx-auto p-4 md:p-6">
    <header className="mb-6">
        <h1 className="text-2xl font-bold">페이지 제목</h1>
    </header>
    <section>{/* 콘텐츠 */}</section>
</main>
```

## 간격 (Spacing)

| 용도         | 클래스           | 값          |
| ------------ | ---------------- | ----------- |
| 섹션 간격    | `space-y-6`      | 24px        |
| 카드 내부    | `p-4` 또는 `p-6` | 16px / 24px |
| 폼 필드 간격 | `space-y-4`      | 16px        |
| 버튼 그룹    | `gap-2`          | 8px         |
| 인라인 요소  | `gap-1`          | 4px         |

## 색상 사용

| 용도             | Tailwind 클래스                      |
| ---------------- | ------------------------------------ |
| 주요 액션        | `bg-primary text-primary-foreground` |
| 보조 액션        | `variant="outline"`                  |
| 위험 액션 (삭제) | `variant="destructive"`              |
| 비활성 텍스트    | `text-muted-foreground`              |
| 성공 상태        | `text-green-600`                     |
| 경고 상태        | `text-yellow-600`                    |
| 에러 상태        | `text-red-600`                       |

### 전례력에 따른 primary 변동 (도메인 의도)

UI **primary 색은 가톨릭 전례력 시즌**(대림/사순/연중/부활/성탄·축일)에 따라 동적으로 변하도록 설계되어 있다. 사용자에게 전례 시즌을 인지시키는 핵심 도메인 가치다. **단, 이 가치는 인증 후 앱 화면(MainLayout 하위)에만 적용된다.**

- ✅ 신규 화면에서 primary 색은 항상 CSS 변수 **`var(--primary)`** 사용 — 전례 시즌별 자동 변동에 따라감
- ❌ **랜딩 등 비인증 브랜드 표면에 `useLiturgicalTheme`을 적용하지 않는다** — 브랜드는 인디고 계열로 고정 (2026-06-11 사용자 결정: 앞으로도 인디고로 통일, 랜딩을 바꾸는 한이 있더라도. 같은 날 `LandingPage.tsx`에서 훅 제거. 배경/근거: `docs/brainstorm/2026-06-11/brand-direction.md`)
- ❌ 하드코딩된 indigo `#4F46E5`(브랜드 로고 색)를 UI 컴포넌트에 직접 쓰지 않는다. 로고/브랜드 자산은 예외
- ❌ 디자인 시스템 토큰을 indigo로 통일하는 PR을 만들지 않는다
- ⚠️ `apps/web/src/styles/globals.css`의 `--primary`와 `docs/content/brand/logo.md`의 로고 indigo 사이 톤 차이는 **불일치가 아니라 의도된 분리**다. 리뷰 시 동기화를 요구하지 않는다
- 관련 코드: `apps/api/src/domains/liturgical/`, `packages/utils/src/liturgical.ts`, `apps/web/src/pages/dashboard/ContextBanner.tsx` 등 전례 시즌 결정 로직

## 반응형 브레이크포인트

| 브레이크포인트 | 너비     | 용도               |
| -------------- | -------- | ------------------ |
| 기본 (모바일)  | < 640px  | 단일 컬럼, 풀 너비 |
| `sm`           | ≥ 640px  | 작은 태블릿        |
| `md`           | ≥ 768px  | 태블릿, 2컬럼      |
| `lg`           | ≥ 1024px | 데스크톱           |

```tsx
// 반응형 그리드 예시
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

### GA4 실측 뷰포트 분포 (2026-03-17)

- **모바일 62%** (360~430px) / 데스크톱 8%
- **최소 지원 너비: 360px** — 이 너비에서 깨지지 않아야 한다

| 순위 | 해상도    | 비율  | 디바이스           |
| ---- | --------- | ----- | ------------------ |
| 1    | 402x874   | 16.3% | iPhone 14/15 Pro   |
| 2    | 393x852   | 14.8% | iPhone 14/15       |
| 3    | 390x844   | 9.6%  | iPhone 13/14       |
| 4    | 412x892   | 6.4%  | Android (Galaxy S) |
| 5    | 1920x1080 | 5.3%  | 데스크톱           |
| 6    | 360x780   | 4.4%  | Android 소형       |
| 7    | 384x832   | 4.0%  | Android            |
| 8    | 430x932   | 3.1%  | iPhone Pro Max     |
| 9    | 1536x864  | 2.8%  | 데스크톱/노트북    |
| 10   | 375x812   | 2.4%  | iPhone X/12 mini   |

모바일 참여 시간 31초~3분 48초 vs 데스크톱 6분~12분. 모바일이 6배 많지만 짧게 머문다.

### 모바일 테이블 규칙

- 폰트: `text-sm md:text-base` (테이블 내부)
- 셀 패딩: `px-2 py-2 md:px-5 md:py-4`
- 헤더 높이: `h-10 md:h-14`
- 부가 정보(뱃지 등): `hidden md:inline-flex`로 모바일에서 숨김
- 컬럼 축소: 핵심 2~3개만 모바일 표시, 나머지 `hidden md:table-cell`

## 아이콘 사용

```tsx
// lucide-react 사용
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react';

// 크기 컨벤션
<Plus className="h-4 w-4" />      // 버튼 내부
<Plus className="h-5 w-5" />      // 단독 사용
```

| 용도     | 아이콘                   |
| -------- | ------------------------ |
| 추가     | `Plus`                   |
| 수정     | `Pencil`                 |
| 삭제     | `Trash2`                 |
| 뒤로가기 | `ChevronLeft`            |
| 메뉴     | `MoreVertical`           |
| 검색     | `Search`                 |
| 로딩     | `Loader2` (animate-spin) |

## 상태별 UI 패턴

```tsx
// 로딩 상태
if (isLoading) {
  return (
    <div className="flex justify-center p-8">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

// 에러 상태
if (error) {
  return (
    <div className="text-center p-8 text-red-600">
      오류가 발생했습니다.
    </div>
  );
}

// 빈 상태
if (data.length === 0) {
  return (
    <div className="text-center p-8 text-muted-foreground">
      데이터가 없습니다.
    </div>
  );
}
```

> 폼 패턴, 접근성, 포커스 규칙, 컴포넌트 작성 원칙, 타이포그래피 → `rules/design-patterns.md` 참조
