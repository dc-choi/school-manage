# /biz-pulse — MCP 조회 명세

`SKILL.md`의 입력 2(GA4) / 입력 3(Clarity) 상세 조회 스펙. SKILL.md에서 분리해 190줄 제한을 지킨다.

## GA4 (자동 조회)

`mcp__google-analytics__*` 도구로 아래 **10개 카테고리를 한 메시지에 병렬 호출**한다 (응답 작아 단일 메시지에서 처리 가능). 공통값:

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

### 호출 1 — 일자별 트래픽 (전주 대비)

- 도구: `run_report`, **두 기간 date_ranges**
- dimensions: `["date"]`
- metrics: `["screenPageViews","activeUsers","newUsers","sessions","engagedSessions","averageSessionDuration","screenPageViewsPerSession","eventCount","bounceRate"]`
- order_bys: `[{"dimension":{"dimension_name":"date"}}]`

### 호출 2 — 트래픽 소스

- 도구: `run_report`
- dimensions: `["sessionDefaultChannelGroup","sessionMedium","sessionSource"]`
- metrics: `["sessions","activeUsers","engagedSessions"]`
- order_bys: `[{"metric":{"metric_name":"sessions"},"desc":true}]`

### 호출 3 — 디바이스 / OS

- 도구: `run_report`
- dimensions: `["deviceCategory","operatingSystem"]`
- metrics: `["activeUsers","sessions","screenPageViews"]`

### 호출 4 — 지리

- 도구: `run_report`
- dimensions: `["country","region","city"]`
- metrics: `["activeUsers","sessions"]`
- order_bys: `[{"metric":{"metric_name":"activeUsers"},"desc":true}]`
- limit: 30

### 호출 5 — 페이지별 TOP 20

- 도구: `run_report`
- dimensions: `["pagePath"]`
- metrics: `["screenPageViews","activeUsers","averageSessionDuration","userEngagementDuration"]`
- order_bys: `[{"metric":{"metric_name":"screenPageViews"},"desc":true}]`
- limit: 20

### 호출 6 — 이벤트 전체

- 도구: `run_report`
- dimensions: `["eventName"]`
- metrics: `["eventCount","totalUsers"]`
- order_bys: `[{"metric":{"metric_name":"eventCount"},"desc":true}]`

<!-- prettier-ignore-start -->
### 호출 7 — 온보딩 첫 사용 이벤트 (eventName이 first_로 시작)

- 도구: `run_report`
- dimensions: `["eventName"]`
- metrics: `["eventCount","totalUsers"]`
- dimension_filter:

```json
{"filter":{"field_name":"eventName","string_filter":{"match_type":"BEGINS_WITH","value":"first_"}}}
```
<!-- prettier-ignore-end -->

### 호출 8 — 커스텀 디멘션 (조직/계정별)

- 도구: `run_report`
- dimensions: `["customEvent:campaign","customEvent:content"]` (= `organization_name`, `account_name`)
- metrics: `["activeUsers","eventCount"]`
- order_bys: `[{"metric":{"metric_name":"activeUsers"},"desc":true}]`

### 호출 9 — 요일 × 시간대

- 도구: `run_report`
- dimensions: `["dayOfWeek","hour"]`
- metrics: `["activeUsers","sessions"]`

### 호출 10 — 실시간

- 도구: `run_realtime_report` (date_ranges 없음)
- dimensions: `["country","deviceCategory"]`
- metrics: `["activeUsers"]`

> 셋업 일반 절차는 [`docs/guides/ga4-mcp.md`](../../../docs/guides/ga4-mcp.md). 도메인 무관 e-commerce/광고 metric은 의도적으로 제외했다 (노이즈 회피).

## Clarity (자동 조회)

`mcp__clarity__*` 도구로 **5개 고정 호출**. GA4와 한 메시지에 같이 병렬 호출 가능.

> **GA4와 중복 회피 (핵심 원칙)**: 트래픽/세션/유입 소스/디바이스 분포 등 GA4가 주는 지표는 Clarity로 다시 부르지 않는다. Clarity 5개는 전부 **GA4가 구조적으로 못 주는 마찰 신호**(rage/dead click, excessive scroll, quickback click, script error, 세분 스크롤 깊이, 세션 리플레이)에 집중한다. 차원(URL/OS/Device)은 그 마찰이 _어디서_ 나는지 좁히는 용도일 뿐, 차원별 트래픽 카운트가 목적이 아니다.

> **요청 예산 주의**: Clarity Data Export는 **하루 10요청 / 프로젝트** 한도. biz-pulse는 하루 1회 실행 기준 5개를 쓰고, 나머지 5개는 ad-hoc 여유분으로 남긴다. `numOfDays`는 최대 3, 차원은 요청당 최대 3개, 집계 지표만 (영상 원본 아님).

### Clarity 호출 1 — 전체 마찰 추세 (최근 3일, 차원 없음)

- 도구: `mcp__clarity__query-analytics-dashboard`
- 질의(자연어): "최근 3일 일자별 rage click, dead click, excessive scroll, quickback click, script error 총합 추세"
- numOfDays=3, 차원 없음 → 마찰 베이스라인

### Clarity 호출 2 — 페이지별 마찰 신호 (최근 3일)

- 도구: `mcp__clarity__query-analytics-dashboard`
- 질의(자연어): "최근 3일 URL별 rage click, dead click, excessive scroll, quickback click, script error — 마찰 큰 페이지 순으로"
- numOfDays=3, dimension=URL

### Clarity 호출 3 — 환경별 마찰 (최근 3일)

- 도구: `mcp__clarity__query-analytics-dashboard`
- 질의(자연어): "최근 3일 OS와 브라우저별 script error, dead click, rage click — 특정 환경에서만 터지는 버그 신호"
- numOfDays=3, dimension=OS + Browser

### Clarity 호출 4 — 디바이스별 스크롤 깊이 & 이탈 (최근 3일)

- 도구: `mcp__clarity__query-analytics-dashboard`
- 질의(자연어): "최근 3일 디바이스별 평균 스크롤 깊이, quickback click — 콘텐츠를 안 읽고 튕기는지"
- numOfDays=3, dimension=Device
- GA4의 scroll 이벤트는 90% 단일 트리거뿐 — Clarity는 세분 스크롤 깊이 %를 준다

### Clarity 호출 5 — 마찰 세션 리플레이 목록 (최근 3일)

- 도구: `mcp__clarity__list-session-recordings`
- 필터: rage click 발생 또는 JS error 발생 세션
- 출력: 실제 확인할 세션 리플레이 링크 TOP — 사용자가 직접 볼 후보

## 관련

- `SKILL.md` — biz-pulse 본체
- `docs/guides/ga4-mcp.md` — GA4 MCP 셋업 절차
- 메모리: `project_ga4_mcp_setup.md` / `project_clarity_mcp_setup.md` — 자격증명/식별자
