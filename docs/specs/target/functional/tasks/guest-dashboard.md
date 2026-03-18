# Task: 게스트 대시보드

> 비인증 시 `/`에 대시보드 레이아웃을 노출하고, 데이터 영역에 로그인 유도 안내를 표시합니다.

## 상위 문서

- PRD: `docs/specs/prd/guest-dashboard.md`
- 기능 설계: `docs/specs/functional-design/guest-dashboard.md`

## 목표

비인증 유저가 `/` 접속 시 대시보드 레이아웃을 보고, 데이터 영역에 "로그인이 필요합니다"를 확인할 수 있다.

## 범위

### 포함
- [x] `/` 라우트 인증 가드 조건부 해제
- [x] MainLayout 게스트 모드 (헤더 로그인/회원가입 버튼)
- [x] DashboardPage 게스트 분기 (데이터 영역 → LoginRequiredCard)
- [x] LoginRequiredCard 신규 컴포넌트
- [x] `liturgical.season` 엔드포인트 공개 전환
- [x] 사이드바 게스트 클릭 → `/login` 이동

### 제외
- [ ] 공개 통계 API 신규 개발
- [ ] `/landing` 페이지 변경
- [ ] 샘플/더미 데이터 표시

---

## 역할별 업무 분할

### 백엔드 개발자

> 검수 기준: `.claude/rules/api.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | liturgical.season 공개 전환 | `consentedProcedure` → `publicProcedure` 변경 | 없음 |

**Development**: `docs/specs/target/functional/development/guest-dashboard-backend.md`

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | 라우트 가드 해제 | `/` 라우트에서 `ProtectedRoute` 제거, DashboardPage 내부에서 인증 분기 | 없음 |
| F2 | MainLayout 게스트 모드 | 비인증 시 계정 정보 숨김 + 로그아웃 자리에 "로그인/회원가입" 버튼 | 없음 |
| F3 | LoginRequiredCard 컴포넌트 | "로그인이 필요합니다" 텍스트 카드 (CTA 버튼 없음) | 없음 |
| F4 | DashboardPage 게스트 분기 | 비인증 시: 필터 disabled, 데이터 영역 LoginRequiredCard, 축일 숨김, 전례 시기 표시 | F1, F2, F3, B1 |
| F5 | 사이드바 게스트 네비게이션 | 비인증 시 네비 클릭 → `/login`으로 이동 | F2 |

**Development**: `docs/specs/target/functional/development/guest-dashboard-frontend.md`

---

## 업무 의존성 다이어그램

```
[B1] ──────────────────────┐
                           ▼
[F1] ──┐                [F4] (게스트 대시보드 조합)
[F2] ──┤──▶ [F5]          ▲
[F3] ──┘───────────────────┘
```

---

## 검증 체크리스트

### 기능 검증
- [ ] 비인증 유저가 `/` 접속 시 대시보드 레이아웃 렌더링
- [ ] 데이터 영역에 "로그인이 필요합니다" 표시
- [ ] 헤더에 "로그인/회원가입" 버튼 표시, 클릭 시 `/login` 이동
- [ ] 사이드바 클릭 시 `/login` 이동
- [ ] 전례 시기 카드 정상 표시, 축일 카드 숨김
- [ ] 인증된 유저는 기존 대시보드 동작 유지

### 요구사항 추적
- [ ] PRD Must 5건 → B1, F1~F5에 모두 반영
- [ ] 기능 설계의 API 변경 → B1
- [ ] 기능 설계의 UI/UX → F2, F3, F4, F5

---

**작성일**: 2026-03-18
**상태**: Approved
