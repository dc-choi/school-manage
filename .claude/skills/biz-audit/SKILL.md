---
name: biz-audit
description: 사업 문서 7개 + STATUS 간 용어·수치·가정 충돌 자동 감지. /biz-audit [문서1] [문서2] 형식으로 호출.
---

# /biz-audit

`docs/business/`의 문서 간 일관성 점검 워크플로우. `business.md` 8번 규칙 자동화. `/biz`에서 분리됨 (원래 `/biz audit`).

## 모드

- **전체**: `/biz-audit` — 7개 문서 + STATUS 로드 후 전수 점검
- **선택**: `/biz-audit bm pricing` — 지정 2개 문서 교차 비교

## 확인 항목

| #   | 항목                     | 예시                                                                                                                   |
| --- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| 1   | 가격 수치 일관성         | `bm.md` 수익 구조 vs `pricing.md` 플랜 금액                                                                            |
| 2   | 타겟 정의 일관성         | `market.md` 타겟 vs `bm.md` 사용자 vs `gtm.md` 채널                                                                    |
| 3   | 로드맵 단계 일관성       | `roadmap.md` 단계 vs 각 문서의 "3단계/4단계" 참조                                                                      |
| 4   | 핵심 지표 용어           | `STATUS.md` MAO vs 타 문서의 WAU/MAU 혼재                                                                              |
| 5   | 리스크 반영              | `risks.md` 식별 리스크가 `bm.md`/`pricing.md`에 반영됐는지                                                             |
| 6   | 가설/근거/검증 패턴 준수 | 적용 대상 문서(market/bm/risk/pricing)                                                                                 |
| 7   | 오픈 이슈 추적           | STATUS.md 오픈 이슈가 관련 문서에 기록됐는지                                                                           |
| 8   | **STATUS 누적 섹션**     | STATUS.md에 `### 주요 변화 (X 갱신)` 섹션이 1개 초과 → **WARN** (HISTORY 이동 필요). 0건이 정상                        |
| 9   | **STATUS 메타 누적**     | STATUS.md 메타 라인의 `최종 업데이트:` 항목에 갱신 요약 2건 이상 누적 → **WARN** (1건 + HISTORY 참조 형태로 단축 필요) |

## 판정 가드 (false positive 방지)

- "용어 혼재" 같은 항목은 두 문서에 _해당 표현이 그대로_ 출현했을 때만 보고. 의미적 유사 추론으로 검출 X.
- "가정 부재" 추론은 근거 인용 강제 — 어느 문서 어느 섹션에서 부재가 확인됐는지 명시.
- 확신 없는 항목은 [INFO]로 강등하지 말고 보고 폐기. 등급은 _영향_ 기준이지 _확신도_ 기준 X (`/pre-pr` 가드 §6와 동일 원칙).

## 출력 형식

```
[biz-audit] 점검 문서: <N개>
이슈 N건:
  [CRITICAL] bm.md 프로 15,000원 vs pricing.md 프로 10,000원 — 업데이트 필요
  [WARN] STATUS.md 주요 변화 섹션 3개 누적 (05-05/05-04/05-03) — HISTORY로 이동 필요
  [WARN] market.md "교리교사" vs gtm.md "주일학교 교사" 용어 혼재
  [INFO] risks.md R05 개인정보 리스크, pricing.md에 가정으로 반영 부재
수정 제안: 각 이슈별 구체 수정안 제시
```

## 관련

- 호출 시점: `/biz status`가 충돌 감지 시 권장, 또는 사업 문서 갱신 직후
- 분리 전 위치: `.claude/skills/biz/SKILL.md` 안 `/biz audit` 섹션
- 규칙: `.claude/rules/business.md` 8번 항목 (문서 간 용어/가정/수치 충돌 점검)
