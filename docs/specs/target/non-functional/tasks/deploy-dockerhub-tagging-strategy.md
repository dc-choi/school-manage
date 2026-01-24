# Task: 이미지 태깅 전략(immutable)

> 업무 단위 설계 문서입니다.
> Feature 문서를 기반으로 **유스케이스와 엣지 케이스**를 정리합니다.

## 관련 Feature

- `docs/specs/target/non-functional/features/deploy-dockerhub-tagging-strategy.md`

## 목표

immutable tag(sha 또는 버전)을 사용해 배포 추적성과 롤백 가능성을 확보한다.

## 범위

### 포함
- [x] 태그 규칙 정의
- [x] CI 태그 적용
- [x] 태그 문서화

### 제외
- [ ] 릴리즈 프로세스 변경
- [ ] 버전 정책 수립

## 유스케이스

### UC-1: sha 태깅

**전제 조건**: CI 빌드 준비

**주요 흐름**:
1. git sha 기반 태그를 생성한다.
2. 이미지를 해당 태그로 push한다.

**결과**: 불변 태그가 생성된다.

### UC-2: 버전 태깅

**전제 조건**: 릴리즈 태그 생성

**주요 흐름**:
1. 버전 태그를 적용한다.

**결과**: 릴리즈 기반 태그가 저장된다.

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| 태그 누락 | 검증 단계 추가 | High |
| 태그 충돌 | 규칙 수정 | Medium |

## 검증 체크리스트

- [ ] 태그 규칙이 정의되었는가?
- [ ] CI가 태그를 적용하는가?
- [ ] 불변 태그로 배포되는가?

## 다음 단계

- [x] Development 문서 작성: `docs/specs/target/non-functional/development/deploy-dockerhub-tagging-strategy.md`

---

**작성일**: 2026-01-05
**담당자**: Codex
**예상 작업량**: S
