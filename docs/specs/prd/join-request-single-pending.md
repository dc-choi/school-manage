# PRD: 미소속 계정 단일 PENDING 강제 (A-3)

> 상태: Approved | 작성일: 2026-05-29 | 갱신: 2026-05-30 (race 백스톱 정식 수정 — pending_lock UNIQUE)

> SDD `quick` 플로우 출발. 리뷰 결과 findFirst-create race가 확인되어 DB UNIQUE 제약 + 동시성 보강으로 범위 확장.

## 배경/문제 요약

- 참고: `docs/business/STATUS.md` BUGFIX TARGET A-3, `docs/specs/prd/approve-join-org-move-guard.md` (O-1 자매 항목), `docs/specs/functional-design/account-model-transition-flows.md` (계정 상태 전이)
- 문제: `request-join.usecase.ts:20-26`의 기존 PENDING 중복 체크가 **같은 조직(`organizationId: input.organizationId`)에 한정**된다. 미소속 계정이 서로 다른 조직 여러 곳에 동시에 PENDING 요청을 쌓을 수 있다.
- 현재 상태: 계정이 조직 A에 합류(PENDING 승인)한 뒤에도 조직 B/C에 보낸 PENDING이 잔존한다. O-1이 승인 시점 조직 이동은 차단하지만, B/C admin의 합류 요청 목록에 stale PENDING이 노출되고 승인 시도 시 `CONFLICT`만 반환되는 혼란 + orphan PENDING 누적이 남는다.
- 목표 상태: 미소속 계정은 **동시에 1개 조직에만** PENDING 요청이 가능하다. 임의 조직에 PENDING이 이미 있으면 신규 요청을 `CONFLICT`로 거부해 stale 다중 PENDING 발생 자체를 막는다.

## 목표/성공 기준

- **목표**: stale 다중 PENDING이 생기는 경로를 요청 시점에서 원천 차단한다.
- **성공 지표**: 미소속 계정의 동시 PENDING 요청 건수 ≤ 1 (요청 시점 거부로 보장).
- **측정 기간**: 즉시 (버그 수정).

## 사용자/대상

- **주요 사용자**: 합류 요청을 보내는 미소속 계정 소유자, 합류 요청을 승인하는 조직 admin.
- **사용 맥락**: 미소속 계정이 가입 후 본당/모임을 골라 합류 요청을 보낼 때.

## 범위

### 포함

- `request-join.usecase.ts`의 PENDING 조회 where절에서 `organizationId` 필터 제거 → 계정의 **임의 조직** PENDING 존재 여부로 확장. 존재 시 `CONFLICT` + 단일 통합 메시지.
- **DB 동시성 강제**: `JoinRequest`에 `pending_lock`(PENDING일 때만 true) 컬럼 + `@@unique([accountId, pendingLock])` → findFirst-create race를 DB가 차단, create의 P2002를 `CONFLICT`로 변환. 마이그레이션 + 백필 포함.
- PENDING→타상태 전이 4곳에서 `pendingLock` 해제: request(생성=true) / approve / reject / delete-account.
- **reject-join 동시성 보강**: 조건부 `updateMany`(status=PENDING) + count로 동시 승인/거부 race 차단 (부수 수정).
- **delete-account 보강**: 미소속 계정 삭제 시 본인 PENDING 자동 REJECT (고아 lock 슬롯 방지).

### 제외

- 승인 시 다중 PENDING 캐스케이드 정리 — A1 정책상 다중 PENDING 자체가 발생 불가하므로 불필요.
- 프론트엔드 변경 (에러 메시지는 기존 `CONFLICT` 처리 흐름 재사용).
- 소속 계정(`organizationId` 보유) 가드 — 현행 유지.

## 사용자 시나리오

1. **정상 요청**: PENDING 없는 미소속 계정이 조직 A에 요청 → 생성 성공.
2. **같은 조직 재요청**: 이미 A에 PENDING 보유 → `CONFLICT` (기존 동작 유지, 메시지 통합).
3. **다른 조직 요청**: A에 PENDING을 보유한 채 B에 요청 → `CONFLICT` ("이미 진행 중인 합류 요청이 있습니다").
4. **소속 계정**: `organizationId` 보유 계정이 요청 → 기존 "이미 조직에 소속되어 있습니다" `CONFLICT` (현행 유지).

## 요구사항

### 필수 (Must)

- [ ] 미소속 계정이 임의 조직에 PENDING 요청을 보유한 상태에서 신규 요청을 보내면 `CONFLICT`로 거부한다.
- [ ] 같은 조직 중복과 다른 조직 요청을 **단일 통합 메시지**로 처리한다.
- [ ] 동시 요청 시 DB UNIQUE 제약으로 PENDING이 계정당 1건만 생성된다 (race 백스톱, P2002 → `CONFLICT`).
- [ ] PENDING→APPROVED/REJECTED 전이 시 `pendingLock`이 해제되어 재요청이 가능하다.
- [ ] PENDING이 없는 미소속 계정의 정상 요청 생성 동작은 변경 없다.
- [ ] 소속 계정 가드("이미 조직에 소속되어 있습니다")는 현행 유지한다.

### 선택 (Should)

- 없음

### 제외 (Out)

- 승인 시 캐스케이드 정리, 프론트엔드 변경, 신규 API.

## 제약/가정/리스크/의존성

- **제약**: `apps/api` 백엔드 + 스키마 변경. 신규 마이그레이션 1건(`pending_lock` 컬럼 + UNIQUE).
- **가정**: `joinRequest` 모델 사용. 합류 요청은 미소속(`organizationId=null`) 계정만 보냄. MySQL UNIQUE는 NULL을 distinct로 취급(partial unique 에뮬레이션 근거).
- **리스크**: 낮음. prod에 기존 중복 PENDING이 있으면 백필이 계정당 최신 1건만 lock → UNIQUE 통과(마이그레이션 노트의 사전 점검 SELECT 참고).
- **내부 의존성**: approve-join/reject-join/delete-account의 PENDING 전이 코드(모두 `pendingLock: null` 동기 갱신 필요).
- **외부 의존성**: 없음.

## 롤아웃/검증

- **출시 단계**: 마이그레이션(`20260530_join_request_pending_lock.sql`) 적용 → 배포. prod 적용 전 중복 PENDING 점검 SELECT(마이그레이션 노트).
- **이벤트**: 없음 | **검증**: 통합 테스트 — request-join 6 TC(동시성 TC-E4 포함) + reject-join 5 TC + delete-account TC-SM8.

## 오픈 이슈

- 없음. race는 `pending_lock` UNIQUE로 해소, 레거시 중복 PENDING은 마이그레이션 백필 + 앱 findFirst가 처리.

## 연결 문서

- 사업 문서: `docs/business/STATUS.md` (BUGFIX TARGET A-3)
- 자매 항목: `docs/specs/prd/approve-join-org-move-guard.md` (O-1, 승인 시점 조직 이동 차단)
- 기능 설계: `docs/specs/functional-design/account-model-transition-flows.md` (예외/테스트 섹션에 병합 완료)
