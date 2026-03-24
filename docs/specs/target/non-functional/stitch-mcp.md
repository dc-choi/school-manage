# 기능 설계: Stitch MCP 서버 연동

> 상태: Draft | 작성일: 2026-03-24

> 비기능적 요구사항 (DX). 간소화 워크플로우 적용: 기능 설계 → 바로 구현.

## 연결 문서

- PRD: `docs/specs/prd/stitch-mcp.md`
- 디자인 규칙: `.claude/rules/design.md`
- stitch-mcp: https://github.com/davideast/stitch-mcp

## 개요

Claude Code에서 Google Stitch MCP 프록시를 연동하여 텍스트 프롬프트 기반 UI 목업 생성을 가능하게 한다. 프로덕션 코드 변경 없이 개발 도구 설정만 추가한다.

## 구성 요소

### 1. MCP 서버 설정

`.mcp.json` (프로젝트 루트)에 Stitch MCP 프록시 등록:

```json
{
  "mcpServers": {
    "stitch": {
      "command": "npx",
      "args": ["@_davideast/stitch-mcp", "proxy"]
    }
  }
}
```

### 2. 인증

| 방식 | 설명 | 권장 |
|------|------|------|
| `stitch-mcp init` | 대화형 위저드 (gcloud OAuth) | 초기 설정 시 |
| `STITCH_API_KEY` | API 키 환경변수 | 반복 사용 시 |
| `STITCH_USE_SYSTEM_GCLOUD=1` | 기존 gcloud 인증 재사용 | gcloud 설치 시 |

초기 설정: `npx @_davideast/stitch-mcp init` 실행 → OAuth 인증 → 자격증명 로컬 저장.

### 3. 사용 가능 도구

| MCP 도구 | 설명 | 입력 | 출력 |
|----------|------|------|------|
| `build_site` | 프로젝트의 화면들을 사이트로 빌드 | project_id | HTML (경로별) |
| `get_screen_code` | 특정 화면의 HTML/CSS 코드 | screen_id | HTML/CSS 문자열 |
| `get_screen_image` | 화면 스크린샷 | screen_id | base64 이미지 |

### 4. SDD 워크플로우 활용

기존 SDD 2단계(기능 설계)에서 선택적으로 활용:

```
기능 설계 작성 → [선택] Stitch로 UI 목업 생성 → 시각적 검증 → 기능 설계 확정
```

- Stitch 웹 UI에서 프로젝트/화면 생성 (텍스트 프롬프트)
- Claude Code에서 `get_screen_code`로 HTML 확인
- `stitch-mcp serve -p <id>`로 로컬 미리보기

## 파일 변경 목록

| 파일 | 변경 | 설명 |
|------|------|------|
| `.mcp.json` (신규) | 추가 | Stitch MCP 서버 등록 |
| `.gitignore` | 수정 | `.stitch/` 디렉토리 무시 (인증 캐시) |
| `CLAUDE.md` | 수정 | Stitch MCP 도구 설명 추가 |

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| 인증 만료 | `stitch-mcp init` 재실행 또는 `STITCH_API_KEY` 사용 |
| Stitch API 미응답 | MCP 도구 호출 실패 → SDD 워크플로우 영향 없음 (선택적 도구) |
| 월 350회 초과 | 다음 달 리셋 대기. 현재 SDD 사이클 빈도상 충분 |
| npx 실행 실패 | `npm install -g @_davideast/stitch-mcp` 전역 설치 후 command를 `stitch-mcp`로 변경 |

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: Claude Code 재시작 후 Stitch MCP 도구가 도구 목록에 표시됨
2. **TC-2**: `get_screen_code` 호출 → HTML/CSS 문자열 반환
3. **TC-3**: `stitch-mcp serve -p <id>` → 로컬 브라우저에서 미리보기 가능

### 예외 케이스

1. **TC-E1**: 인증 없이 도구 호출 → 인증 필요 에러 메시지 반환
2. **TC-E2**: 잘못된 project_id로 호출 → 적절한 에러 메시지 반환
