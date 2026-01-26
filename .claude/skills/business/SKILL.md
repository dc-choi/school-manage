---
name: business
description: 사업 에이전트 워크플로우 실행
---

# /business

사업 문서 작성 및 관리 워크플로우를 실행합니다.

## 사용법

```
/business              # 현황 확인 및 다음 작업 안내
/business status       # STATUS.md 확인
/business market       # 시장/경쟁 분석
/business bm           # 사업 모델
/business gtm          # GTM 전략
/business risk         # 리스크/가정
/business metrics      # 지표 설계
/business roadmap      # 로드맵
/business pricing      # 가격 정책
/business handoff      # PM 에이전트 핸드오프
```

## 역할 정의

| 역할 | 관점 | 질문 | 산출물 |
|------|------|------|--------|
| **사업 에이전트** | **Why** | "왜 이걸 해야 하는가?" | 문제 정의, 로드맵 |
| PM 에이전트 | What | "무엇을 만들어야 하는가?" | PRD, 기능 설계 |
| SDD 작성자 | How | "어떻게 구현할 것인가?" | Feature/Task/Dev |

## 문서 위치

| 문서 | 경로 |
|------|------|
| 인덱스 | `docs/business/README.md` |
| 시장/경쟁 분석 | `docs/business/1_market/market.md` |
| 사업 모델 | `docs/business/2_bm/bm.md` |
| GTM 전략 | `docs/business/3_gtm/gtm.md` |
| 리스크/가정 | `docs/business/4_risk/risks.md` |
| 지표 설계 | `docs/business/5_metrics/metrics.md` |
| 로드맵 | `docs/business/6_roadmap/roadmap.md` |
| 가격 정책 | `docs/business/7_pricing/pricing.md` |
| 진행 현황 | `docs/business/STATUS.md` |

## 워크플로우

### 1. 현황 파악
```
/business status
```
- `docs/business/STATUS.md` 확인
- 각 문서 상태 점검
- 미완성 항목 식별

### 2. 문서별 작업

#### /business market - 시장/경쟁 분석
- 타겟 시장 정의
- 경쟁사 분석
- 시장 기회 식별
- **가설/근거/검증** 패턴 적용

#### /business bm - 사업 모델
- 가치 제안 정의
- 수익 모델 설계
- 비용 구조 분석
- **가설/근거/검증** 패턴 적용

#### /business gtm - GTM 전략
- 출시 전략
- 마케팅 채널
- 초기 사용자 확보 방안
- 실행 계획 중심 (가설 패턴 미적용)

#### /business risk - 리스크/가정
- 핵심 가정 나열
- 리스크 식별
- 대응 방안
- **가설/근거/검증** 패턴 적용

#### /business metrics - 지표 설계
- 핵심 지표 정의
- 측정 방법
- 목표값 설정
- 정의 중심 (가설 패턴 미적용)

#### /business roadmap - 로드맵
- 단계별 목표
- 마일스톤 정의
- 일정 계획
- 일정 중심 (가설 패턴 미적용)

#### /business pricing - 가격 정책
- 가격 모델
- 티어 구성
- 경쟁사 비교
- **가설/근거/검증** 패턴 적용

### 3. PM 에이전트 핸드오프
```
/business handoff
```

#### 체크리스트
- [ ] 문제가 명확히 정의되었는가?
- [ ] 가치/우선순위가 평가되었는가?
- [ ] `docs/business/`에 문서화되었는가?
- [ ] `docs/business/STATUS.md`가 최신인가?

#### 출력 형식
```markdown
---
## PM 에이전트 핸드오프

### 문제 정의
- 문서: `docs/business/...`
- 요약: ...

### 가치/우선순위
- ...

### 로드맵 배치
- ...

### 다음 단계
PM 에이전트가 PRD 작성 시작
---
```

## 작성 규칙

1. 모든 문서는 **한글로 작성**
2. **측정 가능하거나 검증 가능한 문장** 우선
3. 불명확한 부분은 질문으로 남기고 가정 명시
4. 과장된 마케팅 문구 지양
5. 사용자가 직접 바꾼 내용은 의도 확인 후 수정

## 참조

- 규칙: `.claude/rules/business.md`
- 인덱스: `docs/business/README.md`