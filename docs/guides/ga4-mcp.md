# GA4 MCP 셋업 가이드

이 프로젝트는 **Google Analytics 공식 MCP 서버**(`googleanalytics/google-analytics-mcp`)를 통해 Claude Code에서 직접 GA4 데이터를 조회한다. 합류자가 본인 환경에서 셋업하는 절차를 정리한다.

> 사용자 측 GA4 트래커(웹 앱의 측정 ID, 이벤트 등) 셋업은 [`ga4-setup.md`](./ga4-setup.md)를 참조한다. 본 문서는 **Claude Code ↔ GA4 Admin/Data API 연결**만 다룬다.

## 무엇이고 왜

- Claude Code 내부에서 `mcp__google-analytics__*` 도구로 PV·세션·퍼널·실시간 사용자 등을 조회 가능
- STATUS 작성, 인사이트 도출, 전환 분석을 자동화 (사용자가 일일이 GA4 UI를 안 봐도 됨)
- 인증은 **본인 GCP 프로젝트의 OAuth Client + ADC** 방식 — 서비스 계정 키 파일을 git에 두지 않는다

## 사전 요건

- 본인의 Google 계정이 대상 GA4 속성에 접근 권한 보유 (조회 수준이면 충분)
- 본인의 GCP 프로젝트 (없으면 새로 생성)
- macOS 기준: `pipx`, `gcloud` CLI 설치

```bash
brew install pipx gcloud
pipx ensurepath
```

## 1단계: analytics-mcp 영구 설치

```bash
pipx install analytics-mcp
which analytics-mcp   # 경로 확인 (보통 ~/.local/bin/analytics-mcp)
```

## 2단계: 본인 GCP 프로젝트에서 OAuth Consent Screen 셋업

브라우저에서:

```
https://console.cloud.google.com/apis/credentials/consent
```

본인 프로젝트 선택 → 다음 순서로 설정:

1. **User Type: External** → Create
2. **App name**: 임의(`school-back-ga4` 등). 본인 Gmail을 user support email/developer contact로 입력
3. **Scopes 단계는 그냥 Save and Continue** — 런타임에 `--scopes` 인자로 줄 것
4. **Test users 단계 → + Add Users → 본인 Gmail 추가** (필수)
5. Save

> 앱이 verified 상태가 아니라 일반 OAuth Client는 `analytics.readonly` 같은 sensitive scope를 거부한다. **Testing 모드 + Test user 등록**이 이 차단을 우회하는 표준 절차다.

## 3단계: OAuth Client ID 발급

```
https://console.cloud.google.com/apis/credentials
```

- **+ Create Credentials → OAuth client ID**
- Application type: **Desktop app**
- Name: 임의(`ga4-mcp-desktop` 등)
- Create → 우측 다운로드 아이콘 → JSON 저장
- 저장 위치 권장:

```bash
mkdir -p ~/.config/ga4-mcp
mv ~/Downloads/client_secret_*.json ~/.config/ga4-mcp/oauth-client.json
chmod 600 ~/.config/ga4-mcp/oauth-client.json
```

## 4단계: Google Analytics API 활성화

본인 GCP 프로젝트에서 두 API를 활성화한다.

```
https://console.developers.google.com/apis/api/analyticsadmin.googleapis.com/overview
https://console.developers.google.com/apis/api/analyticsdata.googleapis.com/overview
```

각 페이지에서 **사용(ENABLE)** 클릭. 활성화 후 propagation에 1~2분 소요.

## 5단계: gcloud ADC 발급

본인 OAuth Client로 ADC(Application Default Credentials)를 발급한다.

```bash
gcloud auth application-default login \
  --client-id-file="$HOME/.config/ga4-mcp/oauth-client.json" \
  --scopes='https://www.googleapis.com/auth/analytics.readonly,https://www.googleapis.com/auth/cloud-platform'
```

브라우저 흐름:

1. 본인 Gmail 선택
2. **"Google에서 확인하지 않은 앱"** 경고 → **고급 → 안전하지 않은 페이지로 이동** (Test user로 등록돼 있어 통과)
3. 권한 동의창에서 **"Google Analytics 데이터 보기 및 다운로드"** 체크 확인 → 허용
4. 터미널에 `Credentials saved to file: ...` 출력되면 완료

ADC 파일 위치: `~/.config/gcloud/application_default_credentials.json`

## 6단계: GA4 속성 권한 확인

본인이 조회하려는 GA4 속성에 본인 Google 계정의 **뷰어** 이상 권한이 있어야 한다.

```
https://analytics.google.com → 관리(톱니) → 속성 액세스 관리
```

본인 Gmail이 목록에 없으면 속성 소유자에게 추가 요청.

## 7단계: `.mcp.json` 확인

저장소 루트의 `.mcp.json`에 `google-analytics` 항목이 있어야 한다.

```json
{
    "mcpServers": {
        "google-analytics": {
            "command": "analytics-mcp"
        }
    }
}
```

> `command`는 PATH에서 `analytics-mcp`를 찾는다. `pipx install`이 바이너리를 `~/.local/bin/analytics-mcp`로 설치하고, 1단계의 `pipx ensurepath`가 이 디렉토리를 사용자 PATH에 등록한다. 새 셸/Claude Code 세션에서 자동으로 해결된다. 절대 경로 박지 말 것 — 다른 사용자 환경에서 깨진다.

## 8단계: 동작 확인

Claude Code 새 세션에서:

> "GA4 계정 목록 보여줘"

`mcp__google-analytics__get_account_summaries`가 호출되어 본인이 접근 가능한 계정/속성이 반환되면 성공.

## 트러블슈팅

### 옛 `GOOGLE_APPLICATION_CREDENTIALS` 환경변수가 잡혀 있을 때

`~/.zshrc` 등에서 옛 서비스 계정 키 경로를 export하고 있으면 ADC보다 우선 적용되어 충돌. 주석 처리하거나 제거 후 셸 재시작.

### 토큰 캐시로 옛 ADC를 계속 쓸 때

MCP 서버 프로세스가 시작 시점의 토큰을 메모리 캐싱한다. ADC를 재발급한 뒤에는 **Claude Code 세션 재시작** 필요 (chat 종료 → 재진입).

### `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT`

ADC 토큰의 OAuth 스코프가 부족. 5단계 명령에 `--scopes`를 명시했는지 확인하고 ADC 재발급.

### `403 access_denied` / "테스터만 액세스" 메시지

OAuth Consent Screen의 Test users에 본인 Gmail이 등록되지 않은 경우. 2단계 마지막 항목을 다시 확인.

### `403 SERVICE_DISABLED`

4단계 API 활성화 누락. 두 API가 모두 ENABLE 상태인지 확인.

## ADC 토큰 갱신

평소엔 자동 refresh되지만 장기간 미사용 등으로 만료되면 5단계 명령을 다시 실행한다.

## Fallback: MCP 서버 DNS 장애 시 Data API 직접 호출

MCP 서버가 `503 ... Could not contact DNS servers (analyticsdata.googleapis.com)`를 반복하면, 서버 프로세스의 gRPC resolver 상태가 깨진 것이다(세션 중 MCP 재연결 churn 시 발생). 호스트 DNS/네트워크는 정상이므로 `nslookup analyticsdata.googleapis.com`으로 먼저 확인. 근본 해소는 **Claude Code 세션 재시작**(서버 재초기화)이지만, 그 전에 ADC 토큰으로 Data API를 직접 호출해 우회할 수 있다(2026-06-21 실증).

```bash
TOKEN=$(gcloud auth application-default print-access-token)   # --scopes 붙이지 말 것(화이트리스트 제약, ADC에 이미 analytics.readonly 포함)
curl -s -X POST "https://analyticsdata.googleapis.com/v1beta/properties/521847047:runReport" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"dateRanges":[{"startDate":"7daysAgo","endDate":"yesterday"}],"dimensions":[{"name":"date"}],"metrics":[{"name":"activeUsers"}]}'
```

요청 바디는 camelCase(`dateRanges`/`startDate`/`dimensionFilter`/`orderBys`) — MCP의 snake_case와 다름. 실시간은 `:runRealtimeReport`.
