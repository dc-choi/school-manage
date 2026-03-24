# CLAUDE.md

Claude Code가 이 저장소에서 작업할 때 참고하는 가이드 문서입니다.

## Project Overview

**출석부 프로그램** - 주일학교 출석 관리를 위한 TypeScript 풀스택 애플리케이션입니다.

### 주요 기능
- **인증**: 로그인, 회원가입, 개인 계정 + 본당/모임 합류
- **모임 관리**: 교구/본당/모임 계층, 합류 요청 승인/거부
- **학년 관리**: 학년/부서 CRUD, 학생 일괄 추가/제거
- **학생 관리**: 학생 정보 CRUD, 다중 그룹 소속 (N:M)
- **출석부**: 출석 기록 CRUD
- **통계**: 출석 현황 통계 조회

### 도메인 엔티티 구조
```
Parish (교구) -> Church (본당) -> Organization (모임)
Organization -> Account (계정), Group (학년), Student (학생)
Student <-> Group (N:M via StudentGroup)
Student -> Attendance (출석)
```

## Monorepo Structure

pnpm workspace + Turborepo 기반 모노레포 구조입니다.

```
school_back/
├── apps/
│   ├── api/              # Express + tRPC API 서버 (@school/api)
│   └── web/              # Vite + React 웹 앱 (@school/web)
├── packages/
│   ├── shared/           # 도메인 공유 상수/타입/스키마 (@school/shared)
│   ├── trpc/             # tRPC 인프라 (@school/trpc)
│   └── utils/            # 공유 유틸리티 함수 (@school/utils)
├── docs/
│   ├── business/         # 사업 문서
│   ├── guides/           # 설정 가이드 (GA4 등)
│   └── specs/            # SDD 문서
├── turbo.json            # Turborepo 설정
├── pnpm-workspace.yaml   # pnpm workspace 설정
└── tsconfig.build.json   # 루트 빌드용 TS Project References
```

### 패키지 의존성
```
@school/shared ← zod (도메인 상수, Zod 스키마, Input/Output 타입)
@school/trpc   ← @school/shared (tRPC router, procedures, middleware, context)
@school/api    ← @school/shared, @school/trpc, @school/utils
@school/web    ← @school/shared, @school/trpc, @school/utils, AppRouter(api, type-only)
```

### 경로별 Rules

| 경로 패턴               | Rules 파일            | 설명                                 |
|---------------------|---------------------|------------------------------------|
| `apps/api/**`       | `rules/api.md`      | API 서버 아키텍처, UseCase 패턴, DB        |
| `apps/web/**`       | `rules/web.md`      | 웹 앱 구조, 라우팅, tRPC 클라이언트            |
| `apps/web/**`       | `rules/design.md`   | UI/UX 디자인 가이드, shadcn/ui, Tailwind |
| `packages/shared/**`| `rules/shared.md`   | 도메인 상수, 타입, Zod 스키마               |
| `packages/trpc/**`  | `rules/trpc.md`     | tRPC 인프라 (router, procedures)      |
| `packages/utils/**` | `rules/utils.md`    | 공유 유틸리티 함수                         |
| `docs/business/**`  | `rules/business.md` | 사업 에이전트 가이드                        |
| `docs/specs/**`     | `rules/specs.md`    | SDD 워크플로우, 문서 작성 규칙               |

## Development Environment

| 항목      | 버전           | 비고                           |
|---------|--------------|------------------------------|
| Node.js | **>=24.0.0** | ESM, import assertions 지원 필수 |
| pnpm    | >=10.0.0     | workspace 사용                 |

```bash
nvm use              # .nvmrc 기준 자동 설정
node --version       # v24.x.x 확인
```

## Environment Variables

선택적 환경변수입니다. 미설정 시 해당 기능이 비활성화됩니다.

### CORS

| 패키지           | 변수명          | 용도                              |
|---------------|--------------|----------------------------------|
| `@school/api` | `CORS_ORIGIN` | 허용할 웹 origin (미설정 시 same-origin) |

### GA4 Analytics

| 패키지           | 변수명                       | 용도                               |
|---------------|---------------------------|----------------------------------|
| `@school/api` | `GA4_MEASUREMENT_ID`      | GA4 측정 ID                        |
| `@school/api` | `GA4_API_SECRET`          | GA4 Measurement Protocol API 시크릿 |
| `@school/web` | `VITE_GA4_MEASUREMENT_ID` | GA4 측정 ID (클라이언트)                |

### SMTP (회원가입 알림)

| 패키지           | 변수명         | 용도                |
|---------------|-------------|-------------------|
| `@school/api` | `SMTP_USER` | Gmail 계정          |
| `@school/api` | `SMTP_PASS` | Gmail 앱 비밀번호 (16자리) |
| `@school/api` | `ADMIN_EMAIL` | 운영자 수신 주소        |

> **Note**: 환경변수 미설정 시 해당 기능이 비활성화됩니다 (앱 정상 동작).

### 보안 참고

- **CORS**: `CORS_ORIGIN` 미설정 시 same-origin만 허용 (`apps/api/src/app.ts`)
- **Rate Limiting**: 전체 API 100회/분, 인증 엔드포인트 10회/분 (IP 기준, `express-rate-limit`)

## Commands (Root)

```bash
# 전체 빌드/실행
pnpm build              # 모든 패키지 빌드 (turbo)
pnpm dev                # 모든 앱 개발 서버 (병렬)
pnpm start              # 프로덕션 서버 시작
pnpm test               # 모든 패키지 테스트 실행
pnpm typecheck          # 타입 체크

# 코드 품질
pnpm lint               # ESLint 검사
pnpm lint:fix           # ESLint 자동 수정
pnpm prettier           # Prettier 검사
pnpm prettier:fix       # Prettier 자동 수정

# 정리
pnpm clean              # dist 및 node_modules 정리

# 루트 빌드 (Project References)
tsc -b -v tsconfig.build.json   # 전체 의존성 순서대로 빌드
```

## Build System

### Turborepo
- `turbo.json`에서 태스크 의존성 정의
- `start` 태스크는 `^build`, `^start` 의존 (빌드 선행 보장)
- `dev` 태스크는 `@school/shared#build`, `@school/trpc#build` 의존
- 캐시: `.turbo/cache/`

### TypeScript Project References
- `composite: true` 활성화됨
- `tsBuildInfoFile`: `dist/tsconfig.tsbuildinfo`
- 빌드 모드: `tsc -b` (증분 빌드)

### 패키지 버전 관리
- `pnpm-workspace.yaml`의 `catalog:`로 공통 devDependencies 버전 통일
- workspace 패키지: `"@school/trpc": "workspace:*"`

## Coding Style

- **Indentation**: 4 spaces
- **Quotes**: Single quotes (`.prettierrc` 참조)
- **Semicolons**: 사용
- **함수 선언**: 화살표 함수 사용 (React 컴포넌트, 클래스 메서드 제외)

## Commit & Branch Conventions

### Commit 단위
- **기능 단위 커밋**: 하나의 커밋에 하나의 기능만 포함
- 여러 기능이 변경된 경우 기능별로 분리하여 커밋

### Commit Message
```
학생목록 검색 기능 추가
fix: 버그 수정 설명
docs: 문서 수정 설명
```

### Branch Naming
```
feature/<short-desc>
fix/<short-desc>
```

## 문서 크기 제한

- **모든 문서 파일**(.md, rules, specs, business 등)은 **190줄을 초과하지 않는다.**
- 150줄 이상이면 분리를 검토하고, 190줄을 넘으면 논리적 섹션 기준으로 분리한다.
- 분리 시 상호 참조를 명시한다.

## Agent Preferences

- **커밋 단위**: 기능 단위로 커밋. 하나의 커밋에 하나의 기능만 포함.
- **SDD 5단계 테스트**: 구현 후 테스트 작성/실행까지 자동으로 진행할 것. 사용자가 별도로 요청하지 않아도 5단계 구현 순서(Backend → Frontend → 테스트)를 반드시 준수.
- **"무료" 표현 사용 금지**: 프로덕트 코드, 콘텐츠 모두에서 "무료"를 쓰지 않는다. (예: "무료로 시작하기" → "바로 시작하기")
- **콘텐츠 작성 시 제품 실제 동작을 먼저 파악**한 후 작성한다. 추측으로 없는 기능을 넣지 않는다.

## CSS/Tailwind 주의사항

- `globals.css`의 글로벌 리셋(`* { margin: 0 }`)은 반드시 `@layer base` 안에 위치해야 함. un-layered 스타일은 Tailwind utilities 레이어보다 우선순위가 높아서 `space-y-*`, `mt-*` 등 margin 기반 유틸리티가 무시됨
- `space-y-*`가 안 먹힐 때 → CSS Cascade Layers 우선순위 문제 의심. `gap-*`은 컨테이너 속성이라 영향 안 받음

## Related Documents

| 문서                        | 설명                        |
|---------------------------|---------------------------|
| `README.md`               | 프로젝트 소개, ERD, 개발 히스토리     |
| `docs/business/README.md` | 사업 문서 인덱스 (로드맵, 지표, 가격 등) |
| `docs/guides/ga4-setup.md`| GA4 설정 가이드               |
| `docs/specs/README.md`    | SDD 인덱스 (아키텍처/로드맵 포함)     |
| `.mcp.json`               | MCP 서버 설정 (Stitch UI 프로토타이핑) |
