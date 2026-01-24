# Task: 운영 docker-compose 구성

> 업무 단위 설계 문서입니다.
> Feature 문서를 기반으로 **유스케이스와 엣지 케이스**를 정리합니다.

## 관련 Feature

- `docs/specs/target/non-functional/features/deploy-dockerhub-compose-config.md`

## 목표

운영용 compose에 이미지 태그, env 파일, 포트 설정을 반영한다.

## 범위

### 포함
- [x] compose 파일 수정
- [x] 이미지 태그 반영
- [x] env_file 경로 확인

### 제외
- [ ] CI 워크플로우 변경
- [ ] Nginx 설정

## 유스케이스

### UC-1: 이미지 태그 반영

**전제 조건**: immutable tag 준비

**주요 흐름**:
1. compose에 이미지 태그를 지정한다.

**결과**: 정확한 이미지가 사용된다.

### UC-2: env_file 적용

**전제 조건**: 운영 env 파일 준비

**주요 흐름**:
1. compose에 env_file 경로를 추가한다.

**결과**: 환경변수가 주입된다.

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| env 파일 누락 | 배포 중단 | High |
| 태그 오기재 | 태그 수정 | High |

## 검증 체크리스트

- [ ] 이미지 태그가 정확한가?
- [ ] env_file이 적용되었는가?
- [ ] 포트/재시작 정책이 정의되었는가?

## 다음 단계

- [x] Development 문서 작성: `docs/specs/target/non-functional/development/deploy-dockerhub-compose-config.md`

---

**작성일**: 2026-01-05
**담당자**: Codex
**예상 작업량**: M
