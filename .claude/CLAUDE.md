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

## 로컬 DB 초기화 (Prisma Seed)

```bash
pnpm --filter @school/api db:reset   # DB 전체 리셋 + seed (drift 정리 시)
pnpm --filter @school/api db:seed    # 비어있는 DB에 seed만 주입
```

- Seed 엔트리: `apps/api/prisma/seed.ts`
- 데이터: Parish 2 / Church 4 / Organization 5 / Account 7 / Group 8 / Student 20 / Registration 10 / Attendance 20
- 모든 계정 비밀번호: `5678` (로컬 전용)
- 프로덕션 가드: `NODE_ENV=production`이면 seed 자체가 abort
- 테스트 DB는 영향받지 않음 (`vitest.global-setup.ts`가 독립적으로 리셋)

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

## 참조 rules

공통 표준은 `.claude/rules/` 아래에 분산되어 있다. 필요한 규칙을 해당 파일에서 직접 참조.

| 파일 | 내용 |
|------|------|
| [coding-style.md](rules/coding-style.md) | 불변성·KISS/DRY/YAGNI·함수<50/파일<800/중첩<4 |
| [code-review.md](rules/code-review.md) | 심각도 4단계·에이전트 위임 매트릭스 |
| [typescript.md](rules/typescript.md) | TS 타입 안전·Zod·async 정합 (`.ts`/`.tsx` 편집 시 자동 로드) |
| [shared.md](rules/shared.md) · [trpc.md](rules/trpc.md) · [api.md](rules/api.md) · [web.md](rules/web.md) | 패키지/앱별 가이드 |

## 문서 크기 제한

- **모든 문서 파일**(.md, rules, specs, business 등)은 **190줄을 초과하지 않는다.**
- 150줄 이상이면 분리를 검토하고, 190줄을 넘으면 논리적 섹션 기준으로 분리한다.
- 분리 시 상호 참조를 명시한다.

## 에이전트 카탈로그

Task 도구로 호출하는 subagent. 관련 영역이 여러 개 걸치면 병렬 호출 권장.

| 에이전트 | 담당 |
|------|------|
| `biz-planner` · `biz-critic` | 사업 브레인스토밍 (기획/비판) |
| `design-reviewer` | UI/UX·접근성·디자인 시스템 |
| `performance-analyzer` | 번들·렌더·쿼리 성능 |
| `security-reviewer` | OWASP Top 10·인증/권한·시크릿 |
| `typescript-reviewer` | TS 타입·async·에러 전파·idiom |
| `database-reviewer` | Prisma 스키마·N+1·트랜잭션·race |
| `silent-failure-hunter` | 빈 catch·삼킨 에러·위험한 fallback |

## 스킬 카탈로그

슬래시 커맨드로 호출.

| 스킬 | 용도 |
|------|------|
| `/sdd` | Spec-Driven Development 0~6단계 + quick/non-func 예외 플로우 |
| `/biz` · `/bs` · `/bs-to-target` | 사업 워크플로우 / 브레인스토밍 / 결과를 TARGET에 반영 |
| `/feedback` | 신규 피드백 entries 스캐폴딩 + 인덱스 자동 갱신 |
| `/commit` · `/test` · `/pr` | 커밋 / 테스트 / PR 본문 자동 생성 및 생성 |
| `/pre-pr` | PR 전 변경 영역별 reviewer 병렬 호출 + 심각도 집계 |
| `/prisma-migrate` | Prisma 스키마 → 마이그레이션 |
| `/refactor-clean` | knip·ts-prune·depcheck로 데드 코드 제거 |
| `/design-draft` | Claude Design으로 시안 제작 → 2단 컨펌 → 구현 플로우 |
| `/save-session` · `/resume-session` | 세션 상태 저장/복원 (`docs/sessions/`) |

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

### PreToolUse Bash 가드

`git commit --no-verify` / `git push --no-verify`를 포함한 Bash 명령은 자동 차단된다. 훅 실패 시 우회하지 말고 원인을 해결하라.

### PostToolUse 자동화

Edit/Write 직후에는 편집된 파일 경로만 `/tmp/school-edited.txt`에 누적한다. 실제 `pnpm lint:fix && pnpm typecheck`는 **Stop 훅에서 1회만** 실행되어 비용/지연을 최소화한다. 훅 로직은 `.claude/hooks/stop-check.sh` 별도 스크립트로 분리되어 있으며, 편집 파일이 5개 이상이면 `/pre-pr` 실행 권장 힌트를 stderr로 출력한다. 훅 수정은 Claude Code hot-reload가 안 되므로 `.claude/settings.json` 변경 후 세션 재시작 필요.

## CSS/Tailwind 주의사항

- `globals.css`의 글로벌 리셋(`* { margin: 0 }`)은 반드시 `@layer base` 안에 위치해야 함. un-layered 스타일은 Tailwind utilities 레이어보다 우선순위가 높아서 `space-y-*`, `mt-*` 등 margin 기반 유틸리티가 무시됨
- `space-y-*`가 안 먹힐 때 → CSS Cascade Layers 우선순위 문제 의심. `gap-*`은 컨테이너 속성이라 영향 안 받음
