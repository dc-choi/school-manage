---
name: biz
description: 사업 에이전트 워크플로우 실행. /biz [status|market|bm|gtm|risk|metrics|roadmap|pricing|content|audit|handoff]
---

# /biz

사업 문서 작성·관리·감사 워크플로우. 관련 스킬과 체인으로 엮여 있다.

## 사용법

```
/biz                      # 현황 확인 및 다음 작업 안내 (= /biz status)
/biz status               # STATUS.md + 각 문서 상태 점검
/biz market               # 시장/경쟁 분석 (가설/근거/검증 패턴 적용)
/biz bm                   # 사업 모델 (가설/근거/검증 패턴 적용)
/biz gtm                  # GTM 전략 (실행 계획 중심)
/biz risk                 # 리스크/가정 (가설/근거/검증 패턴 적용)
/biz metrics              # 지표 설계 (정의 중심)
/biz roadmap              # 로드맵 (일정 중심)
/biz pricing              # 가격 정책 (가설/근거/검증 패턴 적용)
/biz content [주제]       # 콘텐츠 마케터 서브 에이전트 호출
/biz audit [문서1] [문서2] # 사업 문서 교차 점검 (용어·수치·가정 충돌 감지)
/biz handoff [기능명]     # SDD 작성자 핸드오프 (→ /bs-to-target → /sdd 0 체인)
/bs [주제]                # 기획자↔비판자 3라운드 토론 (별도 스킬)
```

## 역할 정의

| 역할 | 관점 | 질문 | 산출물 |
|------|------|------|--------|
| **사업 에이전트** | Why | "왜 이걸 해야 하는가?" | 문제 정의, 로드맵 |
| SDD 작성자 | What + How | "무엇을/어떻게 구현할 것인가?" | PRD, 기능 설계, Task/Dev, 코드 |

## 문서 위치

| 문서 | 경로 | 가설/근거/검증 |
|------|------|---------------|
| 인덱스 | `docs/business/README.md` | - |
| 시장/경쟁 | `docs/business/1_market/market.md` | ✓ |
| 사업 모델 | `docs/business/2_bm/bm.md` | ✓ |
| GTM | `docs/business/3_gtm/gtm.md` | ✗ (실행 계획) |
| 리스크 | `docs/business/4_risk/risks.md` | ✓ |
| 지표 | `docs/business/5_metrics/metrics.md` | ✗ (정의 중심) |
| 로드맵 | `docs/business/6_roadmap/roadmap.md` | ✗ (일정 중심) |
| 가격 | `docs/business/7_pricing/pricing.md` | ✓ |
| 진행 현황 | `docs/business/STATUS.md` | - |
| 이력 | `docs/business/HISTORY.md` | - |
| 피드백 | `docs/business/0_feedback/` | - (`/feedback` 스킬 참조) |

## 워크플로우

### /biz status — 현황 파악
1. `STATUS.md` 읽기 (현재 목표, MAO, 파일럿 현황, 오픈 이슈)
2. `HISTORY.md` 최근 변화 스캔 (맥락)
3. 7개 사업 문서 상태 점검 (최근 수정일, 미완성 항목)
4. 우선 조치 항목 제안 — 충돌 감지 시 `/biz audit` 권장

### /biz market|bm|gtm|risk|metrics|roadmap|pricing — 문서별 작업
각 명령은 해당 문서를 작성·갱신한다. 공통 절차:
1. `business.md` 규칙 준수 (한글, 측정/검증 가능, 과장 지양)
2. **가설/근거/검증 패턴 적용 대상 문서**(market/bm/risk/pricing)는 아래 구조 준수:
   ```
   ### 가설
   - <주장>

   ### 근거
   - <데이터/경험/레퍼런스>

   ### 검증 방법 (해당 시)
   - <측정/실험/인터뷰 계획>
   ```
3. 관련 사업 문서와 교차 일관성 체크 (수동) — 또는 작성 후 `/biz audit` 권장
4. 변경 사항 사용자 확인 → `/commit`

### /biz content [주제] — 콘텐츠 서브 에이전트
- 호출 방식: Task 도구 (`subagent_type: general-purpose`)
- 규칙: `.claude/rules/content.md`
- 입력 문서: `gtm.md`, `instagram.md`, `STATUS.md`, `bm.md`
- 출력 위치: `docs/content/`
- 프롬프트 템플릿 — 하단 "콘텐츠 마케터 서브 에이전트" 섹션 참조

### /biz audit [문서1] [문서2] — 교차 점검
사업 문서 간 용어·수치·가정 충돌 감지. `business.md` 8번 규칙 자동화.

**모드**:
- **전체**: `/biz audit` — 7개 문서 + STATUS 로드 후 전수 점검
- **선택**: `/biz audit bm pricing` — 지정 2개 문서 교차 비교

**확인 항목**:
| # | 항목 | 예시 |
|---|------|------|
| 1 | 가격 수치 일관성 | `bm.md` 수익 구조 vs `pricing.md` 플랜 금액 |
| 2 | 타겟 정의 일관성 | `market.md` 타겟 vs `bm.md` 사용자 vs `gtm.md` 채널 |
| 3 | 로드맵 단계 일관성 | `roadmap.md` 단계 vs 각 문서의 "3단계/4단계" 참조 |
| 4 | 핵심 지표 용어 | `STATUS.md` MAO vs 타 문서의 WAU/MAU 혼재 |
| 5 | 리스크 반영 | `risks.md` 식별 리스크가 `bm.md`/`pricing.md`에 반영됐는지 |
| 6 | 가설/근거/검증 패턴 준수 | 적용 대상 문서(market/bm/risk/pricing) |
| 7 | 오픈 이슈 추적 | STATUS.md 오픈 이슈가 관련 문서에 기록됐는지 |

**출력 형식**:
```
[biz-audit] 점검 문서: <N개>
이슈 N건:
  [CRITICAL] bm.md 프로 15,000원 vs pricing.md 프로 10,000원 — 업데이트 필요
  [WARN] market.md "교리교사" vs gtm.md "주일학교 교사" 용어 혼재
  [INFO] risks.md R05 개인정보 리스크, pricing.md에 가정으로 반영 부재
수정 제안: 각 이슈별 구체 수정안 제시
```

### /biz handoff [기능명] — SDD 작성자 핸드오프
사업 에이전트 → SDD 작성자 전환. 단독 실행이 아니라 **체인 안내**:

1. 체크리스트 확인:
   - [ ] 문제가 명확히 정의되었는가?
   - [ ] 가치/우선순위가 평가되었는가?
   - [ ] `docs/business/`에 문서화되었는가?
   - [ ] `STATUS.md`가 최신인가?
2. 핸드오프 출력 생성 (아래 형식)
3. **다음 스킬 호출 안내**:
   - 브레인스토밍 기원이면 **`/bs-to-target`** (로드맵·TARGET 등록)
   - 이미 TARGET 등록돼 있으면 **`/sdd 0`** (작업 선택 → PRD로)

**핸드오프 출력 형식**:
```markdown
## SDD 작성자 핸드오프

### 문제 정의
- 문서: `docs/business/...`
- 요약: ...

### 가치/우선순위
- 파일럿 근거: ...
- P1/P2/P3 제안: ...

### 현 상태
- 구현/운영/파일럿 등 현재 상황 요약

### 참고 사업 문서
| 문서 | 확인 포인트 |
|------|------------|
| `docs/business/...` | 어떤 맥락을 확인해야 하는지 |

### 로드맵 배치
- 단계: 2/3/4단계
- 의존성: ...

### 다음 단계
- [ ] `/bs-to-target` 또는 `/sdd 0` 호출
```

## 콘텐츠 마케터 서브 에이전트

### 서브 에이전트 프롬프트 템플릿

```
너는 콘텐츠 마케터 서브 에이전트다.
규칙: .claude/rules/content.md 를 읽고 역할을 숙지해라.

입력 문서:
- docs/business/3_gtm/gtm.md (포지셔닝)
- docs/business/3_gtm/instagram.md (콘텐츠 전략)
- docs/business/STATUS.md (현재 목표, 완료 기능)
- docs/business/2_bm/bm.md (가치 제안)

작업: [구체적 콘텐츠 제작 지시]
출력: docs/content/ 하위에 저장
```

## 작성 규칙

`business.md`의 8원칙 그대로 준수. 특히 8번(문서 간 용어/가정/수치 충돌 점검)은 `/biz audit`로 자동화.

## 관련 스킬

- `/bs` — 브레인스토밍 (3라운드 토론 + Decision Tree)
- `/bs-to-target` — 브레인스토밍 결과 → 로드맵·TARGET 편입
- `/feedback` — 신규 피드백 entries 스캐폴딩
- `/sdd 0` — SDD 작업 선택 (handoff 다음 단계)

## 참조

- 규칙: `.claude/rules/business.md`
- 콘텐츠 규칙: `.claude/rules/content.md`
- 인덱스: `docs/business/README.md`
- 콘텐츠 인덱스: `docs/content/README.md`
