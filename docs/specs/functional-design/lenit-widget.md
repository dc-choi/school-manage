# 기능 설계: Lenit 피드백 위젯 통합

> 상태: Draft | 작성일: 2026-05-24

> PRD: `docs/specs/prd/lenit-widget.md`

## 흐름/상태

### 로드 플로우

1. 사용자가 로그인 → `AuthProvider`가 `account.get` 응답으로 계정 상태를 세팅(`AuthProvider.tsx`의 account 세팅 effect).
2. GA4 사용자 속성 설정과 같은 지점에서 `loadLenit(account.id)` 호출.
3. `loadLenit`은 다음을 검사:
    - `VITE_LENIT_BOARD_KEY`가 유효한가(미설정/플레이스홀더 아님)?
    - 이미 로드했는가(모듈 레벨 `loaded` 플래그)?
    - 둘 중 하나라도 막히면 즉시 return(no-op).
4. 통과 시 `window.Lenit = window.Lenit || []` 초기화 → `window.Lenit.push({ boardKey, userId, traits? })` → `widget.js` `<script async>`를 `document.body`에 1회 append.
5. `widget.js`가 큐를 소비해 플로팅 버튼 + 패널을 자동 렌더.

### 상태 전이

```
[미인증] --로그인/계정로드--> [인증] --loadLenit()--> [위젯 로드됨(세션 1회)]
[위젯 로드됨] --로그아웃--> [account=null, 위젯은 새로고침 전까지 잔존] (teardown 미지원)
```

## 동작 명세

- **주입 위치**: `apps/web/src/lib/lenit.ts` (분리 유틸, `analytics.ts`와 동형). 호출은 `AuthProvider`의 계정 세팅 effect.
- **env 가드**: GA4/Clarity와 동일하게 값이 비었거나 `VITE_`/`%` 플레이스홀더면 스킵. → dev/test/로컬에서 자동 비활성.
- **멱등성**: 모듈 레벨 `loaded` boolean. StrictMode 이중 렌더, 계정 재설정, 재마운트에도 스크립트 1회만 append.
- **userId**: `account.id`(cuid 문자열). 빈 문자열(`''`)이면 로드 스킵 — 로그인 직후 `account.id`가 `''`인 과도기(`AuthProvider.tsx`의 login 직후 상태) 보호.
- **traits(세그먼트 속성)**: 비식별 값만 전송. 식별 가능한 `displayName`/`organizationName`/`churchName`은 third-party 노출 최소화를 위해 **제외**.
    - 앱 공통 상수(`lenit.ts`의 `STATIC_TRAITS`): `plan:'free'`(유료 티어 없음), `language:'ko'`, `country:'KR'`, `industry:'religious-education'`.
    - 동적(계정별, `AuthProvider`): `signupDays`(가입 경과일), `hasOrganization`(boolean), `role`(ADMIN/TEACHER, 조직 소속 시), `organizationType`(ELEMENTARY/MIDDLE_HIGH/YOUNG_ADULT, 조직 소속 시).
    - `loadLenit`이 상수 위에 동적값을 병합해 전송.
- **signupDays 산출(서버)**: DB/서버 모두 KST 기준이므로 클라에서 계산하면 직렬화/타임존 이중 오프셋이 발생한다. `account.get` usecase가 `getNowKST() - createdAt` 델타로 일 단위 계산(음수 0 클램프)해 `signupDays: number`로 반환. 클라는 받은 값을 그대로 trait에 전달.
- **에러 격리**: 주입 로직을 try/catch로 감싸 실패 시 `console.warn`만 남기고 앱 흐름 비차단(`analytics.ts`의 `safeGtag` 패턴 준수).
- **모바일 위치 보정**: 위젯 런처(`#vb-widget-root`)는 `bottom:24px` 고정이라 모바일 `BottomTabBar`(`md:hidden`, `--bottom-tab-bar-height`)와 겹친다. `globals.css`에서 `max-width:767px`일 때 `bottom`을 탭바 높이+safe-area 위로 올린다(`!important`로 위젯 inline 스타일 오버라이드). Lenit은 bottom 오프셋 설정이 없어 CSS로 처리.

### 전역 타입

`apps/web/src/types/lenit.d.ts` (gtag.d.ts와 동형):

| 심볼           | 형태                                   | 설명             |
| -------------- | -------------------------------------- | ---------------- |
| `LenitConfig`  | `{ boardKey: string; userId: string }` | push 페이로드    |
| `Window.Lenit` | `LenitConfig[] \| undefined`           | 위젯 큐 (선택적) |

### 환경변수

| 변수                   | 위치             | 설명                                 |
| ---------------------- | ---------------- | ------------------------------------ |
| `VITE_LENIT_BOARD_KEY` | `apps/web/.env*` | Lenit 보드 키. 미설정 시 위젯 비활성 |

## 예외/엣지 케이스

| 상황                                       | 처리                                                           |
| ------------------------------------------ | -------------------------------------------------------------- |
| `VITE_LENIT_BOARD_KEY` 미설정/플레이스홀더 | no-op (위젯 미로드)                                            |
| `account.id`가 빈 문자열                   | no-op (유효 PK 확보 후 재호출 시 로드)                         |
| 이미 로드된 세션에서 재호출                | no-op (멱등)                                                   |
| `widget.js` 네트워크 실패                  | 앱 비차단, Lenit 측 큐만 잔존                                  |
| 로그아웃                                   | 위젯 잔존 허용(teardown 미지원), 새로고침 시 비인증이라 미로드 |

## 측정/모니터링

- 자체 GA4 이벤트는 추가하지 않음. 위젯 노출/피드백 지표는 Lenit 대시보드에서 확인.

## 테스트 시나리오

### 정상 케이스

1. **TC-1**: 유효 boardKey + 유효 userId → `window.Lenit`에 `{boardKey, userId}` 1건 push, script 1개 append.
2. **TC-2**: 동일 조건으로 `loadLenit` 2회 호출 → script append는 1회만(멱등).

### 예외 케이스

1. **TC-E1**: boardKey 미설정/플레이스홀더 → push/append 모두 없음.
2. **TC-E2**: userId가 빈 문자열 → push/append 없음.
