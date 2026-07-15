# 사업 문서

사업 관점 문서 인덱스입니다.
문서 작성 흐름: 문제 식별 → 가설 → 검증

## 비전

- **포지셔닝 (2026-06-12 확정)**: 가톨릭 교리교사의 주일을 운영하는 도구 — 브랜드 약속 "주일 아침 미사 직전에도, 이거 하나면 됩니다" (전략 원문: `docs/brainstorm/2026-06-12/brand-strategy-draft.md`)
- **핵심 관찰**: 출석 "기록"보다 "빠른 조회"가 핵심 가치 (장위동 4년). 축일/세례명 활용은 "가톨릭 맥락을 아는 도구"라는 차별화 가설의 근거이며, 경쟁 현황은 시장 결정 전 다시 확인한다
- **현재 검증**: 주일학교 중고등부 PMF 검증 중. 전 그룹 확장은 회의록 출시 이후 재검토한다 (확장 비전은 내부 나침반 — 외부 노출 금지)
- **확정 사업 실험**: Free Core는 기존/신규 모든 조직에 현재 핵심 기능을 무료로 유지한다. 2026-09-01부터 2026-11-29까지 90일간 Paid Parish Operations의 100,000원 진단과 300,000원 학기 패키지를 우선 검증하고, 모든 계약/손익 게이트 통과 시에만 600,000원 연간 지원을 제안한다. 1,200,000원 단계와 신규 Basic/Pro 기능 개발은 이번 범위에서 제외한다

## 문서 목록

- `docs/business/0_feedback/feedback.md` 사용자 피드백 (인덱스)
- `docs/business/0_feedback/entries/YYYY-MM-DD-<이름>.md` 날짜/사람별 개별 피드백
- `docs/business/0_feedback/feedback-categories.md` 기능 카테고리별 피드백 항목
- `docs/business/1_market/market.md` 시장/고객/경쟁
- `docs/business/1_market/competitive-analysis.md` 경쟁사 상세 분석
- `docs/business/1_market/personas.md` 단체/행동 페르소나와 검증 코호트
- `docs/business/2_bm/bm.md` BM/수익 구조
- `docs/business/2_bm/bm-funding.md` 자금 조달 + 사업자 정보/계좌 SSoT (상호/등록번호/후원 계좌)
- `docs/business/3_gtm/gtm.md` 유통/세일즈/온보딩
- `docs/business/3_gtm/instagram.md` 인스타그램 운영 계획
- `docs/business/3_gtm/instagram-analytics-2026-04-28.md` 인스타그램 과거 분석 스냅샷
- `docs/business/4_risk/risks.md` 리스크/가정
- `docs/business/4_risk/risks-pmf.md` 사용자/도입 리스크
- `docs/business/4_risk/risks-product.md` 제품/시장 리스크
- `docs/business/4_risk/risks-business.md` 수익화/법규 리스크
- `docs/business/5_metrics/metrics.md` 핵심 지표
- `docs/business/6_roadmap/roadmap.md` 단계별 확장 로드맵
- `docs/business/7_pricing/pricing.md` 가격 가설/플랜
- `docs/business/STATUS.md` 진행 현황 (현재 상태만 — 변화 이력은 `git log docs/business/`)
- `docs/brainstorm/2026-07-15/revenue-viability.md` 2026년 9월 90일 사업 검증 결정과 실행 기준
- `docs/brainstorm/2026-07-15/partial-monetization.md` Free Core와 Paid Parish Operations의 무료/유료 경계 결정

## 단일 출처 원칙

| 질문 | 단일 출처 |
| --- | --- |
| 현재 운영 수치와 오픈 이슈 | `STATUS.md` |
| 지표 정의와 산식 | `5_metrics/metrics.md` |
| 단계 범위와 진입 조건 | `6_roadmap/roadmap.md` |
| 가격과 플랜 가설 | `7_pricing/pricing.md` |
| 사업자 정보와 후원 계좌 | `2_bm/bm-funding.md`와 해당 코드 상수 |
| 구현 완료 여부 | `docs/specs/README.md`와 코드 |
| 시장/경쟁 현재 사실 | 조사일과 출처가 있는 최신 기록, 의사결정 전 재확인 |
| PG 계약, 신고, 인터뷰 등 외부 상태 | 확인일과 증빙이 있는 최신 기록, 미확인 시 `확인 필요` |
| 2026년 9월 90일 사업 검증 범위와 판정 | `docs/brainstorm/2026-07-15/revenue-viability.md` |
| Free Core와 Paid Parish Operations의 무료/유료 경계 | `docs/brainstorm/2026-07-15/partial-monetization.md` |

다른 문서에는 현재 수치를 복제하지 않는다. 분석에 과거 수치가 필요하면 스냅샷 기준일을 제목 또는 표에 명시한다.

## 문제 배경

- 주일학교 운영 범위가 넓다: 학기별 교리/주말 미사 준비부터 캠프/피정 같은 대규모 행사까지 모두 교리교사가 담당한다
- 행정 반복과 분산: 출석/학생/행사 정보를 매년/매주 재작성하고, 엑셀/수기/회의록에 흩어 기록해 재작업이 많다
- 현장 대응/보고 부담: 필요한 정보를 즉시 찾기 어렵고, 통계/보고/공지도 수작업이라 의사결정과 커뮤니케이션이 느리다
- 결과적으로 교리교사 피로도가 높아지고, 자동화/표준화에 대한 필요성이 크다
- 본당 차원의 최종 의사결정자는 본당 사제이며, 교구 시스템/예산 결정은 주교 권한이다. 통계/보고의 정확성과 전달 속도가 의사결정에 직접 영향을 준다

## 사용자 피드백

- 사용자 피드백은 `docs/business/0_feedback/feedback.md`에서 별도로 관리한다

## 등록제 정의

- 등록제는 기본 연 1회 기준이며 일부 본당은 학기 단위로 운영
- 등록 신청 여부와 관계없이 출석 가능, 등록 시 보상 제공
- 보상 기준은 본당별로 상이

## 핵심 문제

| 문제                | 설명                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| 1. 주간 정보 분산   | 출석 확인/축일/멤버 현황이 엑셀/수기/검색에 흩어져 매주 여러 도구를 열어야 함 |
| 2. 반복 행정        | 출석/학생/행사 자료 재입력/정리/보고로 피로도 높음                            |
| 3. 정보 접근성      | 필요한 정보에 즉시 접근 못해 현장 처리 지연/누락                              |
| 4. 데이터 일관성    | 분산 기록(파일/카카오톡/수기)으로 불일치 발생                                 |
| 5. 의사결정 지연    | 통계/보고/공지 수작업으로 사제 승인 리드타임 지연                             |
| 6. 행사 자동화 부족 | 체크리스트/역할/물품/연락 수기 관리로 누락/재작업                             |
