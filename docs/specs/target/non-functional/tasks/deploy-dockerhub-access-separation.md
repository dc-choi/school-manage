# Task: Docker Hub 계정/권한 분리

> 업무 단위 설계 문서입니다.
> Feature 문서를 기반으로 **유스케이스와 엣지 케이스**를 정리합니다.

## 관련 Feature

- `docs/specs/target/non-functional/features/deploy-dockerhub-access-separation.md`

## 목표

CI(push) 계정과 운영(pull) 계정을 분리하고 최소 권한을 적용한다.

## 범위

### 포함
- [x] ci-bot/deploy-bot 분리
- [x] 권한 설정
- [x] 권한 정책 문서화

### 제외
- [ ] CI 워크플로우 구성
- [ ] 운영 배포 자동화

## 유스케이스

### UC-1: CI 계정 구성

**전제 조건**: ci-bot 계정 생성

**주요 흐름**:
1. repo에 push 권한을 부여한다.
2. 토큰을 발급한다.

**결과**: CI가 push 권한을 가진다.

### UC-2: 운영 계정 구성

**전제 조건**: deploy-bot 계정 생성

**주요 흐름**:
1. repo에 pull-only 권한을 부여한다.
2. 토큰을 발급한다.

**결과**: 운영 서버는 pull만 가능하다.

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| 권한 과다 | 권한 재설정 | High |
| 계정 공유 | 토큰 회수 | Medium |

## 검증 체크리스트

- [ ] ci-bot이 push 가능한가?
- [ ] deploy-bot이 pull-only인가?
- [ ] 권한 정책이 문서화되었는가?

## 다음 단계

- [x] Development 문서 작성: `docs/specs/target/non-functional/development/deploy-dockerhub-access-separation.md`

---

**작성일**: 2026-01-05
**담당자**: Codex
**예상 작업량**: S
