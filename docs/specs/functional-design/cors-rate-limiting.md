# 기능 설계: CORS + Rate Limiting

> SECURITY 비기능적 요구사항. 간소화 워크플로우 적용.

## 연결 문서

- README: `docs/specs/README.md` SECURITY 섹션

---

## 배경

- CORS: `apps/api/src/app.ts`에서 주석 처리 상태 — 모든 origin 허용 중
- Rate Limiting: 미구현 — 로그인 브루트포스, API 남용 방어 없음

## 목표

- CORS 화이트리스트로 허용된 origin만 접근 가능
- Rate Limiting으로 인증 엔드포인트 브루트포스 방어

---

## CORS

현재 프로덕션은 same-origin (API 서버가 `public/`에서 웹 서빙), 개발은 Vite proxy.

| 환경 | origin | 비고 |
|------|--------|------|
| production | same-origin (설정 불필요) | API가 `public/`에서 웹 서빙 |
| local/dev | `http://localhost:*` | Vite dev server |

- `CORS_ORIGIN` 환경변수 (optional): 별도 배포 시 웹 도메인 지정
- 미설정 시 same-origin만 허용 (기본값)
- `credentials: true` 활성화

## Rate Limiting

| 대상 | 제한 | 윈도우 | 비고 |
|------|------|--------|------|
| 전체 API | IP당 100회 | 1분 | 일반 남용 방어 |
| 인증 엔드포인트 (`/trpc/auth.*`) | IP당 10회 | 1분 | 브루트포스 방어 |

- 스토어: 메모리 (단일 인스턴스 충분)
- 초과 시 응답: 429 Too Many Requests
- `X-RateLimit-*` 헤더 포함

## 환경변수

| 변수명 | 필수 | 설명 |
|--------|------|------|
| `CORS_ORIGIN` | optional | 허용할 웹 origin (미설정 시 same-origin) |

## 예외/엣지 케이스

| 상황 | 처리 방법 |
|------|----------|
| `CORS_ORIGIN` 미설정 | same-origin만 허용 |
| Rate Limit 초과 | 429 응답 + `Retry-After` 헤더 |
| 서버 재시작 | 메모리 스토어 초기화 (허용) |

## 테스트 시나리오

1. **TC-SEC1**: 허용된 origin 요청 → 정상 응답 + CORS 헤더
2. **TC-SEC2**: 허용되지 않은 origin 요청 → CORS 차단
3. **TC-SEC3**: 인증 엔드포인트 10회 초과 → 429
4. **TC-SEC4**: 일반 API 100회 초과 → 429

---

**작성일**: 2026-02-14
**작성자**: SDD 작성자
**상태**: Approved
