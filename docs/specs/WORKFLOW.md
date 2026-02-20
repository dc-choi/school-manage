# SDD Workflow (Conductor)

이 문서는 SDD 실행을 위한 **Conductor 기반 워크플로우**를 정의합니다.

## 구조

```
[사업 에이전트]              [SDD 에이전트]                    [사용자]
Conductor 워크스페이스 B  →  Conductor 워크스페이스 A     →    PR 리뷰
docs/business/              PRD + 기능 설계 + 구현              머지 결정
                            자동 검증 (lint, typecheck, sub-agents)
```

## 역할 분담

| 역할             | 담당                      | 책임                              |
|----------------|-------------------------|---------------------------------|
| **사업 에이전트**    | Conductor 워크스페이스 (별도)   | 문제 정의, 가치, 우선순위, 로드맵            |
| **SDD 에이전트**   | Conductor 워크스페이스 (메인)   | 문서 작성 + 구현 + 자동 검증 + PR 생성      |
| **사용자 (검수자)**  | Conductor diff 리뷰       | PR 리뷰 → 머지 결정                   |

> **Note**: 검수는 자동 검증(lint, typecheck, sub-agents) + 사용자 PR 리뷰로 수행한다.

---

## 검증 체계

검수자 세션 대신 **자동 검증 + 사용자 리뷰**로 품질을 보장합니다.

### 자동 검증 (에이전트 실행)

| 검증 항목        | 도구                              | 시점           |
|--------------|-----------------------------------|--------------|
| 코드 스타일       | `pnpm lint:fix && pnpm prettier:fix` | 파일 수정 시 (PostToolUse hook) |
| 타입 안전성       | `pnpm typecheck`                  | 파일 수정 시 (PostToolUse hook) |
| 빌드 성공        | `pnpm build`                      | 구현 완료 후      |
| 테스트 통과       | `pnpm test`                       | 구현 완료 후      |
| 보안 검수        | security-reviewer 서브에이전트          | PR 생성 전      |
| 디자인 일관성      | design-reviewer 서브에이전트            | PR 생성 전 (UI 변경 시) |
| 성능 분석        | performance-analyzer 서브에이전트       | PR 생성 전 (해당 시) |

### 사용자 리뷰 (PR 기반)

- Conductor diff 뷰에서 변경사항 확인
- 비즈니스 로직, 요구사항 정합성 판단
- 머지 또는 수정 요청

---

## 전체 워크플로우 (9단계)

### Phase 1: 사업 (사전 단계)

| 단계 | 담당      | 설명                          |
|----|---------|-----------------------------|
| B1 | 사업 에이전트 | 문제 정의 → `docs/business/` 등록 |
| B2 | 사업 에이전트 | 가치/우선순위/로드맵 정의              |

### Phase 2: SDD (0~6단계)

| 단계 | 담당       | 설명                           |
|----|----------|------------------------------|
| 0  | SDD 에이전트 | 작업 선택 → README.md 등록        |
| 1  | SDD 에이전트 | PRD 작성                       |
| 2  | SDD 에이전트 | 기능 설계 작성                     |
| 3  | SDD 에이전트 | Task (역할별) 작성                |
| 4  | SDD 에이전트 | Development (역할별) 작성         |
| 5  | SDD 에이전트 | 구현 + 테스트                     |
| 6  | SDD 에이전트 | 자동 검증 + 문서 정리 + PR 생성       |

### Phase 3: 리뷰

| 담당  | 설명                     |
|-----|------------------------|
| 사용자 | Conductor diff 리뷰 → 머지 |

---

## B1~B2 단계: 사업 에이전트

**담당**: 사업 에이전트 (Conductor 별도 워크스페이스)
**산출물**: `docs/business/`

### B1: 문제 정의

1. **문제 식별**: 사용자/비즈니스 관점에서 해결할 문제 정의
2. **가치 평가**: 문제 해결 시 기대 효과
3. **우선순위 결정**: P0/P1/P2 기준으로 평가

### B2: 로드맵/지표 정의

1. **로드맵 배치**: 어느 마일스톤에 배치할지 결정
2. **성공 지표**: 측정 가능한 목표 정의

**완료 체크리스트 (사업 → SDD):**
- [ ] 문제가 명확히 정의되었는가?
- [ ] 가치/우선순위가 평가되었는가?
- [ ] `docs/business/`에 문서화되었는가?

---

## 0단계: 작업 선택

**담당**: SDD 에이전트

로드맵과 사업 문서를 확인한 뒤 작업을 선택하고 README.md에 등록한다.

1. **로드맵 확인**: `docs/business/6_roadmap/roadmap.md` 참조
2. **현 상태 확인**: `docs/business/STATUS.md` 참조
3. **참고 사업 문서 확인**: 사업 에이전트 핸드오프에서 지정한 문서와 확인 포인트 파악
4. **작업 선택**: 우선순위/의존성 고려
5. **README.md 등록**: `docs/specs/README.md`의 TARGET 섹션에 추가

**등록 형식:**
```markdown
- P{N} - {기능명}
  - PRD: `docs/specs/prd/{name}.md`
  - 기능 설계: `docs/specs/functional-design/{name}.md`
  - Task: `docs/specs/target/{functional|non-functional}/tasks/{name}.md`
  - Development: `docs/specs/target/{functional|non-functional}/development/`
```

---

## 1단계: PRD 작성

**담당**: SDD 에이전트

### PRD 내용

1. **배경 연결**: `docs/business/` 문서 참조
2. **목표/성공 기준**: 측정 가능한 목표 정의
3. **범위**: 포함/제외 명시
4. **사용자 시나리오**: 구체적인 사용 흐름
5. **요구사항**: Must/Should/Out 구분

**자기 검증 체크리스트:**
- [ ] 문제/배경이 로드맵과 정합적인가?
- [ ] 목표/성공 기준이 명확하고 측정 가능한가?
- [ ] 범위(포함/제외)가 명시되어 있는가?
- [ ] 요구사항이 Must/Should/Out으로 구분되어 있는가?

---

## 2단계: 기능 설계 작성

**담당**: SDD 에이전트

### 기능 설계 내용

1. **사용자 플로우**: 흐름, 상태 전이
2. **UI/UX**: 화면, 컴포넌트 (해당 시)
3. **데이터 모델**: 스키마 변경
4. **API/인터페이스**: 엔드포인트 정의
5. **테스트 시나리오**: 정상/예외 케이스

### 상세 수준

기능 설계는 **"어떻게 동작하는가"(동작 명세)** 수준만 기술합니다. 구현 상세는 Development 문서 또는 코드(SSoT)에 위임합니다.

| 유지 (동작 명세)           | 삭제 (구현 상세 → Development/코드)   |
|-----------------------|--------------------------------|
| API 필드 목록 (이름, 타입, 필수) | JSON 요청/응답 전문 예시              |
| 알고리즘 요약 (1줄)          | 의사코드 블록                       |
| 레이아웃 개념도 (ASCII 1개)   | CSS `@keyframes`, Tailwind 클래스 |
| 상태 전이 다이어그램           | TypeScript 인터페이스, 마이그레이션 SQL  |
| 테스트 시나리오 (정상/예외 핵심만)  | 파일 구조 목록, 중복 와이어프레임           |

**자기 검증 체크리스트:**
- [ ] PRD의 요구사항이 기능 설계에 반영되어 있는가?
- [ ] 사용자 흐름/상태 전이가 명확한가?
- [ ] 데이터 모델/API가 구체적으로 정의되어 있는가?
- [ ] 예외/엣지 케이스가 처리되어 있는가?
- [ ] 구현 상세(JSON 전문, 의사코드 등)가 아닌 동작 명세 수준인가?

---

## 3단계: Task 작성 (역할별 분할)

**담당**: SDD 에이전트

### Task 구조

Task는 **역할별로 업무를 분할**합니다:

```markdown
## 역할별 업무 분할

### 백엔드 개발자
| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| B1 | API 엔드포인트 | ... | 없음 |
| B2 | DB 스키마 | ... | 없음 |

### 프론트엔드 개발자
| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| F1 | 페이지 컴포넌트 | ... | B1 완료 후 |
| F2 | API 연동 | ... | B1 완료 후 |

### 디자이너 (해당 시)
| # | 업무 | 설명 | 의존성 |
|---|------|------|--------|
| D1 | UI 디자인 | ... | 없음 |
```

**자기 검증 체크리스트:**
- [ ] 기능 설계의 요구사항이 업무 분할에 반영되어 있는가?
- [ ] 역할별 업무가 명확히 구분되어 있는가?
- [ ] 업무 간 의존성이 적절한가?
- [ ] 각 역할별 업무가 해당 분야의 rules (api.md, web.md, design.md) 기준에 맞는가?

---

## 4단계: Development 작성 (역할별)

**담당**: SDD 에이전트

### Development 구조

Development는 **역할별로 별도 문서**를 작성합니다:

```
docs/specs/target/{functional|non-functional}/development/
├── {name}-backend.md      # 백엔드 구현 명세
├── {name}-frontend.md     # 프론트엔드 구현 명세
└── {name}-design.md       # 디자인 명세 (해당 시)
```

### Backend Development 내용

- 데이터 모델 (요청/응답)
- 비즈니스 로직
- 에러 처리
- 구현 대상 파일 (`apps/api/`)
- 테스트 시나리오

**검증 기준**: `.claude/rules/api.md`

### Frontend Development 내용

- 컴포넌트 구조
- 상태 관리
- API 연동
- 구현 대상 파일 (`apps/web/`)
- 테스트 시나리오

**검증 기준**: `.claude/rules/web.md`, `.claude/rules/design.md`

### Design Spec 내용 (해당 시)

- UI 컴포넌트
- 레이아웃/간격
- 색상/상태
- 접근성 체크리스트

**검증 기준**: `.claude/rules/design.md`

**자기 검증 체크리스트:**
- [ ] 각 역할별 Development가 해당 분야의 rules 기준에 맞는가?
- [ ] Task의 업무와 1:1 대응되는가?

---

## 5단계: 구현 + 테스트

**담당**: SDD 에이전트

Development 문서를 기준으로 구현합니다.

**구현 순서:**
1. Backend (API, DB) - `api.md` 기준
2. Frontend (UI, 연동) - `web.md`, `design.md` 기준
3. 테스트 작성/실행

**체크리스트:**
- [ ] Development 문서와 구현이 정합하다
- [ ] 테스트 코드가 추가/갱신되었다
- [ ] 빌드가 성공한다

---

## 6단계: 자동 검증 + 문서 정리 + PR 생성

**담당**: SDD 에이전트

### 6-1: 자동 검증

1. `pnpm lint:fix && pnpm prettier:fix`
2. `pnpm typecheck`
3. `pnpm build`
4. `pnpm test`
5. 서브에이전트 실행 (해당 시):
   - security-reviewer: 보안 검수
   - design-reviewer: UI 변경 시 디자인 일관성 검수
   - performance-analyzer: 성능 영향 분석

### 6-2: 문서 정리

모든 검증 통과 후 `target/` → `current/` 이동:

```bash
# 기능적 요구사항 완료 시
mv docs/specs/target/functional/tasks/{name}.md docs/specs/current/functional/tasks/
mv docs/specs/target/functional/development/{name}-*.md docs/specs/current/functional/development/
```

> **Note**: 비기능적 요구사항(non-functional)은 이동하지 않고 삭제한다.

### 문서 동기화 시 축약 규칙

개선 사항을 기존 기능 설계에 병합할 때, **구현 상세를 삭제하고 동작 명세 수준으로 축약**합니다.

1. **구현 상세 삭제**: JSON 전문, 의사코드, CSS 코드, Tailwind 클래스 등 제거
2. **대체된 섹션 통합**: 이전 기능을 대체하는 개선은 별도 섹션이 아닌 기존 섹션에 통합
3. **와이어프레임 정리**: 중복/중간 단계 와이어프레임 제거, 최종 개념도 1개만 유지

### 프로젝트 현황 동기화

**동기화 대상 문서:**

| 문서                     | 동기화 항목             |
|------------------------|--------------------|
| `README.md`            | 기술 스택, 구현 현황       |
| `docs/specs/README.md` | TARGET/CURRENT 인덱스 |
| `.claude/CLAUDE.md`    | 구조, 명령어            |
| `.claude/rules/*.md`   | 패턴/정책 변경 시         |

### 6-3: PR 생성

모든 검증 통과 + 문서 정리 완료 후 PR을 생성합니다.

---

## 문서 분류 기준

| 분류                 | 설명                   | 예시          |
|--------------------|----------------------|-------------|
| **functional**     | 사용자가 직접 사용하는 비즈니스 기능 | 로그인, 출석 관리  |
| **non-functional** | 아키텍처, 성능, 보안, 유지보수성  | 에러 처리, 리팩토링 |

---

## 비기능적 요구사항 처리 방식

비기능적 요구사항(non-functional)은 **간소화된 워크플로우**를 따릅니다.

### 이유

- 완료 후에는 **코드베이스 자체가 SSoT** 역할
- 별도 SDD 문서(Task/Development) 유지 시 불일치 발생 가능
- 아키텍처/인프라 변경은 코드와 CLAUDE.md로 충분히 추적 가능

### 간소화된 워크플로우

```
기능 설계 작성 → 구현 → 자동 검증 + 문서 갱신 → PR 생성
```

| 단계 | 담당       | 설명                                    |
|----|----------|---------------------------------------|
| 1  | SDD 에이전트 | 기능 설계 작성                              |
| 2  | SDD 에이전트 | **바로 구현** (Task/Development 생략)       |
| 3  | SDD 에이전트 | 자동 검증 + 문서 갱신 (CLAUDE.md, README.md)  |
| 4  | SDD 에이전트 | PR 생성                                 |

### 문서 갱신 대상

| 변경 내용         | 갱신 대상                            |
|---------------|----------------------------------|
| API 아키텍처 변경   | `.claude/rules/api.md`           |
| 웹 앱 구조 변경     | `.claude/rules/web.md`           |
| 빌드/명령어 변경     | `.claude/CLAUDE.md`              |
| 기술 스택/환경변수 추가 | `.claude/CLAUDE.md`, `README.md` |

---

## 예외 처리

| 상황          | 처리                           |
|-------------|------------------------------|
| **소규모 변경**  | Task/Development 없이 바로 구현 가능 |
| **UI만 변경**  | Frontend Development만 작성     |
| **API만 변경** | Backend Development만 작성      |
| **긴급 대응**   | 구현 후 문서 보강                   |

---

## 부록: 기능 개선 시 문서 병합

기존 기능에 개선 사항을 추가할 때는 **별도 문서를 생성하지 않고 기존 문서에 병합**합니다.

**도메인별 메인 문서:**

| 도메인   | 기능 설계                      | Task/Development           |
|-------|----------------------------|----------------------------|
| 출석    | `attendance-management.md` | `attendance-management.md` |
| 학생    | `student-management.md`    | `student-management.md`    |
| 그룹    | `group-management.md`      | `group-management.md`      |
| 통계    | `statistics.md`            | `statistics.md`            |
| 인증/계정 | `auth-account.md`          | `auth-account.md`          |

**병합 절차:**
1. 기존 문서 확인
2. 개선 내용을 새 섹션으로 추가
3. 섹션 제목에 출처 명시 (예: "### 달력 UI (로드맵 1단계)")
