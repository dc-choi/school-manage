# 브레인스토밍 결과 보고서

## 주제
하네스 엔지니어링 적용 수준 분석 — 이 프로젝트가 하네스 엔지니어링을 얼마나 따라하고 있는가?

## 하네스 엔지니어링이란?

OpenAI가 2026년 초 정의한 개념. **"AI 에이전트가 코드를 올바르게 작성할 수 있는 환경을 설계하는 것"**.
핵심은 에이전트 자체가 아니라 에이전트를 감싸는 **제약(constraints), 맥락(context), 피드백 루프(feedback loops), 관찰 가능성(observability)** 인프라 구축.

5대 원칙: Constrain → Inform → Verify → Correct → Human-in-the-loop

## 프로젝트 하네스 인프라 현황

| 하네스 요소 | 구현 | 규모 |
|------------|------|------|
| CLAUDE.md (프로젝트 맥락) | O | 86줄 |
| Rules (도메인별 제약) | O | 13개 파일, 1,577줄 |
| Skills (워크플로우 자동화) | O | 7개 스킬, 627줄 |
| Custom Agents (전문 에이전트) | O | 5개 |
| Memory (대화 간 지속 기억) | O | MEMORY.md 인덱스 |
| SDD 프로세스 (구조화된 개발 흐름) | O | 5단계 |
| Business docs (비즈니스 맥락) | O | 7개 문서 |

## 5대 원칙 대비 평가

### 1. Constrain (에이전트 행동 제한) — 90%

- 13개 Rules 파일이 도메인(API, Web, tRPC, Shared 등)마다 아키텍처 패턴, 금지 사항, 코딩 규칙 명시
- 예: "Repository 패턴 제거 → UseCase에서 Prisma 직접 사용", "무료 표현 사용 금지"
- 문서 크기 제한(190줄)까지 규정

### 2. Inform (무엇을 해야 하는지 알려줌) — 90%

- CLAUDE.md가 프로젝트 전체 구조, ERD, 명령어, 코딩 스타일 제공
- 각 Rules 파일이 디렉토리 구조, 주요 패턴, 주의사항 상세 기술
- Business docs가 사업 맥락(가치 제안, 수익 모델, GTM) 제공

### 3. Verify (작업 결과 검증) — 55%

- SDD 5단계에 테스트 포함 (4단계 Integration Testing, 5단계 Verification)
- `/test` 스킬로 테스트 실행 자동화
- **부족**: PR 생성 시 자동 lint→typecheck→test→빌드 검증 게이트 없음

### 4. Correct (실수 교정) — 45%

- Memory 시스템의 `feedback` 타입이 사용자 피드백 저장 → 같은 실수 반복 방지
- **부족**: 자동 롤백, 에이전트 출력 diff 자동 리뷰 메커니즘 없음

### 5. Human-in-the-loop (고위험 결정에 인간 개입) — 75%

- `/bs` 스킬: 기획자↔비판자 3라운드 토론 후 "사용자에게 최종 결정 요청"
- `/biz handoff` 체크리스트로 SDD 전환 시 인간 확인
- Agent Preferences에서 가드레일 설정

## 종합 평점: 72% (상위 20% 수준)

| 원칙 | 점수 |
|------|------|
| Constrain | 90% |
| Inform | 90% |
| Verify | 55% |
| Correct | 45% |
| Human-in-loop | 75% |

## 특히 잘하는 것

1. **도메인별 Rules 분리**: 13개 파일로 각 영역을 세밀하게 제약 — 대부분의 프로젝트가 CLAUDE.md 하나에 다 넣는 것과 대비
2. **Custom Agents 활용**: biz-critic/planner, design-reviewer, security-reviewer 등 역할 기반 검증
3. **비즈니스 맥락 통합**: 사업 문서를 에이전트가 참조할 수 있게 구조화 — "왜 이걸 만드는지"까지 전달

## 부족한 부분 (개선 기회)

| 영역 | 현재 | 하네스 엔지니어링 이상 |
|------|------|---------------------|
| 자동 검증 파이프라인 | 수동 테스트 실행 (`/test`) | PR 생성 시 자동 lint→typecheck→test→빌드 검증 게이트 |
| 에이전트 출력 자동 리뷰 | 없음 | design-reviewer, security-reviewer가 PR에서 자동 실행 |
| Observability | GA4, CloudWatch (제품용) | 에이전트 작업 로그, 성공/실패율, 컨텍스트 사용량 추적 |
| Rollback 메커니즘 | 수동 git revert | 에이전트 실패 시 자동 롤백 + 알림 |
| Sandbox/격리 실행 | 없음 | 위험한 작업 시 격리된 환경에서 실행 |

## 결론

**강점**: 맥락 제공(Inform)과 제약 설정(Constrain)에서 매우 높은 수준. CLAUDE.md + 13개 Rules + 7개 Skills + 5개 Custom Agents + Memory 시스템은 일반적인 프로젝트 대비 상당히 정교함.

**다음 성장 포인트**: 자동 검증(Verify)과 자동 교정(Correct). CI/CD 파이프라인과 에이전트를 연결하는 자동화 계층 구축.

## 참고 자료

- [Harness engineering: leveraging Codex in an agent-first world | OpenAI](https://openai.com/index/harness-engineering/)
- [Harness Engineering | Martin Fowler](https://martinfowler.com/articles/exploring-gen-ai/harness-engineering.html)
- [Software 3.0 시대, Harness를 통한 조직 생산성 저점 높이기 | Toss Tech](https://toss.tech/article/harness-for-team-productivity)
