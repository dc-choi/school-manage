# Development: 게스트 대시보드 — 백엔드

> `liturgical.season` 엔드포인트를 공개 전환합니다.

## 상위 문서

- PRD: `docs/specs/prd/guest-dashboard.md`
- 기능 설계: `docs/specs/functional-design/guest-dashboard.md`
- Task: `docs/specs/target/functional/tasks/guest-dashboard.md`

## 구현 대상 업무

| Task 업무 # | 업무명 | 이 문서에서 구현 여부 |
|------------|-------|-------------------|
| B1 | liturgical.season 공개 전환 | O |

## 구현 개요

`liturgical.season` procedure의 `consentedProcedure`를 `publicProcedure`로 변경한다. 전례 시기 데이터는 가톨릭 공개 달력 기반이며, 조직/개인 데이터를 포함하지 않으므로 인증 없이 접근 가능하다.

## 변경 내용

### 파일: `apps/api/src/domains/liturgical/presentation/liturgical.router.ts`

**변경 전:**
```typescript
import { consentedProcedure, router } from '@school/trpc';

season: consentedProcedure.input(getSeasonInputSchema).query(...)
```

**변경 후:**
```typescript
import { consentedProcedure, publicProcedure, router } from '@school/trpc';

season: publicProcedure.input(getSeasonInputSchema).query(...)
```

- `holydays`는 기존 `consentedProcedure` 유지 (변경 없음)
- `season`만 `publicProcedure`로 변경

## 보안 검토

- `GetSeasonUseCase`는 `ctx`(인증 컨텍스트)를 사용하지 않음 → 공개 전환에 보안 영향 없음
- 전례 시기 데이터는 가톨릭 교회력 기반 공개 정보

## 테스트 시나리오

### 정상 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| 비인증 상태로 전례 시기 조회 | `{ year: 2026 }` | 200, 전례 시기 데이터 반환 |
| 인증 상태로 전례 시기 조회 | `{ year: 2026 }` + 토큰 | 200, 기존과 동일 |

### 예외 케이스

| 시나리오 | 입력 | 기대 결과 |
|---------|------|----------|
| holydays는 여전히 인증 필요 | 토큰 없이 holydays 호출 | 401 |

---

**작성일**: 2026-03-18
**리뷰 상태**: Approved
