# Task: Docker 이미지 시크릿 제외

> 업무 단위 설계 문서입니다.
> Feature 문서를 기반으로 **유스케이스와 엣지 케이스**를 정리합니다.

## 관련 Feature

- `docs/specs/target/non-functional/features/deploy-dockerhub-secret-exclusion.md`

## 목표

이미지 빌드 컨텍스트에서 `.env`/시크릿을 제외하고 런타임 주입만 허용한다.

## 범위

### 포함
- [x] `.dockerignore` 정리
- [x] 시크릿 파일 경로 확인
- [x] 런타임 주입 규칙 정리

### 제외
- [ ] 시크릿 저장소 도입
- [ ] 키 관리 시스템 변경

## 유스케이스

### UC-1: 시크릿 제외

**전제 조건**: 시크릿 파일 목록 확보

**주요 흐름**:
1. `.dockerignore`에 시크릿 패턴을 추가한다.
2. 빌드 컨텍스트를 검증한다.

**결과**: 이미지에 시크릿이 포함되지 않는다.

### UC-2: 런타임 주입

**전제 조건**: 서버 env 파일 준비

**주요 흐름**:
1. 운영 서버에 `.env`를 배치한다.
2. compose에서 env_file을 참조한다.

**결과**: 시크릿이 런타임에만 주입된다.

## 엣지 케이스 & 예외 처리

| 상황 | 처리 방법 | 우선순위 |
|------|----------|---------|
| 시크릿 누락 | 런타임 주입 확인 | High |
| 시크릿 커밋 | 즉시 폐기 | High |

## 검증 체크리스트

- [ ] `.dockerignore`가 시크릿을 차단하는가?
- [ ] 이미지에 `.env`가 포함되지 않는가?
- [ ] 런타임 주입이 동작하는가?

## 다음 단계

- [x] Development 문서 작성: `docs/specs/target/non-functional/development/deploy-dockerhub-secret-exclusion.md`

---

**작성일**: 2026-01-05
**담당자**: Codex
**예상 작업량**: M
