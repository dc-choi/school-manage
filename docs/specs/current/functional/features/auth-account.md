# Feature: 인증 및 계정 확인

> 이 문서는 기능의 **단일 정보원(Single Source of Truth)** 입니다.
> 기술적 구현 방법이 아닌 **"무엇을"** 만들지에 집중합니다.

## 개요

계정은 ID/비밀번호로 로그인하여 Access Token을 발급받고, 토큰으로 본인 계정을 확인한다.

## 배경

- 계정별로 그룹/학생 데이터를 분리해 관리해야 한다.
- 보호된 API 접근을 위해 인증 수단이 필요하다.

## 사용자 스토리

### US-1: 로그인하여 관리 기능을 사용한다
- **사용자**: 교사/관리자
- **원하는 것**: ID/비밀번호로 로그인하고 Access Token을 받기
- **이유**: 그룹/학생 관리 기능에 접근하기 위해

### US-2: 토큰으로 현재 계정을 확인한다
- **사용자**: 로그인한 사용자
- **원하는 것**: 토큰으로 현재 계정 이름을 확인하기
- **이유**: 현재 세션이 유효한지 검증하기 위해

## 기능 요구사항

### 필수 (Must Have)
- [x] ID/비밀번호로 로그인할 수 있어야 한다.
- [x] 로그인 성공 시 Access Token과 계정 이름을 반환해야 한다.
- [x] Access Token으로 보호된 API에 접근할 수 있어야 한다.
- [x] `/api/account`에서 토큰 기반으로 계정 이름을 확인할 수 있어야 한다.
- [x] 토큰 만료/유효성 오류는 명확한 에러 코드로 응답해야 한다.

### 선택 (Nice to Have)
- [x] 없음 (현재 스코프)

## 엣지 케이스

| 케이스                 | 예상 동작                  |
|---------------------|------------------------|
| 존재하지 않는 ID로 로그인     | NOT_FOUND 코드로 실패 응답    |
| 잘못된 비밀번호            | UNAUTHORIZED 코드로 실패 응답 |
| Authorization 헤더 누락 | 인증 실패 응답               |
| 서명/형식이 잘못된 토큰       | UNAUTHORIZED 코드로 실패 응답 |
| 만료된 토큰              | UNAUTHORIZED 코드로 실패 응답 |

## 인수 조건 (Acceptance Criteria)

- [x] 로그인 성공 시 `name`, `accessToken`을 포함한 결과를 반환한다.
- [x] ID가 없으면 NOT_FOUND 코드로 실패한다.
- [x] 비밀번호가 틀리면 UNAUTHORIZED 코드로 실패한다.
- [x] 토큰이 없으면 인증 실패로 처리된다.
- [x] 만료된 토큰은 UNAUTHORIZED 코드로 실패한다.
- [x] `/api/account`는 유효한 토큰에서 계정 이름을 반환한다.

## 관련 문서

- Task: `docs/specs/current/functional/tasks/auth-account.md`
- Development: `docs/specs/current/functional/development/auth-account.md`

---

**작성일**: 2026-01-05
**최종 수정**: 2026-01-05
**상태**: Approved
