# 프로덕트 엔지니어 온보딩 플랜

대표의 기술 역할을 인수받아 풀스택 개발·배포·운영을 단독 수행하는 것이 목표다.
4주 후 버그 접수→수정→배포까지 4시간 내 단독 처리 가능해야 한다.

> **AI 활용이 핵심이다.** 이 프로젝트는 Claude Code + `/sdd` 워크플로우로 개발한다.
> 기술 스택을 완벽히 몰라도 AI가 `.claude/rules/` 13개 룰 파일을 읽고 가이드해준다.
> AI가 처음이면: `ai-setup-guide.md` (설치) → `ai-basics-guide.md` (기초) → `ai-usage-guide.md` (실전) 순서.

## Week 1: 환경 구축 + 코드베이스 파악

### Day 1-2: 개발환경 세팅

1. Node.js 24+ (`nvm use`), pnpm 10+ 설치
2. `pnpm install` → `pnpm build` → `pnpm dev` 로컬 구동 확인
3. `apps/api/.env.example` → `.env.local` 복사, 로컬 DB(MariaDB) 연결
4. `pnpm prisma generate && pnpm prisma db push` 스키마 동기화
5. `pnpm test && pnpm typecheck && pnpm lint` 전체 CI 파이프라인 로컬 통과 확인

**필수 읽기:**
- `.claude/CLAUDE.md` — 개발 컨벤션 마스터 가이드
- `README.md` — 프로젝트 개요, ERD, 기능 목록
- `docs/people/ai-usage-guide.md` — AI 도구 사용법

### Day 3-4: 아키텍처 이해

**룰 파일 읽기 순서** (`.claude/rules/`):
1. `api.md` — Clean Architecture, 4개 procedure 타입, IDOR 방지, KST
2. `trpc.md` — tRPC 패키지 구조, context, procedure 계층
3. `shared.md` — Zod 스키마, 도메인 상수
4. `web.md` + `web-patterns.md` — React 19, TanStack Query, 코드 스플리팅
5. `design-patterns.md` — shadcn/ui, 모바일 퍼스트(62% 모바일)
6. `specs.md` + `specs-lifecycle.md` — SDD 7단계 워크플로우
7. `utils.md` — 공유 유틸리티

**Student 도메인 전체 추적** (레퍼런스 도메인):
- `apps/api/prisma/schema.prisma` (Student 모델)
- `packages/shared/src/schemas/student.ts` (Zod 스키마)
- `apps/api/src/domains/student/application/` (UseCase)
- `apps/api/src/domains/student/presentation/` (tRPC Router)
- `apps/web/src/features/student/hooks/` (프론트 훅)
- `apps/web/src/pages/Student*.tsx` (페이지 컴포넌트)

### Day 5: CI/CD + 배포

- `.github/workflows/ci.yml` — PR 검증 (lint, prettier, typecheck, build, test)
- `.github/workflows/deploy.yml` — main 머지 시 Docker 빌드 → AWS Lightsail 배포
- `Dockerfile` — multi-stage (builder → runner, node:24-alpine, KST)
- GitHub, AWS Lightsail, Docker Hub 접근 권한 확보

**AI 셋업 (Day 1):**
- Conductor 설치 + 워크스페이스 연결
- Claude에게 "Student 도메인 전체 구조 설명해줘" 요청 → 코드 탐색 대리 체험
- `/test` 실행, `/biz status` 실행 → 슬래시 커맨드 체험

### Week 1 체크포인트

- [ ] `pnpm dev` 로컬 구동 성공 (API :9000, Web :9080)
- [ ] 전체 CI 파이프라인 로컬 통과
- [ ] 도메인 계층 설명 가능: Parish → Church → Organization → Student/Group/Attendance
- [ ] tRPC 요청 흐름 추적 가능: 프론트 hook → Router → UseCase → Prisma → 응답
- [ ] Claude Code로 코드 탐색 + `/test` 실행 성공

---

## Week 2: 첫 기여 (가이드 있는 버그 수정)

### 작업 선택

`docs/specs/README.md` TARGET BUGFIX에서 P2-P3 선택. 추천:
- P3: AuthLayout 이미지 CLS 수정 (프론트만)
- P2: 로그인 사용자 열거 공격 수정 (백엔드)

### 프로세스

1. 브랜치 생성: `fix/<short-desc>`
2. SDD 예외 적용: 소규모 변경은 Task/Dev 문서 생략
3. **Claude에게 버그 설명 → AI가 관련 코드 분석 + 수정안 제시** → 검토 후 적용
4. 테스트 작성/실행: `/test` 로 자동 실행
5. 파일 저장 시 자동 lint+typecheck (PostToolUse 훅)
6. 커밋: `/commit` 으로 메시지 자동 생성 + 커밋
7. PR → CI 통과 → 대표 리뷰 → 머지 → 배포 확인

**대표 역할**: 첫 PR 페어 프로그래밍 2시간, 배포 파이프라인 시연

### Week 2 체크포인트

- [ ] 첫 PR 머지 + 프로덕션 배포 완료
- [ ] 커밋/브랜치 컨벤션 숙지
- [ ] 배포 과정(머지→CI→Docker→Lightsail) 관찰 완료

---

## Week 3: 독립 기능 개발 (SDD 전체 워크플로우)

### 작업 선택

TARGET FUNCTIONAL P1-P2 선택. 추천: "출석 페이지 전체 그룹 학생 확인"

### SDD 7단계 전체 수행

- Stage 0: `docs/specs/README.md`에 등록
- Stage 1: PRD 작성 (`docs/specs/prd/`)
- Stage 2: 기능설계 (`docs/specs/functional-design/`)
- Stage 3: Task 문서 (역할별 작업 분해)
- Stage 4: Development 문서 (구현 명세)
- Stage 5: 구현 + 테스트 (Backend → Frontend → Test)
- Stage 6: 자동 검증 + 문서 정리 + PR

**Claude Code가 핵심 도구:**
- `/sdd 0` 부터 시작하면 AI가 단계별로 안내
- PRD/기능설계: AI가 기존 도메인 패턴 분석해서 초안 제안
- 구현: AI가 `api.md`, `web.md` 룰 참고해서 코드 작성
- 검증: `/sdd 6`에서 보안/디자인/성능 서브 에이전트가 자동 리뷰

**대표 역할**: PRD/기능설계 비동기 리뷰(30분), PR 비동기 리뷰(30분)

### Week 3 체크포인트

- [ ] SDD 7단계 전체 독립 수행 완료
- [ ] PR 리뷰 시 아키텍처 이슈 없음
- [ ] Zod 스키마 → tRPC → UseCase → 프론트 훅 전체 배선 가능

---

## Week 4: 완전 인수인계

### 배포 + 운영

- 단독 프로덕션 배포 1회 이상
- 롤백 절차 숙지 (Docker 태그 기반)
- 모니터링: AWS Lightsail, Docker Hub 빌드, GitHub Actions 로그

### 지식 이전 세션 (총 2시간)

| 세션 | 내용 | 시간 |
|------|------|------|
| DB 관리 | Prisma 마이그레이션, 백업, MariaDB 접근 | 30분 |
| 아키텍처 결정 | Kysely/Prisma 병용, KST, snapshot 테이블 | 30분 |
| 기술 부채 | BUGFIX + PERFORMANCE 항목 전체 | 30분 |
| 사업 맥락 | 전환 퍼널, WAU 드라이버, 기능 우선순위 | 30분 |

### 완료 기준

- [ ] 버그 접수→수정→배포 4시간 내 단독 처리
- [ ] SDD 기반 신규 기능 독립 설계/구현/배포
- [ ] 프로덕션 인시던트 대응 (Docker 로그, 롤백, Prisma 마이그레이션)
- [ ] `docs/specs/README.md` TARGET 백로그 단독 운영

---

## 핵심 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 런타임 | Node.js 24+, ESM, TypeScript strict |
| 백엔드 | Express + tRPC v10, Prisma (MariaDB), Kysely |
| 프론트엔드 | React 19 + Vite, Tailwind CSS v4, shadcn/ui |
| 공유 | @school/shared (Zod), @school/trpc, @school/utils |
| 빌드 | pnpm workspace + Turborepo |
| CI/CD | GitHub Actions → Docker Hub → AWS Lightsail |
| 테스트 | Vitest (API + Web) |

## 주의사항

- IDOR 방지: 모든 scoped 쿼리에 `organizationId` 필터 필수
- 타임존: `getNowKST()` 사용 (Prisma `@default(now())`는 UTC)
- Tailwind: 글로벌 리셋은 `@layer base` 안에 (margin 유틸리티 우선순위)
- 문서: 190줄 제한, 초과 시 논리적 분리
