# 사업 문서 워크플로우

이 문서는 사업 관점 문서를 일관된 형식으로 작성하기 위한 워크플로우입니다.
SDD 워크플로우(`docs/specs/WORKFLOW.md`)를 참고하되, 사업 문서용으로 단순화했습니다.

## 역할
- 사용자(조율자): 핵심 질문 합의, 범위/우선순위 결정, 최종 승인
- 사업 에이전트(작성자): 문서 작성, 가설/근거/검증 정리, 질문 도출

## 공통 규칙
- 모든 문서는 한글로 작성
- 모든 항목은 가설/근거/검증 방법으로 분해
- 각 단계 결과는 가설/근거/검증 방법을 유지하고, 검증 상세/진행 현황/다음 행동은 인덱스 문서로 관리
- 검증 계획은 행동 데이터 기반(기존 DB/운영 기록 중심)으로 작성
- 불명확한 부분은 질문으로 남기고, 가정은 명시
- 과장된 마케팅 문구 지양
- 사용자가 직접 수정한 내용은 의도/배경 확인 후 변경
- 필요 시 문서의 변경 이유를 짧게 기록
- 사업 내역 하나가 완료되면 사업 문서 전반을 점검하고 필요한 개선을 반영

## 문서 위치
- 문제 배경/핵심 문제: `docs/business/README.md`
- 사용자 피드백: `docs/business/0_feedback/feedback.md`
- 시장/고객/경쟁: `docs/business/1_market/market.md`
- BM/수익 구조: `docs/business/2_bm/bm.md`
- GTM/유통/온보딩: `docs/business/3_gtm/gtm.md`
- 리스크/가정: `docs/business/4_risk/risks.md`
- 핵심 지표: `docs/business/5_metrics/metrics.md`
- 단계별 로드맵: `docs/business/6_roadmap/roadmap.md`
- 가격/플랜: `docs/business/7_pricing/pricing.md`
- 다음 행동 인덱스: `docs/business/NEXT_ACTIONS.md`
- 진행 현황 인덱스: `docs/business/STATUS.md`
- 검증 인덱스: `docs/business/VERIFICATION_PLANS.md`

## 진행 전 합의(필수)
- 핵심 질문 3~5개를 먼저 제시하고 사용자와 합의한다
- 예: 타겟(교리교사/청소년국), 우선 문제(출석/행사/공지), 결제 주체 등

## 표준 흐름(7단계)

### 1단계: 시장/타겟/대체재
- 대상 문서: `docs/business/1_market/market.md`
- 산출물: 타겟 사용자, 시장 규모 가설, 대체재
- 체크리스트
  - 타겟 사용자 정의가 구체적인가?
  - 규모 가설이 검증 가능한 수치로 표현되는가?

### 2단계: BM/가치 제안
- 대상 문서: `docs/business/2_bm/bm.md`
- 산출물: 가치 제안, 고객 세그먼트, 수익 모델, 비용 구조
- 체크리스트
  - 가치 제안이 문제 가설과 연결되는가?
  - 수익 모델이 타겟/도입 단위와 일치하는가?

### 3단계: GTM/유통/온보딩
- 대상 문서: `docs/business/3_gtm/gtm.md`
- 산출물: 포지셔닝, 채널, 세일즈 모션, 온보딩
- 체크리스트
  - 채널별 가설/근거/검증이 정리되어 있는가?
  - 온라인 진입 경로가 정의되어 있는가?

### 4단계: 리스크/가정
- 대상 문서: `docs/business/4_risk/risks.md`
- 산출물: 리스크 목록, 대응 전략, 가정
- 체크리스트
  - 주요 리스크가 누락되지 않았는가?
  - 대응 전략이 검증 가능한가?

### 5단계: 지표
- 대상 문서: `docs/business/5_metrics/metrics.md`
- 산출물: NSM, 활성화/리텐션/채널/수익/운영 지표
- 체크리스트
  - 핵심 가치와 지표가 연결되는가?
  - 측정 가능한 정의가 있는가?

### 6단계: 로드맵
- 대상 문서: `docs/business/6_roadmap/roadmap.md`
- 산출물: 단계별 확장(무료 핵심→유저 확장→유료 멤버십→외부 연동)
- 체크리스트
  - 각 단계의 목표/완료 조건이 명확한가?

### 7단계: 가격/플랜(보류 가능)
- 대상 문서: `docs/business/7_pricing/pricing.md`
- 산출물: 가격 가설, 플랜 구조, 오픈 이슈
- 체크리스트
  - 가격 가설의 검증 항목이 `docs/business/VERIFICATION_PLANS.md`와 연결되는가?
  - 불확실하면 보류 사유를 명시했는가?

## 사업 → PM 전환
### 가설
- 문제 정의/가치/우선순위/로드맵/지표가 `docs/business/`에 정리되면 PRD/기능 설계를 시작할 수 있다

### 확인 항목
- 다음 문서가 최신인지 확인: `docs/business/README.md`, `docs/business/2_bm/bm.md`, `docs/business/3_gtm/gtm.md`, `docs/business/5_metrics/metrics.md`, `docs/business/6_roadmap/roadmap.md`
- 오픈 이슈/가정이 각 문서에 명시되어 있는지 점검
- 진행 현황과 다음 행동은 인덱스 문서에서 확인: `docs/business/STATUS.md`

## 검토/동기화
- 문서 간 용어/가정/수치 충돌 여부 점검
- 중요 변경 시 변경 이유를 간단히 기록
- 사용자 최종 승인 후 다음 단계 진행
