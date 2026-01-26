---
name: sdd
description: SDD 워크플로우 단계별 실행
---

# /sdd

Spec-Driven Development 워크플로우를 단계별로 실행합니다.

## 사용법

```
/sdd [단계번호]
/sdd status
```

## 워크플로우 단계

| 단계 | 담당 | 설명 |
|------|------|------|
| 0 | 작성자 | 작업 선택 → README.md 등록 |
| 1 | 작성자 | PRD/기능 설계 기반 범위 확정 |
| 2 | 작성자 → 검수자 | Feature 작성 → 검수 |
| 3 | 작성자 → 검수자 | Task 작성 → 검수 |
| 4 | 작성자 → 검수자 | Development 작성 → 검수 |
| 5 | 작성자 | 구현 + 테스트 |
| 6 | 검수자 | 정적 분석/최종 리뷰 |
| 7 | 검수자 | 문서 이동 (target → current) |
| 8 | 검수자 | 프로젝트 현황 동기화 |

## 단계별 실행

### /sdd 0 - 작업 선택
1. `docs/specs/README.md` 확인
2. TARGET 태스크 목록 출력
3. 작업 선택 안내

### /sdd 1 - 범위 확정
1. 선택된 작업의 PRD/기능 설계 확인
2. 범위 및 요구사항 정리
3. 작업 시작 준비

### /sdd 2 - Feature 작성
1. `docs/specs/templates/feature.md` 참조
2. Feature 문서 작성
3. 검수자 핸드오프 출력

### /sdd 3 - Task 작성
1. `docs/specs/templates/task.md` 참조
2. Task 문서 작성
3. 검수자 핸드오프 출력

### /sdd 4 - Development 작성
1. `docs/specs/templates/development.md` 참조
2. Development 문서 작성
3. 검수자 핸드오프 출력

### /sdd 5 - 구현
1. Development 문서 기준 코드 작성
2. 테스트 작성 및 실행
3. 검수자 핸드오프 출력

### /sdd 6 - 정적 분석
1. `pnpm lint:fix && pnpm prettier:fix`
2. `pnpm typecheck`
3. `pnpm build`
4. 리뷰 문서 작성

### /sdd 7 - 문서 이동
1. target → current 이동
2. 경로 참조 업데이트
3. README.md 인덱스 갱신

### /sdd 8 - 현황 동기화
1. PRD 체크리스트 갱신
2. 기능 설계 상태 갱신
3. STATUS.md 업데이트

### /sdd status - 현황 확인
1. 현재 진행 중인 작업 확인
2. 완료된 단계 표시
3. 다음 단계 안내

## 참조 문서

- 상세 워크플로우: `docs/specs/WORKFLOW.md`
- 템플릿: `docs/specs/templates/`
- 규칙: `.claude/rules/specs.md`