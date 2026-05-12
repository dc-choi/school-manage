---
name: biz-pulse
description: 매일 21:00 DB 운영 메일 본문 paste + GA4 MCP 자동 조회로 정량 스냅샷을 만들어 STATUS 갱신 근거를 제공한다. /biz-pulse 로 호출.
---

# /biz-pulse

사업 운영 맥박(정량 스냅샷). `/biz status`의 정성 점검을 정량으로 보강한다.

## 왜 분리됐나

운영 DB에 직접 붙으면 실수로 데이터 유실 위험이 있어, 운영자가 매일 21:00에 받는 DB 요약 메일을 **사용자가 paste**하는 방식으로 정량 데이터를 수집한다. GA4 데이터는 MCP로 자동 조회.

## 입력

### 1. DB 메일 본문 (사용자 paste, 필수)

매일 21:00 수신되는 메일에 다음 항목이 포함되어 있다:

- **사회적 마케팅 지표** (가입/유입 funnel 등)
- **단체별 데이터 입력 현황** (어느 organization이 출석/학생 입력을 잘 하고 있는지)
- **단체별 계정 분포** (organization 당 account 수)

> 메일 형식이 표준화돼 있지 않을 수 있으므로 본문 paste 후 어시스턴트가 항목명/수치를 추출한다. 추출이 애매하면 사용자에게 되묻는다.

### 2. GA4 (자동 조회)

`mcp__google-analytics__*` 도구로 아래 **10개 카테고리를 한 메시지에 병렬 호출**한다 (응답 작아 모두 단일 메시지에서 처리 가능). 모든 호출의 공통값:

- `property_id`: `"properties/521847047"`
- `date_ranges` (호출 1·5처럼 추이 보는 항목은 전주 대비를 위해 두 기간):
    ```json
    [
        { "start_date": "7daysAgo", "end_date": "yesterday", "name": "current" },
        { "start_date": "14daysAgo", "end_date": "8daysAgo", "name": "previous" }
    ]
    ```
- 그 외(호출 2~4, 6~9)는 단일 기간 `[{"start_date": "7daysAgo", "end_date": "yesterday"}]`로 충분
- `order_bys`는 protobuf snake_case 필수: `{"dimension": {"dimension_name": "date"}}` 또는 `{"metric": {"metric_name": "screenPageViews"}, "desc": true}` — camelCase는 `Unknown field` 에러
- 모든 dimension/metric 이름은 GA4 표준 API 이름 (e.g. `screenPageViews`, `sessionDefaultChannelGroup`)

#### 호출 1 — 일자별 트래픽 (전주 대비)

- 도구: `run_report`, **두 기간 date_ranges**
- dimensions: `["date"]`
- metrics: `["screenPageViews","activeUsers","newUsers","sessions","engagedSessions","averageSessionDuration","screenPageViewsPerSession","eventCount","bounceRate"]`
- order_bys: `[{"dimension":{"dimension_name":"date"}}]`

#### 호출 2 — 트래픽 소스

- 도구: `run_report`
- dimensions: `["sessionDefaultChannelGroup","sessionMedium","sessionSource"]`
- metrics: `["sessions","activeUsers","engagedSessions"]`
- order_bys: `[{"metric":{"metric_name":"sessions"},"desc":true}]`

#### 호출 3 — 디바이스 / OS

- 도구: `run_report`
- dimensions: `["deviceCategory","operatingSystem"]`
- metrics: `["activeUsers","sessions","screenPageViews"]`

#### 호출 4 — 지리

- 도구: `run_report`
- dimensions: `["country","region","city"]`
- metrics: `["activeUsers","sessions"]`
- order_bys: `[{"metric":{"metric_name":"activeUsers"},"desc":true}]`
- limit: 30

#### 호출 5 — 페이지별 TOP 20

- 도구: `run_report`
- dimensions: `["pagePath"]`
- metrics: `["screenPageViews","activeUsers","averageSessionDuration","userEngagementDuration"]`
- order_bys: `[{"metric":{"metric_name":"screenPageViews"},"desc":true}]`
- limit: 20

#### 호출 6 — 이벤트 전체

- 도구: `run_report`
- dimensions: `["eventName"]`
- metrics: `["eventCount","totalUsers"]`
- order_bys: `[{"metric":{"metric_name":"eventCount"},"desc":true}]`

#### 호출 7 — 온보딩 first\_\* 이벤트

- 도구: `run_report`
- dimensions: `["eventName"]`
- metrics: `["eventCount","totalUsers"]`
- dimension*filter: `{"filter":{"field_name":"eventName","string_filter":{"match_type":"BEGINS_WITH","value":"first*"}}}`

#### 호출 8 — 커스텀 디멘션 (조직/계정별)

- 도구: `run_report`
- dimensions: `["customEvent:campaign","customEvent:content"]` (= `organization_name`, `account_name`)
- metrics: `["activeUsers","eventCount"]`
- order_bys: `[{"metric":{"metric_name":"activeUsers"},"desc":true}]`

#### 호출 9 — 요일 × 시간대

- 도구: `run_report`
- dimensions: `["dayOfWeek","hour"]`
- metrics: `["activeUsers","sessions"]`

#### 호출 10 — 실시간

- 도구: `run_realtime_report` (date_ranges 없음)
- dimensions: `["country","deviceCategory"]`
- metrics: `["activeUsers"]`

> 셋업 일반 절차는 [`docs/guides/ga4-mcp.md`](../../../docs/guides/ga4-mcp.md). 도메인 무관 e-commerce/광고 metric은 의도적으로 제외했다 (노이즈 회피).

## 실행 흐름

1. 사용자: `/biz-pulse` 입력
2. 어시스턴트: "오늘 21:00 DB 운영 메일 본문을 붙여넣어 주세요. (오늘 메일이 없으면 가장 최근 메일 OK)" 요청
3. 사용자: 메일 본문 paste
4. 어시스턴트: 메일 파싱 + GA4 MCP 병렬 호출 (한 번에 도구 다중 호출)
5. 정량 스냅샷 출력 (아래 형식)
6. **변화 신호 있으면** `/biz status`로 진행해 STATUS 반영 안내

## 출력 형식

10개 GA4 호출 결과를 각각 짧은 표/요약으로 정리하고, 마지막에 DB 메일 추출 + 변화 신호를 종합한다. 표가 너무 길면 TOP N으로 잘라낸다 (예: 페이지/지리/이벤트는 상위 20).

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
**7. 온보딩 first\_\* 퍼널** — first*group_created, first_student*_, first*attendance*_
**8. 조직/계정별 활동** — organization_name × account_name TOP (커스텀 디멘션)
**9. 요일 × 시간대 패턴** — 피크 요일/시간 1~2줄 요약
**10. 실시간** — 호출 시점 활성 사용자

### DB 메일 (YYYY-MM-DD 21:00 기준)

- 사회적 마케팅 지표: [메일 추출]
- 단체별 입력 현황: [활성 N개 / 입력 0건 N개 / ...]
- 단체별 계정 분포: [평균 N계정, 최대 N, 휴면 N개 ...]

### 변화 신호 (STATUS 반영 후보)

- [STATUS 후보] ... — 전주 대비 ±30% 이상 또는 휴면/이탈 신호 (큰 변화)
- [관찰] ... — 단순 기록, HISTORY 라인
- [경고] ... — 휴면 단체 증가, first\_\* 퍼널 단절, 신규 가입 0건 지속 등
```

## STATUS 반영 가이드

큰 변화(전주 대비 ±30% 이상 또는 휴면/이탈 신호)는 **HISTORY 상단에 `## 주요 변화 (오늘 갱신)`로 직접 추가**한다. STATUS 본문에는 `### 주요 변화` 섹션을 새로 만들지 않는다 (`/biz` SKILL의 STATUS 갱신 절차 Step 1~4 준수).

작은 변화는 `/biz pulse` 출력만 보존 (커밋 X) 또는 사용자가 판단해서 HISTORY 라인 추가.

## 빈도 가이드

- **매일**: 메일이 매일 오므로 매일 실행 가능. 다만 매일 STATUS/HISTORY 갱신이 필요하지는 않다 (변화 신호가 있을 때만 반영)
- **최소 주 1회**: STATUS 정성 점검(`/biz status`)과 함께 묶어서 실행하면 효율적

## 출력 보존

이 스킬은 기본적으로 **휘발성** (커밋되는 산출물 없음). 사용자가 명시적으로 요청할 때만:

- `docs/business/HISTORY.md` 상단에 변화 라인 추가
- `docs/business/STATUS.md` 갱신 (정량 근거 반영)

## 관련

- `/biz status` — 정성 점검 + 본 스킬 출력으로 STATUS 갱신
- `/biz` — 사업 워크플로우 전체
- `docs/guides/ga4-mcp.md` — GA4 MCP 셋업 절차
- 메모리: `project_ga4_mcp_setup.md` — 본인 자격증명/속성 식별자
