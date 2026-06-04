---
name: biz-pulse
description: 매일 21:00 DB 운영 메일 본문 paste + GA4/Clarity MCP 자동 조회로 정량 스냅샷을 만들어 STATUS 갱신 근거를 제공한다. /biz-pulse 로 호출.
---

# /biz-pulse

사업 운영 맥박(정량 스냅샷). `/biz status`의 정성 점검을 정량으로 보강한다.

## 왜 분리됐나

운영 DB에 직접 붙으면 실수로 데이터 유실 위험이 있어, 운영자가 매일 21:00에 받는 DB 요약 메일을 **사용자가 paste**하는 방식으로 정량 데이터를 수집한다. GA4/Clarity 데이터는 MCP로 자동 조회.

## 입력

### 1. DB 메일 본문 (사용자 paste, 필수)

매일 21:00 수신되는 메일에 다음 항목이 포함되어 있다:

- **사회적 마케팅 지표** (가입/유입 funnel 등)
- **단체별 데이터 입력 현황** (어느 organization이 출석/학생 입력을 잘 하고 있는지)
- **단체별 계정 분포** (organization 당 account 수)

> 메일 형식이 표준화돼 있지 않을 수 있으므로 본문 paste 후 어시스턴트가 항목명/수치를 추출한다. 추출이 애매하면 사용자에게 되묻는다.

### 2. GA4 (자동 조회)

`mcp__google-analytics__*` 도구로 10개 카테고리를 한 메시지에 병렬 호출한다. 트래픽/소스/디바이스/지리/페이지/이벤트/온보딩 퍼널/조직별 활동/시간대/실시간. 상세 스펙은 [`queries.md`](queries.md) 참조.

### 3. Clarity (자동 조회)

`mcp__clarity__*` 도구로 5개 고정 호출. **GA4가 못 주는 마찰 신호 전용** — 전체 마찰 추세, 페이지별 마찰, 환경별 마찰, 디바이스별 스크롤 깊이, 마찰 세션 리플레이 목록. 트래픽/소스/디바이스 분포는 GA4 담당이라 Clarity로 중복 조회하지 않는다. 상세 스펙은 [`queries.md`](queries.md) 참조.

> Clarity Data Export는 **하루 10요청 한도** — biz-pulse는 하루 1회 실행 기준 5개를 쓰고 나머지 5개는 ad-hoc 여유분으로 남긴다.

## 실행 흐름

1. 사용자: `/biz-pulse` 입력
2. 어시스턴트: "오늘 21:00 DB 운영 메일 본문을 붙여넣어 주세요. (오늘 메일이 없으면 가장 최근 메일 OK)" 요청
3. 사용자: 메일 본문 paste
4. 어시스턴트: 메일 파싱 + GA4 MCP 10개 병렬 호출 + Clarity MCP 5개 호출 (한 메시지에 다중 호출)
5. 정량 스냅샷 출력 (아래 형식)
6. **변화 신호 있으면** `/biz status`로 진행해 STATUS 반영 안내

## 출력 형식

GA4 10개 + Clarity 5개 호출 결과를 각각 짧은 표/요약으로 정리하고, 마지막에 DB 메일 추출 + 변화 신호를 종합한다. 표가 너무 길면 TOP N으로 잘라낸다 (예: 페이지/지리/이벤트는 상위 20).

```markdown
## 정량 스냅샷 (YYYY-MM-DD)

### GA4 (최근 7일, 전주 비교)

**1. 일자별 트래픽**
| 날짜 | 요일 | PV | AU | 신규 | 세션 | 참여세션 | 평균체류 | 이탈률 |
| ... |
전주 대비: PV ±N% / AU ±N% / 세션 ±N% / 신규 ±N%

**2. 트래픽 소스** — 채널/매체/출처 TOP. Direct vs Organic vs Social 비율
**3. 디바이스 / OS** — 모바일 N% / 데스크톱 N%, iOS vs Android
**4. 지리** — 국가/지역/도시 TOP. (서울/부산 등 본당 분포 추론)
**5. 페이지 TOP 20** — pagePath별 PV/AU/체류
**6. 이벤트 전체** — eventName별 카운트

<!-- prettier-ignore -->
**7. 온보딩 첫 사용 퍼널** — `first_group_created`, `first_student_*`, `first_attendance_*`
**8. 조직/계정별 활동** — organization_name × account_name TOP (커스텀 디멘션)
**9. 요일 × 시간대 패턴** — 피크 요일/시간 1~2줄 요약
**10. 실시간** — 호출 시점 활성 사용자

### Clarity (최근 3일, 행동 분석)

**C1. 전체 마찰 추세** — 일자별 rage·dead click / excessive scroll / quickback / script error 총합
**C2. 페이지별 마찰** — URL별 rage·dead click / excessive scroll / script error TOP
**C3. 환경별 마찰** — OS·브라우저별 script error / dead·rage click (특정 환경 버그)
**C4. 디바이스 스크롤 깊이** — 디바이스별 평균 스크롤 깊이 / quickback (콘텐츠 도달률)
**C5. 마찰 세션 리플레이** — rage click / JS error 세션 리플레이 링크 TOP

### DB 메일 (YYYY-MM-DD 21:00 기준)

- 사회적 마케팅 지표: [메일 추출]
- 단체별 입력 현황: [활성 N개 / 입력 0건 N개 / ...]
- 단체별 계정 분포: [평균 N계정, 최대 N, 휴면 N개 ...]

### 변화 신호 (STATUS 반영 후보)

- [STATUS 후보] ... — 전주 대비 ±30% 이상 또는 휴면/이탈 신호 (큰 변화)
- [관찰] ... — 단순 기록 (커밋 메시지 한 줄, STATUS 본문 변경 불필요)
- [경고] ... — 휴면 단체 증가, first\_\* 퍼널 단절, 신규 가입 0건 지속, rage click/script error 급증 등
```

## STATUS 반영 가이드

큰 변화(전주 대비 ±30% 이상 또는 휴면/이탈 신호)는 **STATUS 본문(실측 표/파일럿/오픈 이슈)을 최신 값으로 갱신**하고, "무엇이 왜 바뀌었나"는 **커밋 메시지에 충실히 서술**한다 (`/biz` SKILL의 STATUS 갱신 절차 Step 1~4 준수). STATUS에 `### 주요 변화` 섹션을 만들지 않는다.

작은 변화는 `/biz pulse` 출력만 보존 (커밋 X) 또는 사용자가 판단해서 커밋 메시지 한 줄로 기록.

## 빈도 가이드

- **매일**: 메일이 매일 오므로 매일 실행 가능. 다만 매일 STATUS 갱신이 필요하지는 않다 (변화 신호가 있을 때만 반영)
- **최소 주 1회**: STATUS 정성 점검(`/biz status`)과 함께 묶어서 실행하면 효율적

## 출력 보존

이 스킬은 기본적으로 **휘발성** (커밋되는 산출물 없음). 사용자가 명시적으로 요청할 때만:

- `docs/business/STATUS.md` 갱신 (정량 근거 반영)
- 변화 서사는 커밋 메시지에 기록 (별도 이력 파일 없음 — git이 보존)

> **"진행" 동의의 범위 (중요)**: 펄스 출력 뒤 사용자의 짧은 동의("진행", "전부 다 진행" 등)는 **STATUS 정량 갱신 + 그 커밋까지만** 승인한 것으로 본다. 신규 PRD/스펙 문서 작성, SDD 착수, 코드 변경은 **별도의 명시적 지시**("스펙 써줘", "이거 만들어줘")가 있을 때만 시작한다. 특히 펄스가 "조건 충족 후 권장"으로 단서를 단 작업은 그 조건 전에 착수하지 않는다. (2026-06-04 삼계 LUNA 펄스에서 짧은 동의를 PRD 작성/SDD 등록까지 확대 → 롤백한 사례)

## 관련

- `queries.md` — GA4/Clarity MCP 조회 상세 명세
- `/biz status` — 정성 점검 + 본 스킬 출력으로 STATUS 갱신
- `/biz` — 사업 워크플로우 전체
- `docs/guides/ga4-mcp.md` — GA4 MCP 셋업 절차
- 메모리: `project_ga4_mcp_setup.md` / `project_clarity_mcp_setup.md`
