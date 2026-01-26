---
paths:
  - "apps/web/**"
---

# Design Rules

웹 앱 UI/UX 디자인 가이드입니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| UI 컴포넌트 | shadcn/ui (Radix UI 기반) |
| 스타일링 | Tailwind CSS v4 |
| 아이콘 | lucide-react |

## shadcn/ui 컴포넌트 사용 규칙

| 용도 | 컴포넌트 | 비고 |
|------|----------|------|
| 기본 버튼 | `Button` | variant: default, outline, ghost, destructive |
| 폼 입력 | `Input`, `Select`, `Label` | 항상 Label과 함께 사용 |
| 모달/다이얼로그 | `Dialog`, `AlertDialog` | 삭제 확인은 AlertDialog |
| 드롭다운 | `DropdownMenu` | 액션 메뉴용 |
| 테이블 | `Table` (직접 구현) | Tailwind로 스타일링 |
| 카드 | `Card` | 대시보드, 상세 페이지 |

## 레이아웃 컨벤션

```tsx
// 페이지 기본 구조
<main className="container mx-auto p-4 md:p-6">
  <header className="mb-6">
    <h1 className="text-2xl font-bold">페이지 제목</h1>
  </header>
  <section>
    {/* 콘텐츠 */}
  </section>
</main>
```

## 간격 (Spacing)

| 용도 | 클래스 | 값 |
|------|--------|-----|
| 섹션 간격 | `space-y-6` | 24px |
| 카드 내부 | `p-4` 또는 `p-6` | 16px / 24px |
| 폼 필드 간격 | `space-y-4` | 16px |
| 버튼 그룹 | `gap-2` | 8px |
| 인라인 요소 | `gap-1` | 4px |

## 색상 사용

| 용도 | Tailwind 클래스 |
|------|-----------------|
| 주요 액션 | `bg-primary text-primary-foreground` |
| 보조 액션 | `variant="outline"` |
| 위험 액션 (삭제) | `variant="destructive"` |
| 비활성 텍스트 | `text-muted-foreground` |
| 성공 상태 | `text-green-600` |
| 경고 상태 | `text-yellow-600` |
| 에러 상태 | `text-red-600` |

## 반응형 브레이크포인트

| 브레이크포인트 | 너비 | 용도 |
|---------------|------|------|
| 기본 (모바일) | < 640px | 단일 컬럼, 풀 너비 |
| `sm` | ≥ 640px | 작은 태블릿 |
| `md` | ≥ 768px | 태블릿, 2컬럼 |
| `lg` | ≥ 1024px | 데스크톱 |

```tsx
// 반응형 그리드 예시
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## 아이콘 사용

```tsx
// lucide-react 사용
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react';

// 크기 컨벤션
<Plus className="h-4 w-4" />      // 버튼 내부
<Plus className="h-5 w-5" />      // 단독 사용
```

| 용도 | 아이콘 |
|------|--------|
| 추가 | `Plus` |
| 수정 | `Pencil` |
| 삭제 | `Trash2` |
| 뒤로가기 | `ChevronLeft` |
| 메뉴 | `MoreVertical` |
| 검색 | `Search` |
| 로딩 | `Loader2` (animate-spin) |

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

## 폼 패턴

```tsx
// 기본 폼 필드
<div className="space-y-2">
  <Label htmlFor="name">이름</Label>
  <Input id="name" placeholder="이름을 입력하세요" />
</div>

// 버튼 그룹 (폼 하단)
<div className="flex justify-end gap-2">
  <Button variant="outline" onClick={onCancel}>취소</Button>
  <Button type="submit">저장</Button>
</div>
```

## 접근성 (a11y) 체크리스트

- [ ] 모든 `Input`에 `Label` 연결 (`htmlFor` + `id`)
- [ ] 버튼에 명확한 텍스트 또는 `aria-label`
- [ ] 이미지에 `alt` 속성
- [ ] 색상만으로 정보 전달하지 않음 (아이콘/텍스트 병행)
- [ ] 키보드 네비게이션 가능 (Tab, Enter, Escape)
- [ ] 포커스 표시 유지 (`focus-visible:ring`)
- [ ] 모달 열림 시 포커스 트랩

## 컴포넌트 작성 원칙

1. **단일 책임**: 하나의 컴포넌트는 하나의 역할만
2. **Props 최소화**: 필요한 props만 받기
3. **합성 우선**: 상속보다 합성 (children, slots)
4. **스타일 일관성**: Tailwind 클래스 순서 통일 (레이아웃 → 간격 → 색상 → 기타)

```tsx
// 클래스 순서 예시
className="flex items-center gap-2 p-4 bg-white text-gray-900 rounded-lg shadow"
//         [레이아웃]      [간격] [색상]              [기타]
```