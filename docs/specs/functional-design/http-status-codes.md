# 기능 설계: HTTP 응답 상태 코드 정상화 (Reliability)

> 상태: Draft | 작성일: 2026-04-24 | 분류: Non-Functional (Bugfix, P3)

## 연결 문서

- 코드: `apps/api/src/global/middleware/error.middleware.ts`, `apps/api/src/app.ts:88-97`, `apps/web/src/lib/trpc.ts:42-59`
- TARGET 등록: `docs/specs/README.md` BUGFIX 표 P3 — "HTTP 응답 상태코드 일률 200"
- 참조: [tRPC — Error Formatting / responseMeta](https://trpc.io/docs/server/error-formatting), [tRPC — HTTP Batching](https://trpc.io/docs/client/links/httpBatchLink)

## 배경

API 응답이 모든 에러 상황에서 **HTTP 200**을 반환한다. 두 가지 원인이 결합된 결과다.

### 원인 1: Express 중앙 에러 미들웨어가 강제 200

`error.middleware.ts:46-47`

```ts
// HTTP 상태 코드는 200 유지 (기존 동작 호환)
res.status(httpStatus.OK).json(response);
```

미들웨어는 `ApiError`를 분기 처리하지만, 코드베이스 전체에서 `new ApiError`/`ApiCode.` 참조는 미들웨어 자체뿐이다. **모든 UseCase는 `TRPCError`를 throw**하므로 `ApiError` 분기는 실질적 dead code다. 이 미들웨어는 tRPC 외부의 Express 단계 에러(JSON 파싱 실패, 라우트 미스 등)에만 도달한다.

### 원인 2: tRPC `httpBatchLink` + `responseMeta` 미설정

`apps/web/src/lib/trpc.ts:65`에서 클라이언트는 `httpBatchLink`로 다중 procedure를 단일 HTTP 요청으로 묶는다. 단일 호출은 tRPC가 `getHTTPStatusCodeFromError`로 자동 매핑하지만, **배치 응답은 모든 결과를 묶어야 하므로 기본값이 200**이다 (개별 에러는 응답 본문 내 `error` 객체로 전달). `apps/api/src/app.ts:88-94`의 `createExpressMiddleware`는 `responseMeta` 옵션이 없어 이 기본 동작을 그대로 따른다.

### 영향

- **프론트엔드 silent refresh 무동작**: `fetchWithRefresh`가 `response.status !== 401` 분기에서 401을 절대 만나지 못함 (`apps/web/src/lib/trpc.ts:45`). 토큰 만료 시 사용자가 재요청을 해야만 refresh 트리거 → 만료 직후 첫 요청은 본문 에러로 표시됨.
- **운영 관측 저하**: 로드밸런서/CloudWatch/GA4가 4xx/5xx로 에러를 식별하지 못하고 200으로만 카운트.
- **클라이언트 캐시/CDN 오작동**: 200 응답이 캐시 가능 응답으로 오인될 위험.

## 목표 / 비목표

| 구분 | 항목 |
|------|------|
| **목표** | (1) tRPC 응답이 procedure 에러 코드에 맞는 HTTP 상태 코드를 반환. (2) 배치 응답에서도 가장 우선순위 높은 에러 코드 채택. (3) 프론트엔드 silent refresh의 401 감지 정상화. (4) `ApiError` dead code 제거. |
| **비목표** | 응답 본문 포맷 변경. 신규 에러 코드 도입. tRPC 응답 본문 schema 변경. 클라이언트 측 추가 핸들링 (silent refresh 외). |

## 변경 대상 / 비대상

| 대상 | 현재 | 전환 후 |
|------|------|--------|
| `app.ts` tRPC 어댑터 | `responseMeta` 미설정 | `responseMeta` 추가 — 배치 내 첫 에러를 기준으로 `getHTTPStatusCodeFromError` 매핑 |
| `error.middleware.ts` | 강제 200 반환 | tRPC 외 라우트용으로 단순화: 500만 반환하는 fallback (또는 미들웨어 자체 제거) |
| `api.error.ts`, `api.code.ts`, `api.message.ts` | dead code | 제거 |
| `apps/web/src/lib/trpc.ts` | 변경 없음 | 변경 없음 (silent refresh 로직 그대로 — 비로소 정상 동작) |
| 테스트 | tRPC caller 기반 (HTTP 코드 미검증) | HTTP 상태 코드 검증 통합 테스트 신규 추가 |

> tRPC 응답 본문(`{ error: { code, message } }`) 포맷은 **변경 없음**. 클라이언트가 의존하는 본문 구조는 그대로다.

## 동작 명세

### tRPC `responseMeta` 규칙

```
responseMeta({ errors, type }) → { status }
```

- `errors`가 비어 있으면 status 미지정 (tRPC 기본 200).
- `errors`가 1건 이상이면 `getHTTPStatusCodeFromError(errors[0])`를 채택 (가장 우선순위 높은 첫 에러).
- 동일 배치에 다중 에러가 섞여도 첫 에러 기준으로 단일 상태 코드 결정.

| TRPCError code | HTTP 상태 |
|---|---|
| BAD_REQUEST | 400 |
| UNAUTHORIZED | 401 |
| FORBIDDEN | 403 |
| NOT_FOUND | 404 |
| TIMEOUT | 408 |
| CONFLICT | 409 |
| TOO_MANY_REQUESTS | 429 |
| INTERNAL_SERVER_ERROR / 기타 | 500 |

### Express 에러 미들웨어 단순화

`error.middleware.ts`는 다음 케이스만 처리한다:
- JSON 파싱 실패 → 400
- 그 외 모든 예외 → 500

`ApiError` 분기 삭제. 로깅은 유지(`logger.error` + `logger.res`). `res.status`는 결정된 코드 사용.

### Rate limit 응답 (참고, 영향 없음)

`express-rate-limit`은 자체적으로 429를 반환하므로 본 변경과 무관.

## 데이터/도메인 변경

없음.

## API/인터페이스

응답 **본문**은 변경 없음. 응답 **HTTP 상태 코드**만 정상화. 따라서 본문 기반 클라이언트(현재의 모든 `useQuery`/`useMutation`)는 영향 없음.

## 예외/엣지 케이스

| 상황 | 처리 |
|------|------|
| 단일 호출, procedure 성공 | 200 (기존) |
| 단일 호출, `UNAUTHORIZED` | 401 (변경) |
| 배치 호출, 전부 성공 | 200 (기존) |
| 배치 호출, 일부만 `UNAUTHORIZED` | **401** (변경) — silent refresh 트리거 |
| 배치 호출, `UNAUTHORIZED` + `FORBIDDEN` 혼재 | 첫 에러 기준 (배치 내 순서 의존) |
| tRPC 외 라우트 미스 | 404 (Express 기본) |
| Express JSON 파싱 실패 | 400 (변경) |
| 예상치 못한 throw | 500 (변경) |
| `auth.refresh` 자체가 401 | silent refresh 재진입 방지 분기(`fetchWithRefresh:48`)가 그대로 동작 |
| Refresh 후 재시도 성공 | 200 (silent refresh 정상 흐름) |

> 배치 내 다중 에러 시 첫 에러 기준 채택은 의도된 단순화. 클라이언트는 본문 `error[]` 배열로 개별 에러를 그대로 수신하므로 정보 손실 없음.

## 성능/제약

| 항목 | 변경 |
|------|------|
| 응답 크기 | 무변화 (본문 동일) |
| 추가 연산 | `responseMeta`는 응답당 O(errors) 1회 호출 — 무시 가능 |
| 캐시 정책 | 4xx/5xx가 정상 표기되어 CDN/브라우저 캐시 오인 위험 해소 |

## 테스트 시나리오

### 정상 케이스

- **TC-1**: 단일 procedure 성공 → HTTP 200 (회귀 게이트).
- **TC-2**: 단일 procedure가 `UNAUTHORIZED` throw → HTTP 401, 본문 `error.json.code === 'UNAUTHORIZED'`.
- **TC-3**: 단일 procedure가 `FORBIDDEN`/`NOT_FOUND`/`CONFLICT`/`BAD_REQUEST` → 각각 403/404/409/400.
- **TC-4**: 배치 호출 (`auth.refresh` + `account.get`) 둘 다 성공 → 200.
- **TC-5**: 배치 호출 중 1건이 `UNAUTHORIZED` → 401 (silent refresh가 정상 트리거되도록).

### 예외 케이스

- **TC-E1**: tRPC 외부 경로 `POST /trpc-misuse` → 404.
- **TC-E2**: 잘못된 JSON body → 400.
- **TC-E3**: UseCase 내부 예상치 못한 throw → 500, 응답 본문에 stack 노출 없음 (기존 logger 정책 유지).
- **TC-E4**: 기존 통합 테스트 전체(caller 기반) — 회귀 없음 (응답 본문 포맷 동일).

> HTTP 상태 코드 검증은 `request(app)` 기반 supertest 또는 `app.inject`/`fetch` 패턴으로 작성. `createScopedCaller`는 HTTP를 거치지 않으므로 보강 테스트는 별도 파일로 추가.

## 자기 검증 체크리스트

- [x] 동작 명세 수준 (구현 상세 위임, JSON 전문/의사코드 없음)
- [x] `ApiError` dead code 제거 명시 — grep 확인 (`ApiCode.|new ApiError` → 미들웨어 1건만)
- [x] 배치 모드의 200 일률 반환 원인 명시 (`responseMeta` 미설정)
- [x] 응답 **본문 포맷 무변화** 명시 — 클라이언트 영향 최소화
- [x] silent refresh가 비로소 동작하기 시작하는 행동 변화 명시
- [x] 회귀 게이트(통합 테스트 전체 통과 + caller 본문 포맷 동일) 명시
- [x] 비기능 워크플로우(Task/Dev 생략) 고려해 짧게 유지 (190줄 이내)
- [x] tRPC 외 라우트(파싱 에러, 라우트 미스)도 명시
