# PRD: Stitch MCP 서버 연동

> 상태: Draft | 작성일: 2026-03-24

> SDD 작성자가 작성하는 제품 요구사항 문서입니다.
> 사업 에이전트의 `docs/business/` 문서를 기반으로 작성합니다.

## 배경/문제 요약

- 참고: `docs/business/6_roadmap/roadmap.md` (2단계 → 3단계 전환기)
- 문제: SDD 워크플로우에서 UI 설계(2단계 기능 설계)가 텍스트 기반 와이어프레임(ASCII)에 의존 → 시각적 검증 없이 구현 진입
- 현재 상태: SDD 에이전트가 기능 설계 문서에 ASCII 개념도만 작성, 실제 UI는 구현 단계에서 확인
- 목표 상태: Claude Code에서 Stitch MCP를 통해 프롬프트 기반 UI 목업 생성 → 기능 설계 단계에서 시각적 검증 가능

## 목표/성공 기준

- **목표**: Claude Code SDD 워크플로우에 Stitch MCP 서버를 연동하여 디자인 프로토타이핑 단계 추가
- **성공 지표**: Claude Code에서 Stitch MCP 도구 호출로 UI 목업 HTML/CSS 생성 가능
- **측정 기간**: 연동 후 첫 SDD 사이클 1회

## 사용자/대상

- **주요 사용자**: 개발자 (SDD 에이전트 운용자)
- **사용 맥락**: SDD 2단계(기능 설계) 작성 시, 새 화면/플로우의 UI를 빠르게 프로토타이핑

## 범위

### 포함

- Stitch MCP 서버 설정 (Claude Code `.claude/settings.json` 또는 `.mcp.json`)
- 인증 설정 (Google Cloud OAuth / Service Account)
- 연동 검증 (테스트 프로젝트로 UI 생성 확인)
- DESIGN.md 활용 검토 (기존 `rules/design.md` 디자인 시스템 → Stitch DESIGN.md 포맷 변환)

### 제외

- 프로덕션 코드 변경 (앱 코드 수정 없음)
- Stitch 생성 HTML을 React 컴포넌트로 자동 변환하는 파이프라인
- Figma 연동
- SDD 워크플로우 자체의 변경 (기존 단계 유지, 도구 추가만)

## 사용자 시나리오

1. **시나리오 1: 새 기능 UI 프로토타이핑**
   - 개발자가 SDD 2단계에서 "컨텍스트 배너" 기능 설계 중
   - Claude Code에서 Stitch MCP 도구 호출: "출석부 앱 상단에 '학생을 등록해보세요' 안내 배너"
   - Stitch가 HTML/CSS 목업 생성 → 개발자가 시각적으로 확인 후 기능 설계 확정

2. **시나리오 2: 디자인 시스템 추출/적용**
   - 기존 프로덕션 URL에서 Stitch로 디자인 시스템 추출
   - DESIGN.md 포맷으로 export → 이후 Stitch 생성 시 일관된 스타일 적용

## 요구사항

### 필수 (Must)

- [ ] Stitch MCP 서버가 Claude Code에서 도구로 인식됨
- [ ] 텍스트 프롬프트 → UI 목업 생성 동작 확인
- [ ] 인증이 안정적으로 동작 (세션 만료 없이 사용 가능)

### 선택 (Should)

- [ ] DESIGN.md로 기존 디자인 시스템 연동
- [ ] 생성된 HTML을 로컬에서 미리보기 가능
- [ ] Conductor 워크스페이스에서도 Stitch MCP 사용 가능

### 제외 (Out)

- React/shadcn/ui 컴포넌트 자동 변환
- CI/CD 파이프라인 연동
- 팀 단위 Stitch 협업 (1인 개발 환경)

## 제약/가정/리스크/의존성

- **제약**: Stitch는 Google Labs 실험 단계 — API/MCP 스펙 변경 가능
- **가정**: `npx @_davideast/stitch-mcp proxy` 방식으로 로컬 프록시 설정 가능
- **리스크**: Google OAuth 토큰 갱신 주기(1시간)로 인한 세션 끊김 — Service Account 방식으로 완화 가능
- **내부 의존성**: 없음 (프로덕션 코드 무관)
- **외부 의존성**: Google Cloud 프로젝트, Stitch API 접근 권한, `@_davideast/stitch-mcp` npm 패키지

## 롤아웃/검증

- **출시 단계**: 로컬 개발 환경에만 적용 (프로덕션 영향 없음)
- **이벤트**: 없음 (DX 도구) | **검증**: Stitch MCP 도구 호출 → UI 생성 성공 확인

## 오픈 이슈

- [ ] Google Cloud 프로젝트 생성 및 Stitch API 활성화 필요 여부 확인
- [ ] Service Account vs OAuth 인증 방식 최종 선택
- [ ] Stitch 월 350회 생성 제한이 SDD 워크플로우에 충분한지 검증

## 연결 문서

- 사업 문서: `docs/business/6_roadmap/roadmap.md` (2단계 잔여 + 3단계 준비)
- SDD 인덱스: `docs/specs/README.md` (DX Non-Functional 섹션)
- 디자인 규칙: `.claude/rules/design.md`
- Stitch MCP: https://github.com/davideast/stitch-mcp
- Stitch 공식: https://stitch.withgoogle.com/docs/mcp/setup
