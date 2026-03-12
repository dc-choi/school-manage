---
paths:
  - "apps/web/**"
---

# Design Patterns

폼, 접근성, 포커스, 컴포넌트 작성 원칙입니다.

> 기본 UI 규칙은 `rules/design.md` 참조

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

### 폼 규칙

- `autocomplete` 속성 지정, 올바른 `type`/`inputmode` 사용 (예: 이메일 → `type="email"`, 전화번호 → `inputmode="tel"`)
- paste 차단 금지 — 사용자 편의와 접근성 저해
- 아이디/이메일/코드 입력에 `spellCheck={false}` 지정
- submit 버튼: 요청 시작까지 활성화, 요청 중 스피너 표시 (`disabled` + `Loader2`)
- 에러 인라인 표시 + 첫 에러 필드에 자동 포커스
- placeholder 예시 패턴: `"이름을 입력하세요…"` (`…` 사용)

## 접근성 (a11y) 체크리스트

- [ ] 모든 `Input`에 `Label` 연결 (`htmlFor` + `id`)
- [ ] 버튼에 명확한 텍스트 또는 `aria-label`
- [ ] icon-only 버튼에 `aria-label` 필수
- [ ] 이미지에 `alt` 속성
- [ ] 장식 아이콘에 `aria-hidden="true"`
- [ ] 색상만으로 정보 전달하지 않음 (아이콘/텍스트 병행)
- [ ] 키보드 네비게이션 가능 (Tab, Enter, Escape)
- [ ] 포커스 표시 유지 (`focus-visible:ring`)
- [ ] 모달 열림 시 포커스 트랩
- [ ] `<div onClick>` 금지 → `<button>` (액션) / `<a>` (네비게이션) 사용
- [ ] 비동기 업데이트 시 `aria-live="polite"` 사용
- [ ] 시맨틱 HTML 우선 — ARIA는 네이티브 시맨틱이 없을 때만

## 포커스 규칙

- `outline-none` 단독 사용 금지 → 반드시 `focus-visible:ring-*` 대체 스타일 제공
- `:focus` 대신 `:focus-visible` 사용 (마우스 클릭 시 불필요한 포커스 링 방지)
- 복합 컨트롤(검색 바, 커스텀 셀렉트 등)에 `:focus-within` 활용

## 컴포넌트 작성 원칙

1. **단일 책임**: 하나의 컴포넌트는 하나의 역할만
2. **Props 최소화**: 필요한 props만 받기
3. **합성 우선**: 상속보다 합성 (children, slots)
4. **Boolean prop 보다 합성 패턴**: 플래그로 분기하지 말고 Compound Component 또는 children 합성 사용
5. **render props보다 children 합성 우선**: render props는 children으로 해결 안 될 때만
6. **React 19**: `forwardRef` 대신 ref를 일반 prop으로 전달
7. **React 19**: `useContext()` 대신 `use()` 사용
8. **스타일 일관성**: Tailwind 클래스 순서 통일 (레이아웃 → 간격 → 색상 → 기타)

```tsx
// 클래스 순서 예시
className="flex items-center gap-2 p-4 bg-white text-gray-900 rounded-lg shadow"
//         [레이아웃]      [간격] [색상]              [기타]
```

## 타이포그래피

- 숫자 컬럼(출석 통계 등)에 `font-variant-numeric: tabular-nums` → Tailwind: `tabular-nums`
- 제목에 `text-wrap: balance` → Tailwind: `text-balance`
