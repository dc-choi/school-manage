# PRD: checkId 탈퇴 계정 슬롯 정합화 (A-1)

> 상태: Approved (구현 완료) | 작성일: 2026-06-10

> `/sdd quick` 플로우 — 최소 섹션(배경/범위/요구사항)만 작성.

## 배경/문제 요약

- 참고: `docs/specs/README.md` BUGFIX A-1, `docs/specs/functional-design/auth-account.md` (name 예약 정책)
- 문제: `auth.checkId`가 활성 계정만 검사(`deletedAt: null`)하여, 탈퇴(soft-delete) 계정이 점유한 name에 `available: true`를 응답한다. 실제 가입(`auth.signup`)은 DB UNIQUE(활성+탈퇴 전체 적용 — restoreAccount name 예약)에서 P2002 → CONFLICT로 실패한다. "사용 가능한 아이디입니다" 확인 직후 제출하면 실패하는 모순 UX.
- 현재 상태: unique 도입(2026-04-21) 전 운영 DB에서 "탈퇴 직후 동일 ID 재가입" 4건 실측 — 동일 행동이 현재는 전부 이 모순 경로로 귀결된다.
- 목표 상태: checkId의 점유 판정 스코프를 DB UNIQUE와 동일(활성+탈퇴 전체)하게 정렬한다. A-1 본체(unique의 soft-delete 슬롯 점유 자체)는 도메인 의도(3중 문서화: 마이그레이션 주석, FD, 회귀 테스트)로 close.

## 범위

### 포함

- `check-id.usecase.ts`의 `deletedAt: null` 필터 제거 — 탈퇴 계정 점유 name도 `available: false`
- checkId 통합 테스트 신설 (미사용 / 활성 점유 / 탈퇴 점유)

### 제외

- 응답 형태 변경 없음 (`available: boolean` 유지) — 탈퇴/복원 가능 여부 미노출 (계정 열거 방지 정책 유지)
- `signup`의 앱 레벨 검사(`deletedAt: null`) 변경 없음 — race/탈퇴 충돌은 기존 P2002 캐치가 전담
- 2년 만료 name 슬롯 회수 배치 (YAGNI — 첫 만료 ~2028년, 시그널 발생 시 재등록)
- 프론트엔드 변경 없음 (기존 available: false 문구 그대로 동작)

## 요구사항

### 필수 (Must)

- [ ] 탈퇴 계정이 점유한 name → `available: false`
- [ ] 활성 계정이 점유한 name → `available: false` (기존 동작 유지)
- [ ] 미사용 name → `available: true` (기존 동작 유지)
- [ ] 응답에 탈퇴/예약 여부 미노출

## 연결 문서

- 기능 설계: `docs/specs/functional-design/auth-account.md` (Account.name 유니크 정책 + checkId API 섹션에 병합 완료)
