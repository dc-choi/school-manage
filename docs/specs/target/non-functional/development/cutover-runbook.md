# Development: 주말 일괄 전환(컷오버) 런북

> 구현 명세 문서입니다.
> **논리 자체에만 집중**하며, 특정 언어/프레임워크에 종속되지 않습니다.

## 관련 문서

- Feature: `docs/specs/target/non-functional/features/cutover-runbook.md`
- Task: `docs/specs/target/non-functional/tasks/cutover-runbook.md`

## 구현 개요

컷오버 실행 순서와 롤백 기준을 런북 형태로 제공한다.

## 데이터 모델

### 입력 (Input)

```
- 백엔드 이미지 태그
- 프론트 dist 산출물
- DB 변경 사항(있을 경우)
```

### 출력 (Output)

```
- 실행 순서가 명확한 런북
- 롤백 체크리스트
```

### 상태 변경

- 배포 실행 상태 기록

## 비즈니스 로직

### 1. 사전 체크

```
VERIFY 이미지 태그 준비
VERIFY dist 준비
VERIFY DB 변경/롤백 스크립트
```

### 2. 배포 순서

```
UPDATE backend container
UPDATE frontend static files
RUN smoke tests
```

### 3. 롤백 기준

```
IF smoke tests fail OR critical error THEN
  ROLLBACK backend image
  ROLLBACK frontend dist
```

## 검증 규칙 (Validation)

| 항목 | 규칙 |
|------|------|
| 사전 체크 | 모든 항목 확인 후 진행 |
| 스모크 테스트 | 핵심 플로우 통과 필수 |

## 에러 처리

| 에러 상황 | 대응 |
|----------|------|
| 배포 실패 | 즉시 롤백 |
| 테스트 실패 | 이전 버전 복구 |

## 테스트 시나리오

### 정상 케이스

1. **배포 성공**: 백엔드/프론트 업데이트 후 스모크 테스트 통과

### 예외 케이스

1. **스모크 테스트 실패**: 롤백 후 정상 상태 복구

## 구현 시 주의사항

- 이미지 태그/프론트 dist는 항상 보관
- DB 변경이 있는 경우 롤백 가능성을 반드시 확보

## AI 구현 지침

> Claude Code가 구현할 때 참고할 내용

- 관련 문서: `docs/specs/README.md`

---

**작성일**: 2026-01-05
**리뷰 상태**: Draft
