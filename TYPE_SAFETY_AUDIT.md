# Type Safety Audit (타입 안정성 진단)

작성일: 2025-12-19  
범위: `src/`, `test/` (TypeScript Express + Sequelize)
기준 커밋(작성 시점): `cf7a9a7`

후속 로드맵: `ARCHITECTURE_MONOREPO.md` (pnpm 모노레포 + Vite + tRPC + 백엔드 아키텍처 개선)

권장 작업 순서: **아키텍처 → 타입 안정성 → 배포**  
이 문서는 그 중 “타입 안정성” 단계의 체크리스트 역할을 합니다.

## TL;DR

현재 프로젝트는 `tsconfig.json`에서 `strict`를 켜두었지만, 핵심 옵션인 `noImplicitAny`/`strictNullChecks`를 명시적으로 꺼둔 상태라 “엄격 모드”의 이점을 대부분 잃고 있습니다. 또한 `any`/lint disable/DTO 생성 방식(Builder + prune) 때문에 **런타임 데이터 형태와 타입 선언이 어긋나도 컴파일 단계에서 막기 어려운 구조**입니다.

### 신호(정량, 현재 코드 기준)

- `src/` + `test/` 기준 `any` 키워드 사용: **106회**
- `as any` 사용: **2회**
- 파일 단위 `/* eslint-disable @typescript-eslint/no-explicit-any */`: **16곳**
- `test/integration`에는 `any`/`as any` 사용이 사실상 없음(상대적으로 양호)

---

## 0) tRPC/아키텍처 전환 시 “해결/부분 해결/별도 작업” 분류

이 진단은 현재 `src/`(Express REST) 구조 기준입니다. `ARCHITECTURE_MONOREPO.md`의 계획대로 **tRPC + Vite + pnpm 모노레포**로 전환하면, 타입 안정성 이슈 중 일부는 “HTTP 경계에서 자연스럽게 해소”되지만, DB/도메인/tsconfig 영역은 그대로 남습니다.

파일 경로/라인 표기는 `cf7a9a7` 기준 스냅샷이므로, 모노레포 이동 후에는 아래처럼 “패턴 검색”으로 위치를 다시 찾는 방식이 더 안정적입니다.

```bash
rg -n "eslint-disable @typescript-eslint/no-explicit-any" .
rg -n "\\bany\\b" src test
rg -n "Result\\.fail" .
rg -n "findAndCountAll\\(where: any\\)" .
rg -n "raw:\\s*true" .
```

아래 분류는 본 문서의 섹션 번호 기준입니다.

### 해결/대체(신규 API 기준)

- **3) 응답 타입이 사실상 검증되지 않음**: `Result`/빈 `IResponse` 대신 tRPC procedure의 output 타입으로 대체(에러는 `TRPCError`로 일원화 가능)
- **6) Express Request 타입 확장이 전역(required)**: `req.account` 주입 패턴 대신 tRPC `ctx` + `protectedProcedure`로 “인증된 컨텍스트”를 타입으로 표현
- **8) Controller 요청 파라미터/바디 검증 부재**: `req.body` 직접 사용 대신 procedure input을 `zod`로 런타임 검증

> 주의: 주말 일괄 전환(big-bang)으로 REST를 제거한다면 병행 기간이 거의 없을 수 있지만, 전환 전까지는 해당 이슈가 그대로 남습니다.

### 부분 해결(전환과 함께 정리 권장)

- **7) JWT 디코딩 결과 타입 불명확**: tRPC `createContext()`에서 `DecodedToken`/`AccountContext`를 고정하면 “사용부”는 좋아지지만, `jwt.verify` 반환 타입 narrowing/타입 패키지 정리는 여전히 필요
- **2) `any` 전파**: controller 레이어의 `req/res` 중심 `any`는 줄지만, 서비스/레포에서 `any`가 남아있으면 tRPC로도 그대로 전파됨

### 별도 작업 필요(tRPC 전환과 무관)

- **1) tsconfig에서 `strict`가 사실상 무력화됨**: `noImplicitAny`, `strictNullChecks`는 별도 작업으로 반드시 적용 필요(이번 전환을 일괄로 가져간다면 한 번에 켜고 컴파일 에러를 정리)
- **4) DTO/Builder 패턴(Builder + prune)**: 필수 필드 누락/삭제 가능성은 별도 리팩터링 필요
- **5) Sequelize join/raw 결과가 `any`**: join 결과 전용 타입/매퍼 도입은 별도 작업 필요(도메인 타입과 분리)

### tRPC 전환 시 새롭게 생기는 체크 포인트(권장)

- `createContext()`에서 `ctx.account`의 optional/required 경계를 명확히 하고, `protectedProcedure`에서 타입이 “좁혀지는” 형태로 설계
- refresh token(HttpOnly 쿠키) 확장 시, `ctx`에 “세션/토큰 상태”를 어디까지 넣을지(예: `ctx.account`, `ctx.refreshTokenId`)를 타입으로 고정
- (선택) `superjson` 등 transformer를 쓸 경우, 서버/클라 설정을 한 번에 맞춰 직렬화 이슈(Date 등)를 예방

---

## 1) 설정 레벨: `strict`가 사실상 무력화됨

### 문제

- `tsconfig.json:10` `"strict": true`
- 하지만 아래 옵션을 명시적으로 꺼서(override) `strict`의 핵심 효과가 사라집니다.
    - `tsconfig.json:11` `"noImplicitAny": false`
    - `tsconfig.json:12` `"strictNullChecks": false`

### 영향

- 타입이 누락된 매개변수/리턴이 **implicit `any`**로 통과 → 타입 오류가 “빨리” 드러나지 않음
- `null/undefined`가 광범위하게 허용되어 런타임 NPE/undefined access가 숨어들기 쉬움

---

## 2) `any`가 “경계(boundary)”가 아니라 “전파(carrier)”로 쓰임

타입 안정성을 낮추는 가장 큰 패턴은 **DB/외부 입력 경계에서 `any`로 무너지고, 이후 레이어로 계속 전파되는 구조**입니다.

### 2.1 Repository/Base 계층에서 타입이 붕괴

- `src/common/base/base.repository.ts:41`
  `findAndCountAll(where: any): Promise<{ rows: any; count: number }>`
- `src/common/base/base.repository.ts:43`/`src/common/base/base.repository.ts:44`
  `create(param)` / `update(param)` 파라미터가 무타입

→ Repository 레이어에서 `any`가 된 결과가 Service/Controller까지 그대로 올라옵니다.

### 2.2 Service/Base 계층에서도 입력 타입이 붕괴

- `src/common/base/base.service.ts:25`/`src/common/base/base.service.ts:26`
  `add(param)` / `modify(param)` 파라미터가 무타입
- `src/api/student/student.service.ts:24` `setWhere(...): Promise<any>`
- `src/api/student/student.service.ts:79` `findAll(where: any)`

---

## 3) 응답 타입이 사실상 검증되지 않음

### 3.1 `Result`가 `any` 중심 + 시그니처/사용 불일치

- `src/common/result.ts:8` `public error: any`
- `src/common/result.ts:26`/`src/common/result.ts:37` `toJson(): any`
- `src/common/result.ts:49` `Result.fail<U>(error: string)`인데,
  실제 사용은 `Result.fail<ApiError>(e)`처럼 `ApiError`/객체를 넘깁니다(예: `src/api/student/student.controller.ts:47`).

이 불일치는 `catch (e: any)` 패턴 때문에 컴파일 단계에서 드러나지 않습니다(= `any`가 잘못된 API 사용을 숨김).

### 3.2 `IResponse`가 빈 인터페이스

- `src/@types/response.d.ts:4` `export interface IResponse { /* empty */ }`

예를 들어 `src/api/student/student.controller.ts:39`처럼 `Result.ok<IResponse>({...})`를 많이 쓰지만, `IResponse`가 비어있어서 **응답 shape를 전혀 강제하지 못합니다.**

---

## 4) DTO/Builder 패턴이 타입-런타임 불일치를 숨김

이 프로젝트의 DTO 구성은 `builder-pattern` + `prune()` 조합인데, 이 조합은 “타입상 필수”가 “런타임에서는 누락”되기 쉬운 구조입니다.

### 4.1 `Builder<T>()`는 필수 필드 누락을 쉽게 통과시킬 수 있음

`Builder<T>()`는 보통 모든 setter가 선택적이라, `T`에서 필수인 필드를 누락해도 `build()`가 `T`를 반환하는 형태가 되기 쉽습니다(라이브러리 구현 특성상).

### 4.2 `prune(any)`가 필드 삭제 후 `any`로 반환

- `src/lib/utils.ts:2` `prune(obj: any)`는 `undefined/null` 키를 삭제하고 `any`로 반환합니다.
- DTO에서 `prune(build)`를 사용하면, 타입상 필수 필드라도 런타임에서는 제거될 수 있습니다.

#### 예시 A: Student의 `groupName` (타입과 실제 생성 경로 불일치)

- 타입은 필수: `src/@types/student.d.ts:10` `groupName: string`
- DTO에서는 세팅하지 않음: `src/common/dto/student.dto.ts:13`~`src/common/dto/student.dto.ts:25`
- 리스트 조회에서만 별도 주입: `src/api/student/student.service.ts:86` `student.groupName = item.group_name`

→ “어떤 API에서는 `groupName`이 있고, 어떤 API에서는 없을 수 있는” 형태인데, 타입은 항상 있다고 가정합니다.

#### 예시 B: Token의 `refreshToken` (타입은 필수인데 실제로는 optional)

- 타입은 필수: `src/@types/token.d.ts:4` `refreshToken: string`
- DTO 생성자는 optional: `src/common/dto/token.dto.ts:10` `refreshToken?: string`
- `prune`로 `refreshToken`이 제거될 수 있음

---

## 5) Sequelize join/raw 결과가 `any`로 처리됨 (대표적인 타입 구멍)

### 문제

- `src/api/student/student.repository.ts:22` `findAndCountAll(where: any): Promise<{ rows: any; count: number }>`
- 해당 쿼리는 `raw: true` + alias 컬럼(`group_name`)을 포함합니다: `src/api/student/student.repository.ts:31`~`src/api/student/student.repository.ts:45`
- 서비스에서 `rows`를 `any`로 받고, `item.group_name`를 이용해 DTO에 필드를 주입합니다: `src/api/student/student.service.ts:84`~`src/api/student/student.service.ts:88`

### 영향

- `rows`의 실제 shape가 변경되어도(쿼리 attribute 수정/alias 변경 등) 컴파일 단계에서 영향이 거의 추적되지 않음
- “join 결과에서만 존재하는 필드”를 도메인 타입에 섞어 넣는 구조라 타입 모델링이 어려워지고, 결국 `any`에 기대게 됨

---

## 6) Express Request 타입 확장이 전역(required)이라 불안정

- `src/@types/express.d.ts:14`에서 `req.decodeToken`, `req.account`를 **전역 Request에 필수 필드로 추가**했습니다.

이 방식은 타입 편의성은 높지만 아래 문제가 있습니다.

- 인증 미들웨어가 적용되지 않은 라우트에서도 타입상 `req.account`가 “항상 존재”로 간주됨
- 실수로 보호되지 않은 라우트에서 `req.account`를 사용해도 컴파일이 막지 못함(런타임 오류 가능)

---

## 7) JWT 디코딩 결과 타입이 불명확(사실상 `any`로 흐르기 쉬움)

- `package.json`에 `@types/jsonwebtoken`가 없고, 실제 `node_modules/@types`에도 존재하지 않습니다(= 이 프로젝트에서 `jsonwebtoken` 타입이 빈약할 가능성이 큼).
- `src/api/token/token.service.ts:48` `decodeToken()`이 구체 타입 없이 `jwt.verify(...)` 결과를 반환하고,
  `src/api/auth/auth.middleware.ts:34`에서 그 값을 `req.decodeToken`에 주입합니다.

→ 토큰 payload shape 변경이 타입 시스템으로 안전하게 전파/검증되기 어렵습니다.

---

## 8) Controller에서 요청 파라미터/바디가 런타임 스키마 검증 없이 사용됨

현재 controller는 `req.params`/`req.query`/`req.body`에서 값을 꺼내(예: `src/api/student/student.controller.ts:24`, `src/api/student/student.controller.ts:92`) `Builder<...>()`로 DTO를 만들고 서비스로 넘깁니다.

문제는 다음과 같습니다.

- Express 기본 타입에서 `req.query`는 `string | ParsedQs | string[] | ParsedQs[]` 계열이라, `String(...)` 캐스팅(`src/api/student/student.controller.ts:35`)으로 빠르게 “string化”되며 타입 정보가 손실됨
- `req.body`는 런타임 입력이므로 스키마(런타임 검증)가 없으면 타입 선언만으로 안전해지지 않음

---

## 개선 우선순위(권장)

아래는 “타입 안정성을 올리는 순서”입니다.  
`ARCHITECTURE_MONOREPO.md`처럼 tRPC로 주말 일괄 전환(big-bang)한다면, **2)·5)(REST 전용)** 은 레거시 REST를 유지할 때만 필요하고, 그 외 항목(1/3/4/6)은 전환과 무관하게 그대로 필요합니다.

1) **tsconfig 정상화**
   - 목표: `noImplicitAny: true`, `strictNullChecks: true`
   - 전환을 일괄로 진행한다면 한 번에 켜고 컴파일 에러를 정리하는 편이 깔끔합니다(부담이 크면 `tsconfig.strict.json`으로 점진 적용도 가능).

2) **응답 모델 고정(REST 유지 시)**
   - `src/@types/response.d.ts`를 실제 응답 구조로 정의(예: `ApiResponse<T>`)
   - `src/common/result.ts`에서 `Result.fail` 시그니처와 실제 사용을 일치시키고, `toJson()` 반환 타입을 고정
   - (tRPC 전환 시) 신규 API는 `Result/IResponse` 대신 procedure output 타입 + `TRPCError`로 대체 가능

3) **DTO 생성 방식에서 타입 구멍 제거**
   - `Builder<T>() + prune(any)` 조합은 타입 안정성을 크게 낮추는 원인입니다.
   - 최소한 `prune`를 제네릭으로 바꾸고(`prune<T>(obj: T): T`), “필수 필드가 삭제되는 구조”를 없애는 방향이 필요합니다.

4) **DB 경계 타입 정의(특히 join/raw)**
   - `findAndCountAll`의 `rows`를 `any` 대신 명시 interface로 정의(예: `StudentListRow`)
   - alias(`group_name`)는 join 결과 전용 타입으로 분리하고, 도메인 타입(`IStudent`)과 섞지 않도록 정리

5) **Express Request 전역 확장 정리(REST 유지 시)**
   - `req.account`/`req.decodeToken`를 optional로 바꾸거나, 인증된 요청 타입을 별도로 만들어 controller 시그니처에서 사용
   - (tRPC 전환 시) `req` 확장 대신 `createContext()`/`protectedProcedure`로 인증 컨텍스트를 모델링

6) **JWT 타입 도입/고정**
   - `decodeToken()` 반환 타입을 명확히 정의(예: `DecodedToken`)
   - 가능하면 `@types/jsonwebtoken` 추가 및 `jwt.verify`의 반환을 안전하게 narrowing

---

## 참고: 파일 단위로 `no-explicit-any`를 비활성화한 목록

아래 파일들은 파일 상단에서 `/* eslint-disable @typescript-eslint/no-explicit-any */`로 `any` 사용을 전역 허용합니다(타입 전파의 시작점이 되기 쉬움).

- `src/env.ts`
- `src/lib/logger.ts`
- `src/api/student/student.repository.ts`
- `src/api/student/student.service.ts`
- `src/common/base/base.service.ts`
- `src/common/base/base.repository.ts`
- `src/common/result.ts`
- `src/api/group/group.repository.ts`
- `src/api/group/group.service.ts`
- `src/api/attendance/attendance.repository.ts`
- `src/api/attendance/attendance.service.ts`
- `src/api/statistics/statistics.repository.ts`
- `src/api/statistics/statistics.service.ts`
- `src/common/builder/attendance.builder.ts`
- `src/@types/json.d.ts`
- `src/@types/response.d.ts`
