# Testing Plan: Vitest (Express + tRPC)

목표: 기존 `mocha/chai` 기반 테스트를 **Vitest**로 전환해 ESM 친화적인 개발 환경을 만들고, 모노레포(pnpm + turbo) 목표 아키텍처와 정합성 있게 테스트 체계를 정리한다.

관련 문서:
- `ARCHITECTURE_MONOREPO.md`
- `TYPE_SAFETY_AUDIT.md`
- `DEPLOY_DOCKERHUB.md`

권장 작업 순서: **아키텍처 → 타입 안정성 → 배포**

---

## 0) 확정 사항

- Test runner: **Vitest**
- Assertion: **Vitest `expect`** (Chai 미사용)
- 통합 테스트(HTTP): **Supertest 유지**
- tRPC 전환 후: **tRPC `createCaller` 기반 테스트 + 최소한의 HTTP 스모크 테스트** 병행
- 병렬성: **기본은 단일 워커(순차 실행)** (공유 DB/공유 상태 충돌 방지)

---

## 1) (중요) 현재 구조에서 Vitest 전환 시 막히는 지점

Vitest는 테스트 파일을 워커(threads/forks)로 실행할 수 있고, import side-effect에 더 민감하게 반응한다. 현재 구조에서 아래가 남아있으면 테스트가 쉽게 “멈추거나(hang)” “서로 깨진다”.

1) **서버 부트스트랩 side-effect**
   - `app.listen`, DB connect, scheduler start가 “import 시점”에 실행되면, 테스트는 포트를 점유하거나 프로세스가 종료되지 않을 수 있다.

2) **스케줄러(node-schedule)가 이벤트 루프를 붙잡음**
   - 테스트에서 스케줄러가 살아있으면 종료가 지연/실패할 수 있다.

3) **테스트 간 공유 상태(`memory-cache`)**
   - 파일 간 공유 key(토큰/ID)를 전역 캐시에 저장하면, Vitest 병렬 실행에서 충돌할 수 있다.

---

## 2) 목표 상태(모노레포 기준)

`ARCHITECTURE_MONOREPO.md`의 구조를 기준으로 테스트가 “서버 listen 없이” 동작하게 만든다.

```
apps/
  api/
    src/
      app.ts     # createApp()만 export (listen 금지)
      main.ts    # listen/DB connect/scheduler start
    test/
      vitest.setup.ts
      integration/*.test.ts
```

핵심 원칙:
- 테스트는 `createApp()`으로 Express 인스턴스만 받아서 `supertest(app)`로 호출한다.
- 스케줄러는 `main.ts`에서만 시작하고, `NODE_ENV=test`에서는 비활성화한다.
- DB 연결/정리는 Vitest의 `setup/teardown`에서 처리한다.

---

## 3) 전환 계획(주말 big-bang 기준)

### 3.1 1단계(아키텍처): Composition Root 분리

- `createApp()` / `main.ts` 분리
  - `createApp()`은 **라우팅/미들웨어 등록만** 담당
  - `main.ts`는 **listen + DB connect + scheduler start** 담당
- scheduler는 **테스트에서 실행되지 않도록** `NODE_ENV !== 'test'` 같은 조건으로 가드
- DB connect/disconnect를 테스트 setup에서 제어 가능하게 노출

완료 기준:
- 테스트에서 서버 포트가 열리지 않는다.
- 테스트 종료 시 프로세스가 정상 종료된다.

### 3.2 2단계(테스트 도구): Vitest 설정

- (모노레포 기준) `apps/api`에 Vitest 의존성/스크립트 추가
- `vitest.config.ts` 작성
  - Node 환경, `setupFiles` 지정
  - 통합 테스트 충돌 방지를 위해 **단일 워커/순차 실행**으로 설정
  - `@/*` alias는 `tsconfig` 기반으로 해결
- `vitest.setup.ts`
  - `NODE_ENV=test` 보장
  - DB connect(필요 시) 및 afterAll에서 close

완료 기준:
- “빈 테스트 1개”가 안정적으로 실행/종료된다.

### 3.3 3단계(테스트 코드): Mocha/Chai → Vitest

- `describe/it/beforeAll/afterAll/expect`를 `vitest`에서 import
- Chai 플러그인(`chai-like`, `chai-things`, `chai-subset`) 의존을 제거
  - 필요한 비교는 `expect.objectContaining`, `expect.arrayContaining` 등으로 대체
  - “키 일치” 같은 규칙은 작은 helper로 대체
- `memory-cache` 기반 공유 상태는 제거하고, 각 파일에서 `let accessToken`, `let groupId` 같은 **file-scoped 변수**로 관리

완료 기준:
- 기존 `test/integration/*.test.ts` 시나리오가 Vitest에서 동일하게 통과한다.

### 3.4 4단계(tRPC 전환 후): 테스트 레벨 재정의

- 빠른 테스트: tRPC `createCaller`로 router를 HTTP 없이 호출(컨텍스트/권한 테스트에 유리)
- 운영 안전망: `/trpc` 엔드포인트 대상으로 최소 스모크 테스트 유지(로그인/조회/등록 정도)

완료 기준:
- 핵심 비즈니스 로직은 `createCaller` 수준에서 빠르게 검증 가능
- HTTP는 “배포 전 스모크”로 최소 유지

---

## 4) Done Criteria(최종)

- `pnpm test`(또는 turbo 경유)가 CI에서 안정적으로 통과
- 테스트 실행 중 `listen`이 발생하지 않음(포트 점유 없음)
- 테스트 종료 후 프로세스 hang 없음(스케줄러/DB 정리 포함)
- 테스트 간 공유 상태/순서 의존이 최소화됨(병렬 실행으로 확장 가능해짐)

