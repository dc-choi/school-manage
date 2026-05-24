# PRD: Lenit 피드백 위젯 통합

> 상태: Draft | 작성일: 2026-05-24

> quick 플로우. 사용자 피드백 수집 도구(Lenit) 통합. 사업 문서 직접 연결 없음(운영 도구 도입).

## 배경/문제 요약

- 문제: 인증 사용자가 앱 내에서 의견/버그를 남길 채널이 없다. 현재는 인스타 DM 등 외부 경로에 의존.
- 현재 상태: GA4/Clarity로 행동은 관측하지만, 사용자가 능동적으로 남기는 정성 피드백 수집 수단이 없음.
- 목표 상태: 로그인 사용자에게 플로팅 피드백 버튼(Lenit 위젯)을 노출하여 앱을 떠나지 않고 피드백을 남기게 한다.

## 목표/성공 기준

- **목표**: 인증 사용자에게 Lenit 위젯을 안정적으로 로드하고, 사용자 식별자(`account.id`)와 함께 피드백을 수집.
- **성공 지표**: 위젯 정상 로드(인증 사용자 세션에서 플로팅 버튼 노출), Lenit 보드에 `userId` 매핑된 피드백 유입.
- **측정 기간**: 도입 후 4주.

## 사용자/대상

- **주요 사용자**: 로그인한 교리교사(인증 + 조직 소속 여부 무관, 계정 로드 완료 시점).
- **사용 맥락**: 앱 사용 중 떠오른 의견/버그를 즉시 제출.

## 범위

### 포함

- Lenit `widget.js` 스크립트 로드 + `window.Lenit.push({ boardKey, userId, traits })` 설정 주입
- 세그먼트 분석용 `traits`는 비식별 값만: 상수(`plan:'free'`, `language:'ko'`, `country:'KR'`, `industry:'religious-education'`) + 계정별(`signupDays`, `hasOrganization`, `role`, `organizationType`). 식별 가능한 이름/조직명은 제외
- `signupDays`는 서버(`account.get`)에서 KST 기준 계산해 반환(클라 타임존 이슈 회피). 출력에 `signupDays: number` 추가(백엔드)
- `boardKey`는 환경변수(`VITE_LENIT_BOARD_KEY`)로 관리, 값이 없으면 로드 스킵(로컬/테스트/개발 격리)
- `userId`는 로그인 계정 PK(`account.id`, 문자열) 사용
- 계정 로드 완료 시점(AuthProvider)에 1회만 로드(멱등)

### 제외

- 비로그인 사용자 노출 (위젯은 인증 사용자에게만)
- 위젯 UI 커스터마이징(색상/위치 등) — Lenit 기본값 사용
- 로그아웃 시 위젯 제거(teardown) — Lenit 스니펫에 공개 API 없음, 새로고침 전까지 잔존 허용
- 자체 피드백 백엔드/DB (Lenit이 SaaS로 전담)

## 사용자 시나리오

1. 교리교사가 로그인 → 계정 정보 로드 완료 → 화면 우하단에 Lenit 플로팅 버튼 노출.
2. 버튼 클릭 → 패널에서 피드백 작성/제출 → Lenit 보드에 `userId=account.id`로 기록.

## 요구사항

### 필수 (Must)

- [ ] `VITE_LENIT_BOARD_KEY`가 유효할 때만 위젯 로드 (미설정/플레이스홀더면 스킵)
- [ ] 인증 사용자(계정 로드 완료)에게만 로드, `userId`에 `account.id` 문자열 전달
- [ ] 동일 세션에서 스크립트는 1회만 주입 (StrictMode 중복 렌더/계정 재설정에도 멱등)
- [ ] 로드 실패가 앱 동작에 영향을 주지 않음 (에러 격리, GA4/Clarity와 동일한 비차단 주입)

### 선택 (Should)

- [ ] `lib/lenit.ts` 유틸로 분리해 `analytics.ts`와 동일한 패턴/테스트 가능성 확보

### 제외 (Out)

- 위젯 표시 위치/테마 제어, 익명(비로그인) 모드

## 제약/가정/리스크/의존성

- **제약**: Lenit 위젯 스니펫은 `window.Lenit` 큐 → `widget.js` 비동기 로드 구조. teardown API 없음.
- **가정**: `boardKey`(`vb_live_...`)는 공개 클라이언트 키로 시크릿 아님. `account.id`는 불투명 cuid PK.
- **리스크(개인정보)**: third-party(lenit.cloud)로 `account.id` + 비식별 traits(`role`/`organizationType`/`hasOrganization`) 전송. 직접 PII(이름/이메일)는 아니며, 이미 GA4로 `displayName`/`organizationName`을 전송 중인 수준 이하. 인증 사용자에게만 로드되며 앱 페이지는 `ProtectedRoute`가 미동의 시 `/consent`로 리다이렉트하므로 사실상 동의 후 노출. **개인정보처리방침의 third-party 제공/위탁 고지에 Lenit 추가 검토 필요(후속).**
- **외부 의존성**: `https://lenit.cloud/widget.js` 가용성.

## 롤아웃/검증

- **출시 단계**: 프로덕션 env에 `VITE_LENIT_BOARD_KEY` 설정 → 배포. dev/test는 미설정으로 자동 비활성.
- **검증**: 인증 세션에서 플로팅 버튼 노출 확인, Lenit 대시보드에서 `userId` 매핑된 피드백 수신 확인.

## 연결 문서

- 기능 설계: `docs/specs/functional-design/lenit-widget.md`
