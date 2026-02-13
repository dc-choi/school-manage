# Task: 랜딩 페이지 도입

> **"누가 무엇을 하는가"**에 대해 역할별로 업무를 분할한 문서입니다.

## 상위 문서

- 기능 설계: `docs/specs/functional-design/auth-account.md` (랜딩 페이지 섹션)

## 목표

인스타그램 유입 사용자가 서비스를 이해하고 가입을 결심하도록 설득하는 `/landing` 퍼블릭 페이지를 구현한다.

## 범위

### 포함
- [x] `/landing` 라우트 추가 (public)
- [x] LandingPage 컴포넌트 (히어로 + 기능 소개 + 사회적 증거 + CTA)
- [x] 반응형 레이아웃 (모바일 퍼스트)
- [x] 인증된 사용자 리다이렉트 (`/` 대시보드)
- [x] GA4 이벤트 (landing_view, landing_cta_click, landing_login_click)

### 제외
- [ ] 백엔드 API 추가 (account.count 재사용)
- [ ] SEO/메타태그
- [ ] 인스타그램 API 연동

---

## 역할별 업무 분할

### 프론트엔드 개발자

> 검수 기준: `.claude/rules/web.md`, `.claude/rules/design.md`

| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | 라우트 등록 | `/landing` public 라우트 추가, 인증 시 `/` 리다이렉트 | 없음 |
| F2 | LandingPage 컴포넌트 | 히어로 + 기능 소개 + 사회적 증거 + CTA 3단 구성, 반응형 | 없음 |
| F3 | GA4 이벤트 추적 | landing_view, landing_cta_click(위치 구분), landing_login_click | F2 완료 후 |
| F4 | 빌드/타입체크 검증 | `pnpm typecheck && pnpm build` 전체 통과 확인 | F1~F3 완료 후 |

**Development**: `docs/specs/target/functional/development/landing-page-frontend.md`

---

## 업무 의존성 다이어그램

```
[F1] ──┐
       ├──▶ [F3] ──▶ [F4]
[F2] ──┘
```

F1(라우트)과 F2(컴포넌트)는 병렬 가능. F3(이벤트)는 F2 이후. F4(검증)는 전체 이후.

---

## 검증 체크리스트

### 기능 검증
- [ ] `/landing` 접근 시 히어로 + 기능 소개 + CTA 정상 표시
- [ ] CTA 클릭 → `/signup` 이동
- [ ] "이미 계정이 있으신가요?" → `/login` 이동
- [ ] 인증된 사용자 `/landing` 접근 → `/` 리다이렉트
- [ ] 모바일/데스크톱 반응형 정상 동작

### 요구사항 추적
- [ ] 기능 설계의 UI 구조 (히어로/기능소개/CTA 3단) 반영
- [ ] 기능 설계의 사회적 증거 (account.count) 반영
- [ ] 기능 설계의 예외 케이스 (API 실패, 이미지 실패) 반영
- [ ] 기능 설계의 측정 이벤트 3개 반영

---

**작성일**: 2026-02-13
**상태**: Approved
