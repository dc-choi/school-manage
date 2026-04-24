---
name: design-draft
description: Claude Design(claude.ai/design)으로 시안 제작 → 2단 컨펌 → Claude Code 구현 플로우를 5단계로 진행한다. /design-draft [기능명]으로 호출. 새 페이지·주요 컴포넌트·출력물 비주얼이 필요할 때.
---

# /design-draft — Claude Design 협업 플로우

Claude Design(claude.ai/design)과 school_back 코드베이스를 연결하는 5단계 워크플로우. 각 Phase 끝에서 사용자 응답을 대기한다.

## 사전 요구사항

- Claude Pro / Max / Team / Enterprise 구독 (Claude Design research preview 필요)
- **학생/계정/교구 실데이터 금지** — 반드시 더미 데이터로 작업 (외부 서비스 업로드)

## Phase 1: 컨텍스트 수집 + 프롬프트 생성

$ARGUMENTS(기능명/화면명) 기준으로:

1. 관련 파일 자동 스캔:
   - `apps/web/src/app/**` — 기존 페이지 구조
   - `apps/web/src/components/**` — shadcn 기반 재사용 컴포넌트
   - `apps/web/src/styles/globals.css` — 디자인 토큰, CSS Cascade Layer
   - `packages/shared/src/constants.ts` — 도메인 용어/상태값
2. 프롬프트 초안 생성 (한국어, 다음 섹션 포함):
   - **목표**: 한 줄 요약
   - **대상 사용자**: 교사/관리자/학부모 중 누구
   - **핵심 화면 요소**: 3~7개 bullet
   - **디자인 제약**:
     - shadcn/ui + Tailwind 토큰 준수
     - 기존 `apps/web/src/components/ui/`와 스타일 일관
     - WCAG AA 접근성
     - 다크 모드 호환
     - margin 기반 유틸(`space-y-*`, `mt-*`)은 `@layer base` 이슈 주의
   - **참조 컴포넌트**: 기존 파일명 3개 (Claude Design이 패턴 파악하도록)
   - **더미 데이터 예시**: 실명/연락처/교구명 절대 금지
3. 사용자에게 프롬프트 보여주고 승인 요청

## Phase 2: Claude Design 시안 요청

Phase 1 프롬프트 승인 후, 사용자에게 안내:

```
아래 프롬프트를 claude.ai/design 에 붙여넣어 시안을 받으세요.
시안 완성되면 이 대화에:
  (a) 스크린샷 파일 경로, 또는
  (b) PDF/HTML export 경로, 또는
  (c) handoff bundle 디렉토리 경로
중 하나를 공유해 주세요.
```

사용자 응답 대기 (이 세션을 길게 유지할 거면 중간에 `/save-session`으로 상태 저장 권장).

## Phase 3: 시안 수신 + 2단 컨펌

사용자가 시안 자산을 공유하면 **두 에이전트 병렬 호출**:

1. **design-reviewer 에이전트** Task 위임:
   - 입력: 시안 스크린샷/PDF/HTML 경로
   - 요청: 심미성·UX 플로우·접근성(WCAG AA)·shadcn 토큰 일관성 평가
2. **본 세션에서 직접 수행** — 코드 통합 관점:
   - 기존 컴포넌트 재사용 가능 부분 식별(`apps/web/src/components/ui/*`)
   - shadcn/Tailwind로 즉시 구현 가능 vs 커스텀 CSS 필요 구분
   - 예상 구현 난이도(S/M/L), 새로 생길 파일 수 예측
   - `apps/web` 기존 라우팅/상태 구조와 충돌 여부

두 리포트를 병합해 사용자에게 컨펌 요청:
- **승인** → Phase 4
- **수정 요청** → Phase 1/2 프롬프트 보강해서 재실행

## Phase 4: handoff bundle → 구현

승인 시안의 handoff bundle을 받으면:

1. bundle 구조 분석: 색상 변수, 타이포 스케일, 컴포넌트 계층, 인터랙션
2. **`/sdd` 워크플로우에 위임**:
   - `/sdd 1` PRD 작성 시 `디자인 소스: <bundle 경로 또는 Claude Design 세션 URL>` 명시
   - `/sdd 2` 기능 설계에 bundle의 컴포넌트 계층 반영
   - `/sdd 5` 구현 단계에서 `frontend-design` 스킬을 보조 호출(고품질 구현 보장)
3. SDD 5단계 완료 후 Phase 5로

## Phase 5: 검증 + PR

1. 구현 화면 vs 원본 시안 교차 검증:
   - `design-reviewer` 재호출 (이번엔 실제 브라우저 스크린샷 기준)
   - 시안과 차이가 있는 부분은 `tradeoff 수용` 또는 `구현 수정` 명시 결정
2. PR 본문에 반드시 포함:
   - Claude Design 세션 URL (있으면)
   - Before(시안 스크린샷) / After(구현 스크린샷) 병치
   - 시안 대비 변경된 부분의 사유 (있으면)

## 관련 자산

- `frontend-design` 플러그인 스킬 — Phase 4에서 보조 호출
- `design-reviewer` 에이전트 — Phase 3, 5
- `/sdd` — Phase 4 위임
- `.claude/rules/web.md`, `design.md`, `design-patterns.md`, `web-patterns.md` — 적용 규칙
- `/save-session` — Phase 2 대기 중 컨텍스트 저장용

## 안티패턴

- Phase 3 스킵하고 바로 구현 → 시안이 실제 코드베이스와 충돌하는 경우 재작업 비용 큼
- 실데이터로 Claude Design에 업로드 → 개인정보 유출 위험
- handoff bundle 없이 스크린샷만으로 구현 → 색상/간격 정밀도 손실 (bundle이 있으면 반드시 사용)
