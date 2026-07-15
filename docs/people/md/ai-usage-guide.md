# AI 활용 가이드

이 저장소는 AI를 개발과 문서 작업의 보조 도구로 사용한다. 기술 또는 마케팅 경험을 대신하는 것이 아니라 탐색, 초안, 반복 검증 비용을 줄이는 방식이다.

> 처음이면 `ai-setup-guide.md` → `ai-basics-guide.md` → 이 문서 순서로 진행한다.

## 핵심 원칙

1. AI에게 맥락과 근거 파일을 지정한다.
2. `.claude/CLAUDE.md`와 현재 작업에 해당하는 규칙을 확인한다.
3. 반복 절차는 저장소 스킬로 실행하되 각 단계 결과를 검토한다.
4. AI 출력은 시작점이다. 코드, 테스트, 수치, 외부 상태를 사람이 확인한다.
5. 분석 요청과 수정 권한을 구분하고 운영 작업은 별도 승인한다.

## 현재 저장소 도구 구성

rule, skill, agent 목록의 SSoT는 `.claude/CLAUDE.md` 카탈로그와 각 디렉터리다. 고정 개수를 외우지 말고 작업 전 실제 파일을 확인한다.

```bash
find .claude/rules -maxdepth 1 -name '*.md'
find .claude/skills -mindepth 2 -maxdepth 2 -name SKILL.md
find .claude/agents -maxdepth 1 -name '*.md'
```

### 인터페이스

- Claude Code 터미널: 이 가이드의 기준 인터페이스
- 공식 Desktop, VS Code, Web: 역할과 환경에 따라 선택 가능
- Conductor: 설치 가능성과 팀 승인을 확인한 뒤 사용하는 선택형 외부 GUI

외부 인터페이스 정보는 [Claude Code 공식 quickstart](https://code.claude.com/docs/en/quickstart)를 2026-07-15에 확인했다. 기능과 설치 방식은 공식 문서를 우선한다.

## 주요 스킬

### 프로덕트 엔지니어

| 스킬 | 용도 | 사용 시점 |
| --- | --- | --- |
| `/sdd` | Functional 0부터 6까지와 예외 흐름 | 승인된 작업 시작 |
| `/sdd quick` | PRD와 FD를 거치는 소규모 변경 | 단일 파일 등 작은 변경 |
| `/sdd non-func` | FD → 구현 → 검증 | 성능, 보안, 인프라, DX |
| `/test` | 전체 또는 패키지 테스트 | 변경 후 |
| `/pre-pr` | 변경 영역별 reviewer 호출 | PR 전 |
| `/prisma-migrate` | 스키마 변경과 개발 DB 반영 | Prisma 변경 시 |
| `/commit` | diff 분석과 확인 후 커밋 | 검증 완료 후 |
| `/pr` | PR 본문 작성과 생성 | reviewer 대응 완료 후 |

### 사업과 콘텐츠

| 스킬 | 용도 | 현재 운영 조건 |
| --- | --- | --- |
| `/biz status` | STATUS와 사업 문서 현황 점검 | 최신 수치는 STATUS만 사용 |
| `/biz-pulse` | DB 메일, GA4, Clarity 기반 정량 보강 | 외부 데이터 접근 가능할 때 |
| `/biz-audit` | 사업 문서 간 용어, 수치, 가정 감사 | 사업 문서 변경 후 |
| `/biz content [주제]` | 콘텐츠 초안 작업 | 콘텐츠 운영 게이트가 열린 뒤 |
| `/bs [주제]` | 기획자와 비판자 토론 | 아이디어 검토 |
| `/biz handoff [기능명]` | 사업 판단을 SDD로 연결 | TARGET 진입 승인 후 |

현재 `STATUS.md`상 Instagram 콘텐츠 생산은 별도 재개 승인 전까지 동결이다. 2026년 9월 90일 사업 검증 모드 채택은 재개 승인이 아니다. `/biz content`가 기술적으로 가능해도 게이트 재평가 전에는 게시용 산출물을 만들거나 발행하지 않는다.

## 검증 자동화의 실제 동작

파일 저장 즉시 모든 검사가 실행되는 구조가 아니다.

```text
Edit/Write
  → PostToolUse가 편집 파일 경로만 기록
  → Claude Code Stop 훅이 pnpm lint:fix + pnpm typecheck를 한 번 실행
  → /pre-pr이 변경 영역에 맞는 reviewer를 선택
  → /sdd 6이 자동 검사, 문서 정리, 커밋, PR 절차를 연결
  → PR CI가 lint, prettier, typecheck, build, test, E2E를 실행
```

Stop 훅 통과는 전체 CI 통과와 같지 않다. PR 전에는 필요한 build, test, E2E를 별도로 실행한다.

### `/pre-pr` reviewer 6종

| agent | 검사 영역 |
| --- | --- |
| `security-reviewer` | 인증, 권한, 입력 검증, 시크릿, OWASP |
| `database-reviewer` | Prisma, 쿼리, 인덱스, 트랜잭션 |
| `typescript-reviewer` | 타입 안전, async, 에러 전파, TS 관용구 |
| `silent-failure-hunter` | 빈 catch, 삼킨 오류, 위험한 fallback |
| `design-reviewer` | UI/UX, 접근성, 디자인 시스템 |
| `performance-analyzer` | 번들, 렌더링, 쿼리 성능 |

모든 reviewer를 항상 호출하지 않는다. diff에 해당하는 영역만 선택하며 문서만 바뀐 경우 코드 reviewer를 생략할 수 있다. AI 리뷰는 사람의 코드 리뷰와 실행 검증을 보완할 뿐 대체하지 않는다.

## rule 구조

| 분류 | 파일 |
| --- | --- |
| 품질 | `coding-style.md`, `typescript.md`, `code-review.md` |
| Backend | `api.md`, `trpc.md`, `shared.md`, `utils.md` |
| Web/Design | `web.md`, `web-patterns.md`, `design.md`, `design-patterns.md` |
| SDD/사업 | `specs.md`, `specs-lifecycle.md`, `business.md` |
| 콘텐츠 | `content.md`, `content-templates-feed.md`, `content-templates-reel.md`, `content-templates-combined.md` |

규칙 목록을 외우기보다 작업 파일과 관련된 원문을 직접 읽는다. 예를 들어 `.ts`와 `.tsx`는 `typescript.md`, API 도메인은 `api.md`, 콘텐츠는 `content.md`를 함께 확인한다.

## 실전 예시

### 승인된 기능 시작

```text
/sdd 0
```

`docs/specs/README.md`에서 미착수 후보를 고르고 `STATUS.md`와 로드맵 배경을 확인한다. 보류, 외부 의존성 대기, 재검토 전 항목은 목록에 보인다는 이유만으로 시작하지 않는다.

일반 Functional 흐름:

```text
/sdd 1 <기능명>  PRD
/sdd 2 <기능명>  기능 설계
/sdd 3 <기능명>  역할별 Task
/sdd 4 <기능명>  역할별 구현 명세
/sdd 5 <기능명>  Backend → Frontend → 테스트
/sdd 6 <기능명>  reviewer → 검사 → 문서 정리 → 커밋 → PR
```

`/sdd 6`은 reviewer 결과 전부에 대한 사용자 대응이 끝날 때까지 커밋과 PR로 진행하지 않는다.

### 에러 분석

```text
이 에러를 재현해줘. 먼저 실패 명령과 첫 원인만 분석하고 파일은 수정하지 마.
관련 코드와 테스트를 파일 경로, 줄 근거로 제시해줘.
```

원인에 동의한 뒤 수정과 검증을 별도 요청한다.

### 사업 상태 확인

```text
/biz status
```

- WVO와 MAO는 단체 단위, MAU는 사용자 단위다.
- 현재값은 `docs/business/STATUS.md`, 정의와 산식은 `docs/business/5_metrics/metrics.md`를 따른다.
- 서로 다른 단위나 기준일을 나눠 전환율을 만들지 않는다.
- 외부 PG, 계약, 인터뷰 결과처럼 저장소에서 확인할 수 없는 상태는 `미확인`으로 남긴다.

### 아이디어 검토

```text
/bs 출석 알림 카카오톡 연동
```

토론 결과는 결정이 아니다. 사업 SSoT, 사용자 근거, 기술 의존성을 확인하고 `/bs-to-target`과 `/sdd 0` 진입 여부를 사람이 승인한다.

## 보안과 운영 주의사항

1. `.env`, 비밀번호, API 토큰, SSH 키를 읽거나 붙여넣지 않는다.
2. 학생, 교사, 고객의 개인정보나 운영 DB 행을 프롬프트에 넣지 않는다.
3. 광범위한 영구 권한을 허용하지 않고 저장소와 명령 범위를 좁힌다.
4. 운영 DB, 배포, 결제, 외부 발송은 대표 승인과 롤백 계획을 확인한다.
5. AI가 만든 코드에는 테스트와 사람 리뷰가 필요하다.
6. AI가 만든 콘텐츠에는 제품 동작, 사업 상태, 금지 표현 검수가 필요하다.
7. 세션 기억을 가정하지 않고 Git 상태와 SSoT를 다시 읽는다.

권한 판단은 [Claude Code permissions](https://code.claude.com/docs/en/permissions)와 [security](https://code.claude.com/docs/en/security)를 2026-07-15 기준으로 확인했다.

## Week 1 체크리스트

- [ ] `/help`로 설치된 스킬 확인
- [ ] 읽기 전용 질문에서 근거 파일 검증
- [ ] `/biz status`에서 현재값과 정의 분리
- [ ] 엔지니어는 `/test`, 마케터는 콘텐츠 동결 게이트 확인
- [ ] Edit/Write, Stop 훅, `/pre-pr`, CI의 차이 설명
- [ ] 비밀값, 개인정보, 운영 작업의 승인 경계 설명
