# CLAUDE.md

Claude Code가 이 저장소에서 작업할 때 참고하는 가이드 문서입니다.
프로젝트 소개와 ERD는 @README.md 참조.

## Project Overview

**출석부 프로그램** - 주일학교 출석 관리를 위한 TypeScript 풀스택 애플리케이션입니다.
pnpm workspace + Turborepo 기반 모노레포 (apps/api, apps/web, packages/shared·trpc·utils).

### 도메인 엔티티 구조
```
Parish (교구) -> Church (본당) -> Organization (모임)
Organization -> Account (계정), Group (학년), Student (학생)
Student <-> Group (N:M via StudentGroup)
Student -> Attendance (출석)
```

## Development Environment

| 항목      | 버전           | 비고                           |
|---------|--------------|------------------------------|
| Node.js | **>=24.0.0** | ESM, import assertions 지원 필수 |
| pnpm    | >=10.0.0     | workspace 사용                 |

```bash
nvm use              # .nvmrc 기준 자동 설정
```

## Commands (Root)

```bash
pnpm build              # 모든 패키지 빌드 (turbo)
pnpm dev                # 모든 앱 개발 서버 (병렬)
pnpm start              # 프로덕션 서버 시작
pnpm test               # 모든 패키지 테스트 실행
pnpm typecheck          # 타입 체크
pnpm lint               # ESLint 검사
pnpm lint:fix           # ESLint 자동 수정
pnpm prettier           # Prettier 검사
pnpm prettier:fix       # Prettier 자동 수정
pnpm clean              # dist 및 node_modules 정리
tsc -b -v tsconfig.build.json   # 전체 의존성 순서대로 빌드
```

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
- **코드베이스 탐색 시 subagent 활용**: 여러 파일을 읽거나 넓은 범위를 조사할 때는 subagent에 위임하여 메인 컨텍스트를 보호한다. 단순한 파일 1~2개 조회는 직접 수행.
- **Plan Mode 사용 기준**:
    - 필수: 새 도메인/엔티티 추가, DB 스키마 변경, 3개 이상 파일 수정, 아키텍처/패키지 구조 변경.
    - 불필요: 오타/단일 파일 소규모 수정, 기존 패턴을 그대로 따르는 단순 추가, 문서만 수정, 명백한 버그 1줄 수정.
    - 판단이 애매하면 Plan Mode 먼저 → 승인 후 Implement.

## 파일 보호

### PreToolUse 파일 보호 Hook

`.claude/hooks/protect-files.sh` 가 Edit/Write 시 아래를 차단:
- `.env`, `.env.local`, `.env.test` 등 (단, `.example` 허용)
- `pnpm-lock.yaml`, `package-lock.json`, `yarn.lock`
- `apps/api/prisma/migrations/*/migration.sql` (스키마 변경은 `/prisma-migrate` 스킬 사용)

## CSS/Tailwind 주의사항

- `globals.css`의 글로벌 리셋(`* { margin: 0 }`)은 반드시 `@layer base` 안에 위치해야 함. un-layered 스타일은 Tailwind utilities 레이어보다 우선순위가 높아서 `space-y-*`, `mt-*` 등 margin 기반 유틸리티가 무시됨
- `space-y-*`가 안 먹힐 때 → CSS Cascade Layers 우선순위 문제 의심. `gap-*`은 컨테이너 속성이라 영향 안 받음
