# PRD: Express 5.x 마이그레이션

> 상태: Draft | 작성일: 2026-04-28

## 배경/문제 요약

- 참고: `docs/specs/README.md` TARGET/BUGFIX "Express 4.x qs DoS 취약점" (P3)
- 문제: `apps/api`가 사용하는 `express@^4.22.1`은 내부 의존 `qs`의 Prototype Pollution 계열 CVE에 노출되어 있음. rate limit(200/분)으로 표층 공격이 일부 경감되지만, 보안 기본 원칙상 업그레이드 경로를 유지해야 함.
- 공식 LTS 전략: Express **5.1.0이 2025-03-31부 npm `latest` 태그**로 지정되어 production-recommended 트랙(`https://expressjs.com/2025/03/31/v5-1-latest-release.html`). Express 4.x는 `latest-4` dist-tag로 분리되어 **maintenance phase**에 진입(보안 백포트만, 결국 EOL 트랙). 이로써 마이그레이션은 "할지 말지"가 아니라 "언제 할지"의 문제이며, MAO 50 직전 시점에 정공법으로 해소하는 것이 평행 라인이 살아있는 동안 가장 안전.
- 현재 상태: `express@4.22.1`, `express-rate-limit@8.2.1(express@4.22.1)`, `express-http-context@2.0.1` (이미 내부적으로 `AsyncLocalStorage` 사용), `cls-rtracer@2.6.3` (peer 미선언, 3년 무업데이트), `@types/express@4.x`. tRPC Express adapter, 글로벌 에러 미들웨어, 인증 미들웨어가 Express 표준 시그니처에 직접 의존. 단, `context.set('account_name', …)` 호출이 코드 0건이라 logger의 `account` 필드는 현재 비활성(죽은 코드).
- 목표 상태: `express@^5.x` 안정 버전 적용. 기존 API 행동 호환성 100% 유지. `pnpm audit`에서 qs Prototype Pollution 계열 high/critical 0건.

## 목표/성공 기준

- **목표**: Express 5.x 마이그레이션으로 qs 취약점을 근본 해소하고, 핵심 미들웨어/라우터/tRPC adapter 호환을 검증한다.
- **성공 지표**:
    - `pnpm audit --prod` 결과 qs Prototype Pollution 계열 high/critical 0건
    - `express` 메이저 버전이 `5.x`로 고정 (peer 포함)
    - 기존 통합/단위 테스트 100% 통과 (회귀 0건)
    - 모든 tRPC procedure 응답 상태코드/포맷 무변경 (smoke 검증)
    - `pnpm typecheck`, `pnpm build`, `pnpm test` 전부 통과
- **측정 기간**: 배포 직후 1주간 서버 에러 로그(`ERROR` 레벨) 추이 관찰. 비교 기준: 직전 1주 동일 시간대.

## 사용자/대상

- **주요 사용자**: 직접 영향 없음 (인프라 마이그레이션)
- **사용 맥락**:
    - 외부 API 클라이언트(웹 앱, 향후 모바일 등) — 응답 형식/상태코드 무변경 보장
    - 백엔드 개발자 — 새 Express 5 시그니처/에러 핸들러 패턴에 맞춘 신규 코드 작성

## 범위

### 포함

- `apps/api`의 `express` `^4.22.1` → `^5.x` 의존성 업그레이드 (catalog 포함)
- 의존성 호환 검증 및 필요 시 업그레이드:
    - `express-rate-limit` (Express 5 호환 버전 확인)
    - `express-http-context` (Express 5 호환 버전 확인 — 호환 불가 시 대체 검토)
    - `@types/express` 5.x 버전 정렬
    - `@trpc/server` Express adapter 호환 검증
- Express 5 breaking change 영향 코드 수정:
    - `req.query` / `req.params` read-only 정책 (mutation 코드 제거)
    - async 라우트 핸들러 자동 에러 전파 (수동 try/catch wrapper 제거 가능 여부 검토)
    - `path-to-regexp` v8 라우트 패턴 (`?`/`*`/이름 있는 와일드카드 시맨틱 변경)
    - 응답 메서드 시그니처 변화 (`res.redirect`, `res.status` 등)
- 글로벌 미들웨어 점검: `error.middleware.ts`, 인증/JWT 미들웨어, 로거, response-meta
- tRPC Express adapter (`@school/trpc`) 호환 검증 + 필요 시 업데이트
- 마이그레이션 후 `pnpm audit` 재확인 + 잔여 취약점 보고

### 제외

- 신규 기능 추가
- 도메인 로직 리팩터링 (마이그레이션과 무관한 코드 변경)
- Fastify/NestJS 등 다른 프레임워크로의 전환 검토
- Node.js 버전 변경 (현재 24, 이미 Express 5 요구사항 충족)
- `@trpc/server` 메이저 버전 업그레이드 (필요 최소 변경만)
- 프론트엔드(`@school/web`) 변경
- 데이터베이스 스키마/마이그레이션

## 사용자 시나리오

1. **정상**: 교리교사가 출석을 기록 → tRPC 호출 → Express 5 라우터 → tRPC adapter → procedure 실행 → 200 응답. (기존과 동일)
2. **인증 실패**: 만료된 JWT로 요청 → 글로벌 에러 미들웨어가 401 반환. (기존과 동일)
3. **잘못된 라우트 패턴**: 존재하지 않는 경로로 요청 → 404 응답. (Express 5 path-to-regexp v8 동작 검증 대상)
4. **외부 악의적 요청**: qs 취약점 패턴(`?a[__proto__][polluted]=1`) 전송 → 5.x의 신 qs 버전이 차단/무시. 서비스 영향 없음.
5. **rate limit**: 200/분 초과 호출 → 429 반환. (express-rate-limit이 Express 5에서도 동작)

## 요구사항

### 필수 (Must)

- [ ] `apps/api/package.json`의 `express`를 `^5.x` 안정 버전으로 업그레이드 (catalog 활용 시 catalog 동기화 포함)
- [ ] `@types/express` 5.x 버전으로 정렬 (catalog)
- [ ] `express-rate-limit` Express 5 호환 버전 검증/업그레이드
- [ ] `express-http-context` Express 5 호환 버전 검증 (호환 불가 시 대체 또는 자체 구현 — 구현 시 별도 검토 후 진행)
- [ ] `@trpc/server` Express adapter 호환 검증 (호환되지 않으면 대체 경로 결정)
- [ ] `req.query` / `req.params` mutation 코드 전수 점검 및 제거
- [ ] async 라우트 핸들러의 수동 `next(error)` 패턴 점검 (Express 5에서 자동 전파 활용 검토)
- [ ] path-to-regexp v8 라우트 패턴 점검 (와일드카드 사용처 확인)
- [ ] 글로벌 에러 미들웨어 시그니처/동작 검증 (`error.middleware.ts`)
- [ ] 모든 기존 통합/단위 테스트 통과 (`pnpm test`)
- [ ] `pnpm typecheck`, `pnpm build` 통과
- [ ] `pnpm audit --prod` 결과 qs Prototype Pollution 계열 high/critical 0건 확인

### 선택 (Should)

- [ ] 마이그레이션 노트(주요 변경/주의사항)를 `.claude/rules/api.md`에 반영 (Should — 6단계 문서 정리에서 결정)
- [ ] Express 5에서 권장되는 새 패턴(예: 비동기 핸들러 자동 에러 전파)을 활용한 미들웨어 단순화 (스코프 압박 시 보류)
- [ ] 성능 회귀 측정: 마이그레이션 전후 동일 시나리오(`/trpc/auth.login` + `/trpc/attendance.list`) 대상 1분 RPS 비교. 작은 응답에서 RPS -10% 이내 허용. 격차가 더 크면 후속 사이클에서 미들웨어 슬림화 검토

### 제외 (Out)

- 신규 기능/도메인 로직 변경
- Express → 타 프레임워크 전환
- Node.js 버전 변경
- 프론트엔드/DB 변경
- `@trpc/server` 메이저 업그레이드 (v10 → v11). 근거: v11은 router/procedure 시그니처 변경 다수 → 회귀 위험 폭증
- `helmet` 등 신규 보안 미들웨어 도입 — 별도 사이클
- `cls-rtracer` → `node:async_hooks` 직접 사용 리팩터 — 별도 사이클
- `express-http-context`를 `AsyncLocalStorage` 자체 헬퍼로 교체하는 작업 — B1에서 호환 ✅이면 본 PR에서 비실시. 비호환(❌) 시에만 본 PR에서 진행 가능, 그 외엔 별도 사이클

## 제약/가정/리스크/의존성

- **제약**:
    - 외부 API 응답 형식/상태코드는 변경 금지 (웹/외부 호출자 호환성)
    - 단일 PR로 모든 변경을 수렴 (롤백 단위 명확화)
    - **성능 트레이드오프 인지**: Express 5는 모든 Node 버전/시나리오에서 4 대비 raw throughput이 일관되게 약간 낮음. 작은 응답·깊은 미들웨어 체인에서 격차가 가장 두드러지고, 큰 페이로드/JSON-heavy 엔드포인트에서는 거의 사라짐. 본 코드베이스는 tRPC JSON 위주 + 미들웨어 11단계로 깊은 편이므로 측정 가치는 있지만 의사결정을 뒤집을 수준은 아님(공식 LTS 전략 정렬 우선)
- **가정**:
    - Node.js 24 환경에서 Express 5 안정 동작 (Express 5 요구사항 Node.js 18+ 충족)
    - 라우트 패턴은 표준 Express 문법만 사용 (커스텀 path-to-regexp 패치 없음)
    - `@trpc/server` 현재 버전이 Express 5 adapter를 (공식/사실상) 지원 — 사전 호환 매트릭스 확인 후 진행
- **리스크**:
    - **R1. tRPC Express adapter 비호환**: v10은 v11 stable 출시 후 maintenance 모드. v10.45.x에서 Express 5 어댑터 정식 검증 이력 없음. 완화: B1에서 단일/배치/GET/`responseMeta`/subscription(0건 확인) 통과 기준 실측. 비호환 시 PR 보류.
    - **R2. express-http-context 호환성**: 실제 `^2.0.1`은 이미 내부적으로 Node `AsyncLocalStorage`를 사용 — Express 5 동작 가능성 매우 높음. 단 peer 미선언이라 공식 보증 없음. 또한 코드 전반 `context.set('account_name')` 호출이 0건이라 어떤 컨텍스트 라이브러리든 결과 동일(현재 logger account 필드 비활성). 완화: B1 실측 후 호환 시 그대로 유지. AsyncLocalStorage 자체 헬퍼 교체는 별도 사이클(PR 비대화 방지).
    - **R3. path-to-regexp v8 라우트 시맨틱 변경**: 기존 와일드카드/옵셔널 패턴이 다르게 매칭될 수 있음. 완화: 라우트 전수 grep(와일드카드/괄호/물음표 0건 입증) + 회귀 테스트.
    - **R4. async 에러 전파 차이**: 일부 핸들러에서 동기 throw vs async reject 처리 차이로 응답 누락 가능. 완화: 글로벌 에러 미들웨어 회귀 테스트.
    - **R5. body parser 옵션 변경**: Express 5는 `express.json()`/`urlencoded()` 기본 내장이지만 옵션 호환 확인 필요. `req.body` 기본값 `undefined` 변경으로 logger의 `req.body` 직접 참조 4건은 nullish fallback 적용 필요.
    - **R6. cls-rtracer 미관리 패키지**: `^2.6.3` 마지막 publish 3년 전, peer/engines 미선언. 내부적으로 `AsyncLocalStorage` 사용해 동작 가능성 높지만 향후 보안 패치 부재 가능. 완화: B1에서 동시 요청 격리 실측. 패키지 교체는 별도 사이클.
- **내부 의존성**:
    - `@school/trpc` 패키지 (Express adapter 사용 위치)
    - 글로벌 미들웨어 (`apps/api/src/global/middleware/*`, `apps/api/src/infrastructure/*`)
- **외부 의존성**:
    - `express` 5.x, `@types/express` 5.x, `@types/express-serve-static-core` 5.x
    - `express-rate-limit ^8.2.1` (peer `>=4.11` ✅), `express-http-context ^2.0.1` (사전 조사), `cls-rtracer ^2.6.3` (사전 조사)
    - `@trpc/server ^10.45.x` Express adapter (사전 조사 필요)
    - `@types/cookie-parser`, `@types/cors`, `@types/request-ip` (`@types/express` 5.x 정렬에 따른 patched dep 재계산)

## 롤아웃/검증

- **출시 단계**: 단일 PR로 머지. 스테이징 자동 배포 후 smoke (헬스체크, 로그인, 출석 기록, 출석 조회 핵심 시나리오) → 프로덕션 머지.
- **이벤트**: 없음 (인프라/보안 변경)
- **검증**:
    - 자동 검증: `pnpm typecheck`, `pnpm build`, `pnpm test`, `pnpm audit --prod`
    - reviewer 게이트: `/pre-pr` (security-reviewer / typescript-reviewer / silent-failure-hunter 우선)
    - 운영 검증: 배포 후 1주간 서버 에러 로그(`ERROR` 레벨) 추이 비교 (직전 1주 대비 5% 이내 변동)

## 오픈 이슈

- [ ] `@trpc/server ^10.45.x` Express adapter의 Express 5 호환 — B1 실측 결과 (단일/배치/GET/responseMeta/subscription)
- [ ] `express-http-context@^2.0.1` Express 5 동작 — B1 실측 (`AsyncLocalStorage` 기반이라 호환 가능성 매우 높음)
- [ ] `cls-rtracer@^2.6.3` Express 5 + Node 24 동작 — B1 실측 (동시 요청 trace id 격리)
- [ ] `path-to-regexp` v8 영향 라우트 grep 결과 (와일드카드/괄호/물음표 0건 입증)
- [ ] `pnpm why qs` 트랜지티브 점검 + 잔존 발견 시 `pnpm.overrides` 적용 여부

## 연결 문서

- 사업 문서: `docs/specs/README.md` TARGET/BUGFIX (P3 항목)
- 기능 설계: `docs/specs/functional-design/express-5-migration.md` (다음 단계에서 작성)
