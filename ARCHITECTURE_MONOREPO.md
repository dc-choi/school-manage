# 모노레포(pnpm) + React(Vite) + tRPC 도입 제안서

목표: 이 레포지토리 안에서 **백엔드(Express) + 프론트엔드(React/Vite)** 를 함께 개발하고, **tRPC**로 end-to-end 타입 안정성을 확보하면서, 현재 서버의 구조적 리스크(부트스트랩/에러처리/레이어 결합/스케줄러/로깅 등)를 **빠르게 개선**한다.

관련 문서:
- `README.md`
- `TYPE_SAFETY_AUDIT.md`
- `DEPLOY_DOCKERHUB.md`
- `TESTING_VITEST.md` (Vitest 전환 플랜)

권장 작업 순서: **아키텍처 → 타입 안정성 → 배포**

- 1) 아키텍처/구조 전환: 이 문서(`ARCHITECTURE_MONOREPO.md`) 기준으로 pnpm 모노레포 + Vite + tRPC의 뼈대를 먼저 확정
- 2) 타입 안정성 강화: `TYPE_SAFETY_AUDIT.md`의 “별도 작업 필요” 항목 중심으로 정리(특히 tsconfig/DB join/raw/DTO)
- 3) 배포/CI 정리: `DEPLOY_DOCKERHUB.md` 기준으로 Docker Hub(private) 이미지 파이프라인 확정(구조가 바뀐 뒤에 경로/빌드가 안정됨)

> 참고: 이 문서는 현재 구조(`src/*`)를 예시로 들 수 있지만, 모노레포 전환 후에는 경로가 바뀝니다. 경로보다 “역할/경계” 관점으로 참고하세요.

---

## 0) 지금 당장 “아키텍처 관점”에서 아쉬운 지점 요약

현 상태에서의 핵심 문제는 “기능이 없다”가 아니라, **경계(boundary)와 책임 분리(ownership)가 애매해서 변경 비용이 커지는 구조**라는 점이다.

- **Composition Root(부트스트랩) 혼재**: `src/app.ts`에서 `app.listen` + DB 연결 + 스케줄러 실행이 같이 있어 테스트/배포/스케일링(멀티 인스턴스) 시 비용이 커짐.
- **에러/응답 처리의 분산**: 각 controller/middleware에서 `try/catch + Result + logger.res`가 반복됨 → 일관성/확장성/관측성이 떨어짐.
- **레이어 경계가 흐림**: Service가 Sequelize `where/Op`를 직접 구성하고, Repository의 `raw join` 결과가 `any`로 전파됨 → DB 변경이 Service/Controller까지 전파.
- **의존성 주입 부재**: Service/Repository를 내부에서 `new`로 만들며 숨은 의존성이 생김 → 단위 테스트/교체가 어려움.
- **스케줄러 운영 리스크**: 웹 서버 프로세스에 스케줄러가 붙어있어 인스턴스가 늘면 중복 실행 위험이 큼.
- **로그/보안 경계 미흡**: 요청 body/cookie를 그대로 로깅하는 형태는 민감정보 유출 위험이 큼.
- **환경설정 보안**: `.env.example`에는 실제 패스워드/토큰 형태를 절대 넣지 않고 placeholder만 유지해야 함.

이 문서는 위 문제를 해결하면서 React + type-safe API를 모노레포로 합치는 “현실적인” 로드맵을 제시한다.

---

## 1) 목표 아키텍처(큰 그림)

### 목표

1. **모노레포 도입**: `apps/api`(Express) + `apps/web`(React) + `packages/*`(공유 모듈)
2. **API Contract 단일 소스**: 서버/클라이언트가 같은 계약(스키마/타입)을 공유
3. **경계 명확화**: HTTP ↔ UseCase ↔ DB 레이어의 책임을 분리
4. **운영 안전성**: 중앙 에러 처리, 민감정보 마스킹, 스케줄러 중복 실행 방지(단일 인스턴스 전제, scale-out 시 분산 락)
5. **주말 일괄 전환(big-bang)**: 사용자/트래픽이 낮은 전제에서, 주말에 한 번에 전환하고 필요 시 롤백 가능하게 준비

---

## 2) 모노레포 구조(권장)

### 권장 디렉토리 구조

```
/
  apps/
    api/                # 기존 Express 서버(이 레포의 src/test를 이동)
      src/
      test/
      package.json
      tsconfig.json
    web/                # React 앱 (Vite)
      src/
      package.json
      tsconfig.json
  packages/
    trpc/               # tRPC router(+ zod schema) 공유 패키지
      src/
      package.json
      tsconfig.json
    shared/             # 공유 타입/유틸/도메인 모델(선택)
      src/
      package.json
      tsconfig.json
    tsconfig/           # 공통 tsconfig 베이스(선택)
    eslint-config/      # 공통 eslint 룰(선택)
  package.json          # workspaces root
  tsconfig.base.json    # 공통 tsconfig (선택)
```

### 패키지 매니저(pnpm)

패키지 매니저는 **pnpm**을 사용한다.

- 루트에 `pnpm-workspace.yaml`을 두고 `apps/*`, `packages/*`를 워크스페이스로 관리
- 루트 `package.json`에 `"packageManager": "pnpm@<version>"`를 명시(팀/CI 고정)

#### 워크스페이스 파일 예시

`pnpm-workspace.yaml`

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

#### Task Runner(turbo)

Task runner는 **Turborepo(turbo)** 를 사용한다.

- `turbo.json`에 task graph 정의(캐시/병렬 실행)
- root script는 `turbo run ...` 형태로 통일

#### 루트 스크립트(예시)

각 패키지 이름을 아래처럼 두면 관리가 편하다.

- `apps/api`: `@school/api`
- `apps/web`: `@school/web`
- `packages/trpc`: `@school/trpc`

루트 `package.json` 예시(발췌):

```json
{
  "private": true,
  "packageManager": "pnpm@<version>",
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0"
  }
}
```

---

## 3) API 레이어: tRPC 선택

tRPC는 “API 계약(스키마/타입) + 서버 구현 + 클라이언트 타입 추론”을 한 번에 묶어주는 방식이라, 모노레포에서 특히 DX가 좋다.

- 장점
    - React에서 호출 시 응답 타입이 자동 추론되고, input은 `zod`로 런타임 검증 가능
    - REST 라우팅/컨트롤러 보일러플레이트를 크게 줄일 수 있음
    - API 변경이 프론트 컴파일 에러로 즉시 드러남
- 고려사항
    - OpenAPI가 “기본 제공” 성격은 아니라서, 외부 공개 API/문서화가 필요하면 별도 전략이 필요
    - 대규모 서비스라면 `/trpc` 병행이 안전하지만, 현재처럼 규모가 작다면 주말에 **일괄 전환(big-bang)** 도 현실적인 선택지

---

## 4) tRPC 공유 패키지 설계(핵심)

### `packages/trpc`의 책임

- tRPC `router`(procedure 정의)와 input 스키마(`zod`)를 정의
- 클라이언트가 import 할 수 있는 `AppRouter` 타입을 export
- 인증이 필요한 procedure를 위한 `protectedProcedure` 미들웨어(컨텍스트 기반) 제공
권장 라이브러리:

- `@trpc/server`, `@trpc/client`, `@trpc/react-query`
- `@tanstack/react-query`
- `zod` (input validation)
- `superjson` (Date 등 직렬화 필요 시)

권장 구조 예시:

```
packages/trpc/src/
  context.ts        # Context 타입(런타임 구현은 apps/api에서)
  trpc.ts           # initTRPC, public/protected procedure
  router/
    _app.ts         # appRouter
    auth.ts
    student.ts
```

### `apps/api`의 책임

- Express 서버에서 `/trpc` 엔드포인트를 열고, `packages/trpc`의 `appRouter`를 mount
- `createContext({ req, res })`에서 인증 토큰을 파싱/검증해 컨텍스트를 구성
- DB/비즈니스 로직은 router에 직접 쓰지 말고(권장), usecase/service 레이어로 분리

### `apps/web`의 책임

- `@trpc/react-query` + `@tanstack/react-query`로 tRPC client를 구성
- `packages/trpc`의 `AppRouter` 타입 기반으로 type-safe 호출

---

## 5) 백엔드 아키텍처 개선(현재 코드 기반으로 “바로 효과”나는 방향)

여기서 목표는 “클린 아키텍처를 과하게 도입”이 아니라, **변경 비용을 낮추는 경계 정리**다.

### 5.1 Composition Root 분리

현재 `src/app.ts`에 섞여있는 것을 아래처럼 분리한다.

- `apps/api/src/app.ts`
    - `export function createApp(): express.Express`
    - 미들웨어/라우터 mount만 담당
    - 테스트는 이 `createApp()`을 사용
- `apps/api/src/main.ts`
    - env 로드/검증
    - logger init
    - DB connect
    - scheduler init(분리하지 않고 API 프로세스 내에서 실행, 테스트에서는 비활성화)
    - `app.listen`

효과: 통합 테스트에서 “서버를 띄우지 않고도” `app`만 import해서 테스트 가능하고, 운영에서는 main만 실행.

### 5.2 중앙 에러 처리로 `try/catch` 제거

지금은 controller마다 `try/catch` + `Result.fail()`을 반복한다. 아래 방향이 더 확장성 좋다.

1. controller/handler는 실패 시 `throw ApiError(...)`
2. Express의 `error-handling middleware`에서
    - `ApiError`를 `ApiResponse`로 매핑
    - 그 외 error는 500으로 매핑
3. 응답 로깅(`logger.res`)도 이 미들웨어에서 한 번에 처리

효과: 코드량 감소 + 응답 형태 일관화 + 관측(로그/트레이싱) 포인트 단일화.

### 5.3 Service에서 Sequelize 의존 제거(경계 강화)

현재 예시: `student.service.ts`에서 `Op`로 where를 만든 뒤 repository에 넘김.

권장: Service는 도메인 수준 필터만 받고(`StudentQuery { searchOption, searchWord, groupIds, page, size }`), Repository가 Sequelize where로 변환한다.

효과: DB 교체/쿼리 변경이 Service까지 올라오는 것을 막음.

### 5.4 `raw join` 결과 타입을 명시하고 매퍼로 격리

현재 `findAndCountAll()`이 `{ rows: any }`를 반환하고, 상위에서 `item.group_name`을 주입한다.

권장:

- repository는 `StudentListRow` 같은 “쿼리 결과 전용 타입”을 반환
- mapper가 `StudentListRow -> StudentDTO`로 변환
- 도메인 타입(`IStudent`)과 join 결과(alias)를 섞지 않는다

효과: alias 변경/쿼리 수정이 타입 오류로 즉시 드러남.

### 5.5 인증 컨텍스트 모델 개선

현재 `req.account`가 “항상 존재”한다고 가정하는 전역 확장 형태는, 인증이 빠진 라우트에서도 안전장치가 약해진다.

권장:

- Express(전환 전/레거시): 인증 미들웨어에서 `res.locals.account`를 세팅하고, 보호 라우트는 `res.locals.account`만 사용한다.
- tRPC(전환 후): `createContext()`에서 `ctx.account`를 구성하고 `protectedProcedure`에서 “인증된 컨텍스트”를 타입으로 보장한다.

### 5.6 Repository의 stateful design 재고

`setPage/setSize/setTransaction` 처럼 인스턴스 상태를 계속 변경하는 패턴은 스코프가 애매해진다.

권장: 함수 인자로 명시적으로 전달한다(`findMany({ page, size, transaction })`).

---

## 6) 스케줄러(현재: API 프로세스 내)

현재 서버 트래픽이 낮고 단일 인스턴스 운영을 전제로 하므로, 스케줄러는 **분리하지 않고 API 프로세스에서 실행**한다.

주의: 향후 scale-out으로 API 인스턴스가 늘어나는 시점에는 “중복 실행”이 생길 수 있으니, 그때는 **분산 락(DB 기반 lock 등)** 을 추가하거나 별도 worker로 분리하는 방식으로 보완한다.

---

## 7) 로깅/보안(모노레포 전환 시 필수)

- 요청 body/cookie/authorization 헤더는 기본적으로 **로그에서 제외/마스킹**
- `requestId`, `account`, `status`, `latency` 위주로 구조화 로그
- `.env.example`에는 절대 실제 패스워드/토큰 형태를 넣지 말고 placeholder로 교체

---

## 8) 프론트엔드(React) 도입 설계

### Vite + React

현재 백엔드가 Express로 존재하므로, 첫 도입은 **Vite + React**가 가장 빠르고 안정적이다.

### 개발 환경(CORS)

개발 중에는 `apps/web`(예: `5173`) ↔ `apps/api`(예: `5000`) 간 CORS가 필요할 가능성이 큼.

권장: Vite dev server에서 `/trpc`(그리고 필요 시 `/api`)를 백엔드로 **proxy**해서 “동일 출처처럼” 개발한다.

- 장점: 개발 CORS 설정을 최소화할 수 있음
- 예시: `apps/web/vite.config.ts`에서 `server.proxy['/trpc'] = 'http://localhost:5000'`

prod에서는 Nginx reverse proxy로 “동일 출처”가 되도록 구성한다(정적 `/`, API `/trpc`).

---

## 9) 주말 일괄 전환(big-bang) 플랜

점진 이전을 하지 않는 대신, “주말 배포 1회”를 기준으로 준비/검증/롤백 플랜을 명확히 잡는다.

### 9.1 구현(아키텍처)

- pnpm 모노레포 전환: `apps/api`, `apps/web`, `packages/trpc` 뼈대 완성
- Express에 `/trpc` mount + tRPC `createContext()`/`protectedProcedure` 구성
- `createApp()` / `main.ts` 분리 + 중앙 에러 처리(Express 에러 미들웨어 or tRPC error formatter)
- 민감정보 마스킹/로그 정책 확정(요청 body/cookie 기본 제외)
- 테스트 런너를 Vitest로 전환하고, 통합 테스트가 “서버 listen 없이” 동작하도록 정리(`TESTING_VITEST.md`)

### 9.2 구현(기능)

- tRPC router로 핵심 기능을 “한 번에” 구현: `auth`, `account`, `group`, `student`, `attendance`, `statistics`
- 인증은 이 문서의 **11) 인증 설계(Refresh Token 확장)** 기준으로 적용
- 프론트(Vite)는 tRPC client + “access 메모리/refresh 쿠키” 갱신 로직(이 문서의 **프론트 갱신 흐름**)까지 포함

### 9.3 타입 안정성(정리)

- `TYPE_SAFETY_AUDIT.md`의 **별도 작업 필요** 항목을 우선 처리(특히 tsconfig/DB join/raw/DTO)
- “REST 전용(Result/IResponse/req 확장)”은 tRPC 전환 후 레거시가 사라지면 같이 제거/정리

### 9.4 배포 준비(런북)

- DB 변경이 있으면(예: `refresh_token` 테이블) 배포 전에 반영(DDL/마이그레이션 스크립트 준비)
- Nginx 설정: `/` 정적, `/trpc` reverse proxy(동일 출처) 확정
- 배포 파이프라인: Docker Hub(private) push/pull 확정(`DEPLOY_DOCKERHUB.md`)
- 롤백 플랜: “이전 백엔드 이미지 태그 + 이전 프론트 dist”를 항상 보관

### 9.5 주말 배포(컷오버)

- 배포 순서(권장)
    1) 백엔드 컨테이너 업데이트(새 이미지 pull + up -d)
    2) 프론트 정적 파일 교체(Nginx) + 캐시 무효화
    3) 스모크 테스트(로그인/조회/등록 등 핵심 플로우)
- 문제 발생 시: 즉시 롤백(이전 이미지/이전 dist로 되돌림)

---

## 10) 운영/배포(분리 배포)

- web: Nginx에 정적 파일 배포(Vite `dist/`)
- api: Docker 이미지 배포(컨테이너 실행)
- Nginx에서 `/`는 정적 파일, `/trpc`(그리고 필요 시 `/api`)는 API로 reverse proxy
- 백엔드 배포 파이프라인: Docker Hub(private) 기반(`DEPLOY_DOCKERHUB.md`)

---

## 11) 인증 설계(Refresh Token 확장)

목표: access token은 짧게(예: 15m~2h), refresh token은 길게(예: 14d~30d) 가져가고, refresh로 access를 재발급한다.

### 권장 저장 전략(웹 기준)

- **access token**: 기존처럼 `Authorization: Bearer <token>`로 사용(프론트는 **메모리 보관** 권장)
- **refresh token**: **HttpOnly 쿠키**로 저장(브라우저 JS에서 접근 불가)
    - prod: `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/trpc`
    - Nginx에서 HTTPS 종단(TLS termination) 전제

권장 방침:

- refresh token은 `localStorage/sessionStorage`에 **저장하지 않는다**
- access token도 가능하면 `localStorage/sessionStorage`에 저장하지 않고, **메모리 + refresh 기반 재발급**으로 UX를 만든다

> 참고: refresh token을 쿠키로 쓰면 CSRF 고려가 필요하므로, refresh는 POST로 유지하고 `SameSite`/`Origin` 체크를 같이 적용하는 편이 안전합니다.

### 프론트 갱신 흐름(권장)

프론트는 “refresh token을 직접 다루지 않고”, access token만 메모리에 들고 있는 형태로 구성한다.

1) **앱 시작(bootstrap)**  
   - `auth.refresh`를 1회 호출해서 access token을 받아 메모리에 저장  
   - refresh token은 쿠키로 자동 전송/회전되며, 프론트는 값을 읽지 않는다

2) **일반 API 호출**  
   - 메모리 access token을 `Authorization` 헤더에 붙여 호출

3) **만료/인증 실패 처리**  
   - API에서 `UNAUTHORIZED`가 오면 `auth.refresh`를 호출해 access token을 갱신  
   - 갱신 성공 시 **실패했던 요청을 1회 재시도**  
   - 갱신 실패 시 `auth.logout` 처리(쿠키 삭제 + 클라 상태 초기화)

4) **동시성(중요)**  
   - 여러 요청이 동시에 401이 날 수 있으므로 `auth.refresh`는 **single-flight(한 번만 실행)** 로 만들고, 나머지는 그 결과를 기다린 뒤 재시도한다

### tRPC 클라이언트 설정 포인트(개요)

- refresh cookie를 사용한다면, `auth.refresh/logout` 요청에 쿠키가 포함되어야 한다.
    - **동일 출처**(Nginx가 `/trpc`를 proxy): 기본 설정으로도 쿠키가 함께 전송되는 편
    - **교차 출처**(별도 도메인 직접 호출): tRPC link의 `fetch`에 `credentials: 'include'` 설정 + 서버 CORS 정책 필요

### 토큰 회전(rotation) + 폐기(revoke)

refresh token은 “1회 사용 시 교체”를 기본으로 두면 유출/탈취 대응이 쉬워진다.

- `auth.login`: access + refresh 발급(기존 refresh는 필요 시 revoke)
- `auth.refresh`: refresh 검증 → **새 refresh로 교체(rotate)** + 새 access 발급
- `auth.logout`: refresh revoke + 쿠키 삭제

### 서버 저장소(권장: allow-list 방식)

refresh token을 DB에 저장해 “폐기/추적/강제 로그아웃”이 가능하도록 한다.

- 테이블 예시: `refresh_token`
    - `id`(PK), `account_id`(FK)
    - `token_hash`(원문 저장 금지)
    - `expires_at`, `revoked_at`, `replaced_by_token_hash`
    - `created_at`, `created_ip`, `user_agent`(선택)

### tRPC에서의 구현 포인트(개요)

- `createContext()`에서 access token(Authorization header) / refresh token(HttpOnly cookie)을 각각 파싱해 `ctx` 구성
- `protectedProcedure`는 `ctx.account`가 있을 때만 통과
- `auth.*` router는 `publicProcedure`로 두되, `refresh/logout`는 refresh cookie가 있어야 동작하도록 설계
