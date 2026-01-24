# Task: CI 이미지 빌드/푸시

> 업무 단위 설계 문서입니다.
> Feature 문서를 기반으로 **유스케이스와 엣지 케이스**를 정리합니다.

## 관련 Feature

- `docs/specs/target/non-functional/features/deploy-dockerhub-ci-publish.md`

## 목표

CI에서 Docker 이미지를 빌드하고 Docker Hub로 push한다.

## 범위

### 포함
- [x] CI build/push 워크플로우 작성
- [x] 로그인 단계 구성
- [x] 모노레포 경로 반영

### 제외
- [ ] 운영 서버 배포
- [ ] Nginx 정적 배포

## 유스케이스

### UC-1: 이미지 빌드

**전제 조건**: 워크플로우 설정 완료

**주요 흐름**:
1. CI가 레포를 체크아웃한다.
2. 이미지를 빌드한다.

**결과**: 이미지가 생성된다.

### UC-2: 이미지 push

**전제 조건**: Docker Hub 로그인 완료

**주요 흐름**:
1. 이미지를 Docker Hub로 push한다.

**결과**: 이미지가 저장된다.

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| 빌드 실패 | 로그 확인 후 수정 | High |
| 로그인 실패 | 시크릿 확인 | High |

## 검증 체크리스트

- [ ] 워크플로우가 build/push를 수행하는가?
- [ ] 모노레포 경로가 맞는가?
- [ ] 이미지가 저장되었는가?

## 다음 단계

- [x] Development 문서 작성: `docs/specs/target/non-functional/development/deploy-dockerhub-ci-publish.md`

---

**작성일**: 2026-01-05
**담당자**: Codex
**예상 작업량**: M
