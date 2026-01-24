# CLAUDE.md

> **용도**: 프로젝트 전체 개요, 모노레포 구조, 공통 명령어
> **언제 읽나**: 프로젝트 처음 접근 시, 전체 구조 파악 필요 시
> **스킵 조건**: 특정 앱/패키지 작업 시 (해당 폴더의 CLAUDE.md 참조)

Claude Code (claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드 문서입니다.

## Project Overview

**출석부 프로그램** - 주일학교 출석 관리를 위한 TypeScript 풀스택 애플리케이션입니다.

### 주요 기능
- **로그인**: 계정별 로그인 및 그룹 관리
- **그룹 관리**: 주일학교 학생 그룹 CRUD
- **학생 명단**: 학생 정보 CRUD
- **출석부**: 출석 기록 CRUD
- **통계**: 출석 현황 통계 조회

### 도메인 엔티티 구조
```
Account (계정) -> Group (그룹) -> Student (학생) -> Attendance (출석)
```

## Monorepo Structure

pnpm workspace + Turborepo 기반 모노레포 구조입니다.

```
school_back/
├── apps/
│   ├── api/              # Express + tRPC API 서버 (@school/api)
│   └── web/              # Vite + React 웹 앱 (@school/web)
├── packages/
│   ├── trpc/             # 공유 tRPC 타입/라우터 (@school/trpc)
│   └── utils/            # 공유 유틸리티 함수 (@school/utils)
├── docs/specs/           # SDD 문서
├── turbo.json            # Turborepo 설정
├── pnpm-workspace.yaml   # pnpm workspace 설정
└── tsconfig.build.json   # 루트 빌드용 TS Project References
```

### 패키지 의존성
```
@school/api → @school/trpc, @school/utils
@school/web → @school/trpc, @school/utils
```

### 영역별 CLAUDE.md

| 경로                         | 설명                     |
|----------------------------|------------------------|
| `docs/business/CLAUDE.md`  | 사업 에이전트 가이드            |
| `docs/specs/CLAUDE.md`     | PM/SDD 워크플로우, 문서 작성 규칙 |
| `apps/api/CLAUDE.md`       | API 서버 아키텍처, 패턴, DB    |
| `apps/web/CLAUDE.md`       | 웹 앱 구조, 라우팅, 컴포넌트      |
| `packages/trpc/CLAUDE.md`  | tRPC 라우터 작성 규칙         |
| `packages/utils/CLAUDE.md` | 공유 유틸리티 함수             |

## Development Environment

| 항목      | 버전           | 비고                           |
|---------|--------------|------------------------------|
| Node.js | **>=24.0.0** | ESM, import assertions 지원 필수 |
| pnpm    | >=10.0.0     | workspace 사용                 |

### 버전 관리
- `.nvmrc`: Node.js 버전 명시 (`nvm use` 자동 적용)
- `package.json#engines`: 런타임 버전 검증

```bash
# Node.js 버전 확인 및 설정
nvm use              # .nvmrc 기준 자동 설정
node --version       # v24.x.x 확인
```

## Related Documents

| 문서                          | 설명                        |
|-----------------------------|---------------------------|
| `README.md`                 | 프로젝트 소개, ERD, 개발 히스토리     |
| `docs/business/README.md`   | 사업 문서 인덱스 (로드맵, 지표, 가격 등) |
| `docs/specs/README.md`      | SDD 인덱스 (아키텍처/로드맵 포함)     |
| `docs/specs/WORKFLOW.md`    | SDD 워크플로우 (작성자 + 검수자)     |

## Commands (Root)

```bash
# 전체 빌드/실행
pnpm build              # 모든 패키지 빌드 (turbo)
pnpm dev                # 모든 앱 개발 서버 (병렬)
pnpm start              # 프로덕션 서버 시작
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
- `start` 태스크는 `^build` 의존 (빌드 선행 보장)
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
