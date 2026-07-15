# 프로덕트 엔지니어 온보딩 플랜

채용 또는 업무 위임이 확정됐을 때 사용하는 4주 온보딩 템플릿이다. 현재 인력 현황을 뜻하지 않는다.
기준 인재는 3~5년차급 실무형 미들이며, 연차보다 동등한 수행 근거를 우선한다.
목표는 승인된 버그의 접수, 수정, 검증, 배포를 합의한 대응 시간과 완료 기준 안에서 독립 수행하는 것이다. 첫 프로덕션 배포와 권한 변경은 대표 감독 아래 진행한다.
선발 기준과 합류 전 강점/공백 기록은 `role-profiles.md`를 사용해 이 4주 계획에 연결한다.

> 개발은 Claude Code와 `/sdd` 워크플로를 사용한다. AI 출력은 초안이며 코드, 테스트, 배포 결과를 사람이 검증한다.
> 사업 현황은 `docs/business/STATUS.md`, 지표 정의는 `docs/business/5_metrics/metrics.md`, 구현 예정 작업은 `docs/specs/README.md`가 기준이다.

## Week 1: 환경 구축과 코드베이스 파악

### Day 1-2: 개발 환경

1. Node.js 24 이상과 저장소 고정 pnpm 10 버전 설치
2. Docker Desktop 또는 승인된 호환 런타임 설치 후 `docker compose version` 확인. 기존 격리 MySQL 8 사용 가능
3. `nvm use && pnpm install` 실행
4. `apps/api/.env.example`을 `apps/api/.env.local`로 복사하고 전용 로컬 MySQL 스키마 설정
5. `APP_PORT=9000`인지 확인. Web 개발 서버는 9080
6. 같은 터미널에서 환경을 로드하고 Prisma 생성, DB 초기화, build, dev 순서로 실행

애플리케이션은 `.env.local`을 자동 로드하지만 먼저 실행되는 Prisma CLI와 build는 현재 셸 환경 변수가 필요하다. Mac, Linux, WSL에서는 같은 터미널에서 실행한다.

```bash
cd apps/api
set -a
source .env.local
set +a
pnpm prisma:generate
pnpm db:reset
cd ../..
pnpm build
pnpm dev
```

PowerShell도 `.env.local` 값을 현재 프로세스에 유지한 채 같은 창에서 실행한다.

```powershell
Get-Content apps/api/.env.local | Where-Object { $_ -match '^[^#][^=]*=' } | ForEach-Object {
    $key, $value = $_ -split '=', 2
    Set-Item -Path "Env:$($key.Trim())" -Value $value.Trim().Trim('"')
}
pnpm --filter @school/api prisma:generate
pnpm --filter @school/api db:reset
pnpm build
pnpm dev
```

`db:reset`은 스키마를 초기화하므로 공유, 운영, 기존 데이터가 있는 DB에는 실행하지 않는다.

개발 서버를 종료한 뒤 새 터미널에서 테스트 환경을 로드한다. 기존 격리 MySQL 8을 쓰면 Compose 기동은 생략하고 `.env.test` 연결값을 맞춘다.

```bash
cp apps/api/.env.test.example apps/api/.env.test
set -a
source apps/api/.env.test
set +a
docker compose -f docker-compose.test.yml up -d
pnpm lint && pnpm prettier && pnpm typecheck && pnpm build && pnpm test
```

E2E도 새 터미널에서 `apps/api/.env.test-e2e.example`을 별도 MySQL 스키마에 연결하고 현재 환경에 로드한 뒤 `pnpm test:e2e`를 실행한다.

필수 읽기:

- `.claude/CLAUDE.md`: 저장소 컨벤션과 명령
- `README.md`: 프로젝트 개요, ERD, 배포 구조
- `docs/people/md/ai-usage-guide.md`: AI 도구 사용법
- `docs/specs/README.md`: 현재 구현 상태와 TARGET

### Day 3-4: 아키텍처

먼저 아래 규칙을 읽는다.

1. `api.md`, `trpc.md`: Clean Architecture, 4개 procedure, 조직 스코프
2. `shared.md`, `utils.md`: Zod 스키마, 도메인 상수, KST 유틸리티
3. `web.md`, `web-patterns.md`: React 19, TanStack Query, 코드 스플리팅
4. `design.md`, `design-patterns.md`: shadcn/ui, 반응형, 접근성
5. `typescript.md`, `coding-style.md`, `code-review.md`: 타입과 리뷰 기준
6. `specs.md`, `specs-lifecycle.md`: SDD 0부터 6까지의 흐름

Student 도메인을 다음 순서로 추적한다.

- `apps/api/prisma/schema.prisma`: Student 모델
- `packages/shared/src/schemas/student.ts`: 입력 스키마와 출력 타입
- `apps/api/src/domains/student/application/`: UseCase
- `apps/api/src/domains/student/presentation/student.router.ts`: tRPC Router
- `apps/web/src/features/student/`: 훅, 컴포넌트, 유틸리티
- `apps/web/src/pages/student/`: 페이지 컴포넌트

### Day 5: CI/CD와 배포

- `.github/workflows/ci.yml`: PR에서 lint, prettier, typecheck, build, unit/integration test와 별도 E2E 실행
- `.github/workflows/deploy.yml`: main 변경 시 API와 Web 변경을 분리 감지
- API: Docker 이미지에 SHA 태그를 붙여 Docker Hub에 push한 뒤 서버에서 Docker Compose 갱신
- Web: Vite 빌드 산출물을 SSH/SCP로 정적 경로에 배포
- `Dockerfile`: Node 24 Alpine 기반 API builder/runner, 컨테이너 포트 4000

GitHub, 배포 서버, Docker Hub 접근은 최소 권한으로 발급한다. 프로덕션 비밀값이나 `.env` 내용을 AI 채팅에 붙여넣지 않는다.

### Week 1 체크포인트

- [ ] API `:9000`, Web `:9080` 로컬 구동
- [ ] lint, prettier, typecheck, build, test 통과
- [ ] Parish → Church → Organization → Account/Group/Student/Attendance 설명
- [ ] 프론트 훅 → Router → UseCase → Prisma 요청 흐름 추적
- [ ] `/test`, `/biz status`를 읽기 중심으로 실행

## Week 2: 첫 기여

`docs/specs/README.md`에서 대표가 실행 승인한 작은 작업을 선택한다. 현재 보류, 외부 의존성 대기, 재검토 전 항목은 온보딩 과제로 임의 해제하지 않는다. 실행 가능한 TARGET이 없으면 재현 가능한 유지보수 이슈를 먼저 등록하거나 과거 완료 기능의 테스트 보강을 실습한다.

1. 작업 근거와 완료 조건 확인
2. `fix/<short-desc>` 또는 `feature/<short-desc>` 브랜치 생성
3. 소규모 기능은 `/sdd quick`, 비기능 변경은 `/sdd non-func`, 일반 기능은 `/sdd 0`부터 진행
4. AI가 제시한 수정안을 코드와 규칙 파일로 검증
5. `/test` 및 필요한 E2E 실행
6. `/pre-pr` 결과의 모든 심각도 항목을 확인하고 대응
7. `/commit`, `/pr`을 사용자 확인 아래 실행
8. CI 통과 후 대표 리뷰, 머지, 배포 확인

Edit/Write 직후에는 파일 경로만 기록된다. 실제 `pnpm lint:fix && pnpm typecheck`는 Claude Code Stop 훅에서 한 번 실행되므로 종료 전 결과를 확인한다.

### Week 2 체크포인트

- [ ] 첫 PR 머지 또는 대표가 승인한 연습 PR 완료
- [ ] 커밋과 브랜치 컨벤션 준수
- [ ] CI와 배포 로그를 구분해 설명

## Week 3: SDD 전체 흐름

대표가 승인한 일반 기능에 대해 0부터 6까지 수행한다. 실행 가능한 TARGET이 없으면 보류 항목을 구현하지 말고 샌드박스 문서 연습으로 대체한다.

- Stage 0: `docs/specs/README.md` 미착수 항목 선택 및 상태 등록
- Stage 1: `docs/specs/prd/`에 PRD 작성
- Stage 2: `docs/specs/functional-design/`에 기능 설계 작성
- Stage 3: `docs/specs/target/functional/tasks/`에 역할별 Task 작성
- Stage 4: `docs/specs/target/functional/development/`에 역할별 구현 명세 작성
- Stage 5: Backend → Frontend → 테스트 순서로 구현
- Stage 6: `/pre-pr`, 자동 검사, 문서 정리, `/commit`, `/pr`

`/sdd 6`은 변경 영역에 맞는 reviewer만 호출한다. 보안, DB, TypeScript, 에러 처리, UI/UX, 성능 중 해당 영역 결과를 모두 검토한다.

## Week 4: 운영 인수

- 감독하에 프로덕션 배포 1회 수행
- 현행 workflow에는 자동 롤백 job이나 수동 rollback dispatch가 없음을 확인
- API는 승인된 이전 SHA 태그로 수동 전환, Web은 Git revert 후 main 재배포 또는 승인된 정적 백업 복원
- 롤백 런북을 작성하고 프로덕션 권한 부여 전 비운영 환경에서 검증
- GitHub Actions, 서버 컨테이너 health/log, Docker Hub 이미지 상태 확인
- DB 변경은 `/prisma-migrate` 절차와 운영 전 점검 SQL 확인
- 장애 시 변경 중단, 영향 범위 확인, 대표 보고, 롤백 순서를 런북으로 작성

사업 맥락은 지표 단위를 섞지 않는다.

- WVO와 MAO는 단체 단위, MAU는 사용자 단위
- 최신 수치는 `STATUS.md`만 인용
- WVO 미측정 또는 MAU 최신값 없음 상태를 임의 수치로 채우지 않음
- 유료 파일럿, 자동 알림, NFC, 엑셀 업로드 등 보류 항목은 진입 조건 확인 전 구현하지 않음

### 완료 기준

- [ ] 승인된 버그의 재현, 수정, 검증, 배포 전 과정을 합의한 기준에 따라 독립 수행
- [ ] SDD 기반 기능을 독립 설계하고 리뷰 의견을 전부 처리
- [ ] API와 Web의 서로 다른 배포 및 롤백 방식 설명
- [ ] `docs/specs/README.md`와 사업 SSoT를 확인해 우선순위 오판 방지

## 핵심 기술 스택

| 영역 | 기술 |
| --- | --- |
| 런타임 | Node.js 24 이상, ESM, TypeScript strict |
| 백엔드 | Express 5, tRPC v10, Prisma 6, Kysely, MySQL |
| 프론트엔드 | React 19, Vite 6, Tailwind CSS v4, shadcn/ui |
| 공유 | `@school/shared`, `@school/trpc`, `@school/utils` |
| 빌드 | pnpm workspace, Turborepo |
| CI/CD | GitHub Actions, Docker Hub, SSH/SCP, AWS Lightsail |
| 테스트 | Vitest, Playwright E2E |

## 필수 안전 규칙

- scoped 리소스는 `organizationId` 소유권을 검증한다.
- DB 타임스탬프 저장은 `getNowKST()` 정책을 따른다.
- `.env`, 비밀번호, 토큰, 개인정보를 프롬프트나 커밋에 넣지 않는다.
- 기존 migration SQL과 lock 파일을 직접 편집하지 않는다.
- 모든 Markdown은 190줄 이하로 유지하고 middle dot 문자를 쓰지 않는다.
