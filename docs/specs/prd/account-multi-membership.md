# PRD: 겸직 모델 검토 (A-4) — account-multi-membership

> 상태: Approved (구현 완료) | 작성일: 2026-06-11

> BUGFIX TARGET A-4 검토 PRD. 1차 산출물은 코드가 아니라 **도입 여부 결정**이다.
> 검토 결론 (**2026-06-11 사용자 승인**): **보류 확정 (단일 소속 = 도메인 의도 문서화 + 재진입 트리거 명문화)** + 검토 중 발견된 인접 결함 분리 처리.

## 배경/문제 요약

- 참고: `docs/specs/README.md` BUGFIX A-4, `docs/specs/prd/account-model-transition.md`, `docs/business/0_feedback/entries/2026-03-13-susaek.md`, `docs/business/STATUS.md` (데이터 이상 표)
- 문제: `Account.organizationId`(단일 nullable FK) + `Account.role`(단일 컬럼) 구조로 한 교사가 같은 본당의 두 모임(예: 초등부 + 중고등부)에 동시 소속하는 "겸직"을 한 계정으로 표현할 수 없다.
- 현재 상태: 겸직자는 조직별로 계정을 따로 만들어야 한다. 이는 버그가 아니라 **계정 모델 전환(2026-03)의 명시적 설계 의도** — PRD 원문 "조직별 1개 계정 발급, 멤버십 테이블 불필요" + 시나리오 7 "여러 조직 교리교사: 조직별 별도 계정 생성" (`prd/account-model-transition.md:21,84,90`).
- 목표 상태: 시그널 실태와 변경 비용을 근거로 도입/보류를 확정하고, 결정을 문서로 박제해 A-4를 종결한다.

## 검토 결과 (2026-06-11 조사 근거)

### 사업 시그널 실태 — 도입 압력 낮음

- 직접 발화 **1건**: 수색성당 박지안 "여러단체 동시 가입"(2026-03-13). 당시 "TEACHER 기존 모임 합류 불가" 문제로 재해석되어 계정 모델 전환으로 종결. 이후 약 3개월(모임 99→105 성장 구간) 동안 같은 계열 신규 피드백 **0건**.
- 우회 정황 3계열(전부 약~중 강도, 동일 인물 복수 계정 보유가 문서로 확인된 사례 없음):
    1. 박지안 미소속+수색 중복 계정 의심 — 단, `docs/specs/README.md` BUGFIX 서문에 "동작 숙지 미숙으로 정리"된 기존 트리아지 존재 → 강도 약
    2. 교사단/교사회의 별도 org화(불광동교사단 11계정, 풍납동 교사회) — 교사 출석을 Student 레코드로 모델링해 겸직 필요성 자체를 우회, 현재 작동 중
    3. 본당 내 계정의 org별 완전 분할(불광동 20 = 11+8+1, 사창동 4모임 17계정) — 구조적 정황일 뿐 수요 발화 아님
- 피드백 카테고리/트리거(`0_feedback/feedback-categories.md`, `3_gtm/gtm.md`)에 겸직 항목 자체가 없음.

### 도입 시 변경 규모 — 중규모 이상, 난이도 상급 다수

- 백엔드: 단일 소속 가정이 5개 층(인증 컨텍스트 / JoinRequest 수명주기 / 계정 수명주기 / 출력 계약 / 집계)에 분포, 직접 수정 약 17~19파일. 난이도 상 4곳 — `infrastructure/trpc/context.ts`(활성 조직 결정 프로토콜 신설), `approve-join.usecase.ts`(O-1 `organizationId: null` 가드 재정의), `delete-account.usecase.ts`(겸직 ADMIN 탈퇴 cascade 규칙 신규), `GetAccountOutput` 계약 확장.
- A-3/O-1로 최근 종결한 race 방어를 전부 재증명해야 함: `pending_lock` UNIQUE는 "계정당 전역 PENDING 1건"이라 겸직 정상 플로우(소속 상태에서 타 조직 합류 요청)와 정면 충돌 — 키 재설계 + 전이 4개소 수정.
- 프론트: AuthProvider 6개 단일 스칼라 상태가 근원. 강 영향 5곳(AuthProvider 멤버십 배열화 / JoinPage 소속 차단 게이트 / PendingPage "organizationId 출현 = 승인" 폴링 / AccountDeleteSection 유일 관리자 판정 / **조직 전환 UI 완전 신설** — 현재 조직명을 렌더하는 UI가 0건). TanStack Query 캐시가 암묵적 단일 조직 스코프라 전환 방식(cache clear vs 전 API orgId 입력화) 설계 결정 선행 필요.
- 테스트: 통합 테스트 약 20파일이 단일 소속 불변식("이미 소속 CONFLICT", O-1 롤백, pendingLock 전역 1건)을 회귀 계약으로 박제 + `seedBase`/`createScopedCaller` 헬퍼가 단수 organizationId 주입 구조. IDOR 위협 모델에 "동일 계정의 비활성 멤버십 조직 접근" 클래스 신설 필요.
- 그대로 호환되는 영역: A-1 name 글로벌 unique(직교 — 1인 1계정 통합에 오히려 우호), AccountSnapshot(이벤트 박제 시맨틱, 읽기 소비자 0건), JWT payload(`{id, name}`만 — 조직 무관이라 토큰 무변경 전환 가능), 약관(배타 조항 없음).

### 검토 중 발견된 인접 결함 (A-4 본체와 분리)

1. **`create-organization` 무가드 덮어쓰기**: 호출자 소속/role 검사가 없어(consentedProcedure) 소속 계정이 호출하면 기존 조직에서 조용히 이탈하며, 유일 ADMIN이 호출하면 구 조직이 **관리자 0명으로 고아화** — admin-transfer가 race 가드까지 동원해 지키는 ADMIN≥1 불변식의 우회 경로 (`create-organization.usecase.ts:16-80`).
2. **`delete-account`의 role 잔존**: 탈퇴 시 `organizationId`만 null 처리하고 role을 남김(강퇴는 둘 다 null). 탈퇴→복원 계정은 "role 있음 + org 없음" 모순 상태로 실재 (`delete-account.usecase.ts:88-91,110-113`).
3. **자발적 탈퇴(leave)/해산(disband) 프로시저 부재**: 교사가 스스로 조직을 나가는 경로가 없음(강퇴 또는 탈퇴→복원→재합류 우회뿐). 박지안 피드백의 "단체 해산" 항목이 멤버십 라이프사이클의 절반을 이미 요구했으나 미구현 (`susaek.md:11`).

## 목표/성공 기준

- **목표**: A-4를 "단일 소속 = 도메인 의도"로 확정 종결하고, 도입 재검토 조건을 측정 가능한 트리거로 명문화한다.
- **성공 지표**: ① 도메인 의도가 FD(`auth-account.md`)에 병합 문서화 ② 재진입 트리거가 TARGET 종결 기록에 수치로 명시 ③ 인접 결함 3건 각각의 처리 결정(수정/별건 등록/기각) 완료
- **측정 기간**: 즉시 (문서/결정 산출물) — 재진입 트리거는 상시 모니터링 항목으로 이관

## 사용자/대상

- **주요 사용자**: 본당 내 복수 모임을 오가는 교리교사(겸직자) — 현재 공식 워크어라운드는 조직별 계정 분리
- **사용 맥락**: 겸직자는 모임별 계정으로 로그인 전환. 교사단 출석은 교사단 org + Student 레코드 패턴이 흡수 중

## 범위

### 포함

- 단일 소속 도메인 의도 문서화 (A-1 패턴: FD 병합 + TARGET 종결 기록)
- 재진입 트리거 정의 (아래 요구사항 Must 참조)
- 인접 결함 3건의 처리 방향 결정 (사용자 판단 — 오픈 이슈)

### 제외

- 멤버십 테이블(Account↔Organization N:M) 도입 자체 — 재진입 트리거 충족 시 별건 PRD로 재등록 (본 PRD의 변경 지도를 베이스로 재산정)
- 기존 다계정 사용자의 계정 병합 — N:M 도입 시에만 의미 있음 (name unique라 자동 병합 불가, 수동 식별 필요)
- 박지안 원의도 재접촉 인터뷰 — 5~8월 최소 운영 모드와 충돌, 재진입 트리거 평가 시점에 수행

## 사용자 시나리오

1. **겸직 교사 (현행 유지)**: 초등부+중고등부 겸직 교사는 모임별 계정 2개로 각각 로그인 — 계정 모델 전환 PRD 시나리오 7의 공식 동작. 불편 발화 시 피드백 엔트리로 기록되어 재진입 트리거 카운트에 반영된다.
2. **재진입 (트리거 충족 시)**: 직접 요청 누적 또는 DB 실측으로 트리거 충족 → A-4 후속 PRD 재등록 → 본 PRD "도입 시 변경 규모" 지도 기반으로 단계적 이행 설계.

## 요구사항

### 필수 (Must)

- [ ] `docs/specs/functional-design/auth-account.md`에 "단일 소속 도메인 의도 + 겸직 = 조직별 계정" 명문화 (계정 모델 전환 FD 원문과 교차 참조)
- [ ] 재진입 트리거 명문화: ① 겸직 직접 요청(복수 모임 동시 소속 요구 발화) 누적 **2건 이상** ② 동일 인물 다계정 운영 DB 실측 **3건 이상**(이름/연락처 대조 SQL — 운영 메일 검증 사이클에 1회 편입) ③ 교사단 org 패턴의 한계 발화(교사단을 Account 멤버십으로 요구) **1건**
- [ ] `docs/specs/README.md` TARGET A-4 행 종결 처리 (BUGFIX 서문에 결정 요약 병합)

### 선택 (Should)

- [ ] 인접 결함 #1 수정: `create-organization`에 호출자 소속 가드 추가 (소속 계정 호출 시 CONFLICT — requestJoin 가드와 동일 패턴, ADMIN≥1 불변식 보호)
- [ ] 인접 결함 #2 수정: `delete-account` 탈퇴 시 role도 null 처리 + 기존 모순 데이터(role 있음 + org 없음) 정리 마이그레이션
- [ ] 인접 결함 #3: leave/disband 부재를 BUGFIX/FUNCTIONAL TARGET 별건 등록 (시그널 1건 — 박지안 "단체 해산", 검증 대기 패턴)

### 제외 (Out)

- 멤버십 테이블 N:M 도입 (재진입 트리거 충족 시 별건)
- 조직 전환 UI / 활성 조직 프로토콜 (N:M의 종속 작업)
- A-3 `pending_lock` 키 재설계 (N:M의 종속 작업 — 현행 "계정당 전역 PENDING 1건"은 단일 소속 모델에서 정합)

## 제약/가정/리스크/의존성

- **제약**: 5~8월 최소 운영 모드(자금 확보 최우선) — 본 검토는 문서 산출물 중심이라 정합. 인접 결함 수정도 외부 비용 0.
- **가정**: 교사단 org + Student 레코드 패턴이 겸직성 수요를 당분간 흡수한다 (불광동교사단 활성 운영이 근거).
- **리스크**: "가톨릭 교회 내 모든 모임을 위한 앱" 비전(성북동 미카엘라 제안, young-adult 확장 결정)이 실현될수록 1인 복수 모임 소속 확률이 구조적으로 상승 — 재진입 트리거가 이를 조기 감지하는 안전망.
- **내부 의존성**: 없음 (다른 TARGET 항목과 독립)
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: 문서 변경(Must)은 단일 PR. 인접 결함 수정(Should)을 포함하면 기능 단위 커밋 분리.
- **이벤트**: 신규 GA4 이벤트 없음 | **검증**: 인접 결함 수정 시 통합 테스트(create-organization 가드, delete-account role 정리) 추가로 확인

## 오픈 이슈 (사용자 결정 포인트)

- [x] **결정 1 — 검토 결론 승인**: **보류 확정 (2026-06-11 사용자 승인)**. N:M 도입은 재진입 트리거 충족 시 별건 재등록.
- [x] **결정 2 — 인접 결함 처리**: 권고안 적용 확정 — #1(create-organization 가드)/#2(role 정리) 이번 범위 구현 완료, #3(leave/disband) 별건 TARGET 등록.
- [x] **결정 3 — 재진입 트리거 수치**: 제안값(직접 요청 2건 / DB 실측 3건 / 교사단 한계 발화 1건) 적용 확정 — `auth-account.md` 병합.

## 연결 문서

- 사업 문서: `docs/business/0_feedback/entries/2026-03-13-susaek.md`, `docs/business/STATUS.md`, `docs/business/3_gtm/gtm.md`
- 선행 PRD: `docs/specs/prd/account-model-transition.md` (단일 소속 설계 의도 원문), `docs/specs/prd/join-request-single-pending.md` (A-3), `docs/specs/prd/approve-join-org-move-guard.md` (O-1), `docs/specs/prd/a1-checkid-consistency.md` (A-1 종결 패턴 선례)
- 기능 설계: `docs/specs/functional-design/auth-account.md` ("단일 소속 도메인 의도 + 미소속 role 불변식" 섹션에 병합 완료), `docs/specs/functional-design/account-model-transition.md`
