# PRD: 미소속 사용자 라우팅 수정

> 상태: Approved | 작성일: 2026-03-22

## 배경/문제 요약

- 참고: `docs/specs/functional-design/account-model-transition-flows.md` (상태 전이 흐름)
- 문제: DashboardPage(`/`)가 미소속 사용자(organizationId=null)를 `/join` 또는 `/pending`으로 리다이렉트하지 않음
- 현재 상태: 회원가입·계정 복원·미소속 로그인 직후 깨진 대시보드 표시 (scopedProcedure API 전부 FORBIDDEN)
- 목표 상태: 기능 설계에 명시된 상태 전이 흐름이 정상 작동

## 목표/성공 기준

- **목표**: 미소속 사용자가 올바른 페이지로 리다이렉트되어 합류/생성 흐름을 완료할 수 있다
- **성공 지표**: 회원가입→합류 전환율 개선 (현재 미소속 계정 17.5%의 전환 유도)
- **측정 기간**: 즉시 (버그 수정)

## 사용자/대상

- **주요 사용자**: 신규 가입자, 계정 복원 사용자, 미소속 상태 사용자
- **사용 맥락**: 회원가입 직후 / 계정 복원 직후 / 브라우저 재시작 시

## 범위

### 포함

- DashboardPage에서 미소속 사용자 라우팅 로직 추가
- pending 합류 요청 사용자 → `/pending` 리다이렉트

### 제외

- 백엔드 API 변경
- 계정 복원 UseCase 수정 (organizationId=null은 의도된 동작)

## 사용자 시나리오

1. **신규 가입**: 회원가입 → `/` 도착 → orgId 없음 → `/join`으로 리다이렉트
2. **계정 복원**: 복원 → `/` 도착 → orgId 없음 → `/join`으로 리다이렉트
3. **pending 사용자 재접속**: 로그인 → `/` 도착 → orgId 없음 + pending 요청 있음 → `/pending`으로 리다이렉트
4. **정상 사용자**: 로그인 → `/` 도착 → orgId 있음 → 대시보드 정상 표시

## 요구사항

### 필수 (Must)

- [x] 인증됨 + orgId 없음 + joinRequestStatus !== 'pending' → `/join` 리다이렉트
- [x] 인증됨 + orgId 없음 + joinRequestStatus === 'pending' → `/pending` 리다이렉트
- [x] 인증됨 + orgId 있음 → 대시보드 표시 (현행 유지)
- [x] 비인증 → 게스트 대시보드 표시 (현행 유지)

### 선택 (Should)

- 없음

### 제외 (Out)

- 백엔드 변경
- 새로운 API 추가

## 제약/가정/리스크/의존성

- **제약**: 프론트엔드만 변경
- **가정**: `account.get` API가 `joinRequestStatus`를 이미 반환함 (확인됨)
- **리스크**: 없음 (기존 설계 의도대로 구현)
- **내부 의존성**: AuthProvider의 account.get 쿼리 데이터
- **외부 의존성**: 없음

## 롤아웃/검증

- **출시 단계**: 즉시 배포
- **검증**: 회원가입 → `/join` 리다이렉트 확인, 복원 → `/join` 확인, pending → `/pending` 확인

## 오픈 이슈

- 없음

## 연결 문서

- 기능 설계: `docs/specs/functional-design/account-model-transition-flows.md`
- 기능 설계: `docs/specs/functional-design/auth-account.md`
