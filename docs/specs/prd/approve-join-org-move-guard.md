# PRD: approveJoin 조용한 조직 이동 차단 (O-1)

> 상태: Approved | 작성일: 2026-05-14

> SDD `quick` 플로우. 단일 파일 버그픽스 — 배경/범위/요구사항 중심.

## 배경/문제 요약

- 참고: `docs/business/STATUS.md` BUGFIX TARGET O-1, `docs/specs/functional-design/account-model-transition-flows.md` (계정 상태 전이)
- 문제: `approve-join.usecase.ts:55-62`의 `tx.account.update`가 대상 계정의 **현재 소속 상태를 검증하지 않고** `organizationId`를 덮어쓴다.
- 현재 상태: 계정 A가 조직 X에 옛 PENDING 요청을 남긴 채 이미 조직 Y에 소속된 경우, X의 admin이 옛 PENDING을 승인하면 계정 A가 본인 인지 없이 Y → X로 이동한다. soft-deleted 계정도 동일하게 되살아난다.
- 목표 상태: 승인 시점에 대상 계정이 **미소속(`organizationId=null`) + 미삭제(`deletedAt=null`)** 일 때만 조직 배정이 성공한다.

## 목표/성공 기준

- **목표**: 옛/유효하지 않은 PENDING 승인이 사용자 인지 없는 조직 이동이나 삭제 계정 부활을 일으키지 못하게 한다.
- **성공 지표**: 이미 소속/삭제된 계정 대상 승인 시 `CONFLICT` 반환 (조직 이동 0건).
- **측정 기간**: 즉시 (버그 수정).

## 사용자/대상

- **주요 사용자**: 조직 admin (합류 요청 승인자), 합류 요청을 보낸 계정 소유자.
- **사용 맥락**: admin이 합류 요청 목록에서 오래 방치된 PENDING 요청을 승인할 때.

## 범위

### 포함

- `approve-join.usecase.ts`의 `tx.account.update` → `tx.account.updateMany({ where: { id, organizationId: null, deletedAt: null } })` + `count` 검증으로 교체.
- `count === 0`일 때 `CONFLICT` 에러 throw.
- 스냅샷 생성을 위한 `account` 재조회 (`updateMany`는 row를 반환하지 않음).

### 제외

- 옛 PENDING 요청 자동 만료/정리 정책 (A-3 미소속 다중 PENDING 처리에서 별도 검토).
- 프론트엔드 변경 (에러 메시지는 기존 `CONFLICT` 처리 흐름 재사용).
- `joinRequest` 조건부 업데이트 로직 (이미 race-safe, 현행 유지).

## 사용자 시나리오

1. **정상 승인**: 미소속 계정의 PENDING 승인 → 조직 배정 + 스냅샷 생성 성공.
2. **이미 소속된 계정**: 계정이 다른 조직에 소속된 상태에서 옛 PENDING 승인 → `CONFLICT` ("이미 다른 조직에 소속된 계정입니다").
3. **삭제된 계정**: soft-deleted 계정의 PENDING 승인 → `CONFLICT`.
4. **동시 승인**: 두 admin이 같은 요청 동시 승인 → 기존 `joinRequest.updateMany` count 검증으로 한 건만 성공 (현행 유지).

## 요구사항

### 필수 (Must)

- [ ] `account` 업데이트는 `organizationId=null AND deletedAt=null` 조건에서만 성공한다.
- [ ] 조건 불일치 시(`count === 0`) `CONFLICT` 에러를 throw하고 트랜잭션을 롤백한다 — `joinRequest` 상태도 함께 롤백된다.
- [ ] 스냅샷 생성에 필요한 `account.name`/`displayName`은 업데이트 성공 후 재조회로 확보한다.
- [ ] 정상 케이스(미소속 미삭제 계정)의 기존 동작은 변경 없다.

### 선택 (Should)

- 없음

### 제외 (Out)

- 옛 PENDING 자동 정리, 프론트엔드 변경, 신규 API.

## 제약/가정/리스크/의존성

- **제약**: `apps/api` 단일 파일 변경.
- **가정**: `account` 모델에 `organizationId`(nullable), `deletedAt`(nullable) 필드 존재 (확인됨).
- **리스크**: 낮음 — 바로 위 `joinRequest.updateMany` + count 검증 패턴을 그대로 따른다.
- **내부 의존성**: `createAccountSnapshot` 헬퍼.
- **외부 의존성**: 없음.

## 롤아웃/검증

- **출시 단계**: 즉시 배포.
- **이벤트**: 없음 | **검증**: 통합 테스트 — 정상/이미 소속/삭제 계정 3개 시나리오 + 트랜잭션 롤백 확인.

## 오픈 이슈

- 없음 (A-3 다중 PENDING 정리 정책은 별도 TARGET).

## 연결 문서

- 사업 문서: `docs/business/STATUS.md` (BUGFIX TARGET O-1)
- 기능 설계: `docs/specs/functional-design/account-model-transition-flows.md` (예외/엣지 케이스 표에 병합됨)
